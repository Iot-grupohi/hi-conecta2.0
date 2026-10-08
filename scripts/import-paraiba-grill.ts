/**
 * Importa Controle Paraiba Grill 2026.xlsx → crédito em restaurante parceiro
 * até liberação do vale alimentação.
 *
 * Uso: npx tsx scripts/import-paraiba-grill.ts
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const PARTNER = "Paraíba Grill";
const UNIT_VALUE = 23;
const YEAR = 2026;
const XLSX_PATH = join(process.cwd(), "Controle Paraiba Grill 2026.xlsx");

const MONTH_MAP: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatOrderDates(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") {
    // excel serial unlikely here; treat as ISO-ish via python already
    return String(value);
  }
  return String(value);
}

function matchEmployee(
  rawName: string,
  employees: Array<{ id: string; name: string; status: string; mealAllowance: number | null }>,
) {
  const key = norm(rawName);
  if (!key || key === "tecnica" || key === "tecnico") return null;

  const scored = employees
    .map((employee) => {
      const en = norm(employee.name);
      let score = 0;
      if (en === key) score = 100;
      else if (en.startsWith(key + " ") || en.includes(" " + key + " ")) score = 80;
      else if (key.split(" ").every((part) => part.length > 1 && en.includes(part))) score = 60;
      else if (en.includes(key) || key.includes(en.split(" ")[0] ?? "")) score = 40;
      else return null;

      if (employee.status === "ativo") score += 10;
      if (employee.mealAllowance != null) score += 5;
      return { employee, score };
    })
    .filter(Boolean) as Array<{
    employee: { id: string; name: string; status: string; mealAllowance: number | null };
    score: number;
  }>;

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score >= 40 ? scored[0].employee : null;
}

function extractViaPython(): {
  pedidos: Array<{
    monthLabel: string;
    employeeName: string;
    orderDates: string;
    quantity: number;
  }>;
  daily: Array<{
    date: string;
    quantity: number;
    consumptionValue: number;
    deliveryFee: number | null;
    dayTotal: number;
  }>;
} {
  const py = `
import json, openpyxl
from datetime import datetime, date
wb = openpyxl.load_workbook(r${JSON.stringify(XLSX_PATH)}, data_only=True)

def cell_str(v):
    if v is None: return ""
    if isinstance(v, datetime): return v.strftime("%d/%m")
    if isinstance(v, date): return v.strftime("%d/%m")
    return str(v).strip()

def num(v):
    if v is None or v == "" or v == "-": return None
    if isinstance(v, (int, float)): return float(v)
    s = str(v).replace("R$", "").replace(" ", "").replace(",", ".")
    try: return float(s)
    except: return None

pedidos = []
ws = wb["Controle de Pedidos"]
for row in ws.iter_rows(min_row=4, values_only=True):
    month, name, dates, qty = (row + (None, None, None, None))[:4]
    if not month or not name: continue
    q = int(qty or 0)
    if q <= 0: continue
    pedidos.append({
        "monthLabel": str(month).strip(),
        "employeeName": str(name).strip(),
        "orderDates": cell_str(dates),
        "quantity": q,
    })

daily = []
ws2 = wb["Resumo Financeiro"]
for row in ws2.iter_rows(min_row=1, values_only=True):
    d, q, cons, fee, total = (row + (None,)*5)[:5]
    if not isinstance(d, (datetime, date)): continue
    qq = int(q or 0)
    if qq <= 0: continue
    iso = d.date().isoformat() if isinstance(d, datetime) else d.isoformat()
    daily.append({
        "date": iso,
        "quantity": qq,
        "consumptionValue": num(cons) or 0,
        "deliveryFee": num(fee),
        "dayTotal": num(total) or 0,
    })

print(json.dumps({"pedidos": pedidos, "daily": daily}, ensure_ascii=False))
`;
  const tmp = join(process.cwd(), "scripts", "_tmp_paraiba_extract.py");
  writeFileSync(tmp, py, "utf8");
  try {
    const out = execFileSync("python", [tmp], { encoding: "utf8" });
    return JSON.parse(out);
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  const data = extractViaPython();
  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, status: true, mealAllowance: true },
  });

  await prisma.mealPartnerCredit.deleteMany({ where: { partnerName: PARTNER, year: YEAR } });
  await prisma.mealPartnerDailySummary.deleteMany({
    where: { partnerName: PARTNER, year: YEAR },
  });

  let linked = 0;
  for (const [index, row] of data.pedidos.entries()) {
    const monthNumber = MONTH_MAP[norm(row.monthLabel)] ?? 0;
    const match = matchEmployee(row.employeeName, employees);
    if (match) linked += 1;

    await prisma.mealPartnerCredit.create({
      data: {
        id: `mpc_${YEAR}_${String(index + 1).padStart(3, "0")}`,
        employeeId: match?.id ?? null,
        employeeName: match?.name ?? row.employeeName,
        partnerName: PARTNER,
        year: YEAR,
        monthLabel: row.monthLabel,
        monthNumber,
        orderDates: formatOrderDates(row.orderDates),
        quantity: row.quantity,
        unitValue: UNIT_VALUE,
        consumptionValue: row.quantity * UNIT_VALUE,
        notes: "Crédito temporário no restaurante parceiro até liberação do vale alimentação.",
      },
    });
  }

  for (const [index, row] of data.daily.entries()) {
    await prisma.mealPartnerDailySummary.create({
      data: {
        id: `mpd_${YEAR}_${String(index + 1).padStart(3, "0")}`,
        partnerName: PARTNER,
        date: new Date(`${row.date}T12:00:00.000Z`),
        year: YEAR,
        quantity: row.quantity,
        consumptionValue: row.consumptionValue,
        deliveryFee: row.deliveryFee,
        dayTotal: row.dayTotal,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        partner: PARTNER,
        credits: data.pedidos.length,
        linked,
        daily: data.daily.length,
        consumptionTotal: data.pedidos.reduce((s, r) => s + r.quantity * UNIT_VALUE, 0),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma["$disconnect"]());
