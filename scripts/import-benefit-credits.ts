/**
 * Importa Planilha de controle de benefício - 2026.xlsx (CAJU).
 * Uso: npx tsx scripts/import-benefit-credits.ts
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const YEAR = 2026;
const XLSX_PATH = join(process.cwd(), "Planilha de controle de benefício - 2026.xlsx");

const MONTH_LABELS: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};

type RawRow = {
  monthNumber: number;
  year: number;
  isProportional: boolean;
  cpf: string;
  employeeName: string;
  departmentName: string;
  workDays: number | null;
  workDaysNote: string | null;
  mealAmount: number | null;
  mobilityAmount: number | null;
  mobilityNote: string | null;
  transportAmount: number | null;
  startDate: string | null;
  orderDate: string | null;
};

function onlyDigits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeCpf(value: unknown): string {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return digits.padStart(11, "0").slice(-11);
}

function cleanName(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function foldName(value: string): string {
  return cleanName(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "")
    .toLowerCase();
}

function extractViaPython(): RawRow[] {
  const jsonPath = join(process.cwd(), "scripts", "_tmp_benefit_extract.json");
  const py = `
import json, re, openpyxl
from datetime import datetime, date

wb = openpyxl.load_workbook(r${JSON.stringify(XLSX_PATH)}, data_only=True)
rows_out = []

def digits(v):
    return re.sub(r"\\D", "", str(v or ""))

def clean(v):
    return re.sub(r"\\s+", " ", str(v or "").replace("\\xa0", " ")).strip()

def parse_sheet_meta(title):
    t = title.lower().replace("_x0009_", " ").strip()
    prop = "propor" in t
    m = re.search(r"(\\d{1,2})\\s*[-./]?\\s*(\\d{4})", t)
    if m:
        return int(m.group(1)), int(m.group(2)), prop
    m2 = re.search(r"(\\d{1,2})\\s+(\\d{4})", t)
    if m2:
        return int(m2.group(1)), int(m2.group(2)), prop
    return None, None, prop

def money(v):
    if v is None: return None, None
    if isinstance(v, (int, float)):
        return float(v), None
    s = clean(v)
    if not s or s in {"-", "—", ""}: return None, None
    low = s.lower()
    if any(k in low for k in ["vt", "vale", "raio", "transporte"]):
        return None, s
    try:
        return float(s.replace(",", ".")), None
    except:
        return None, s

def days(v):
    if v is None: return None, None
    if isinstance(v, (int, float)): return float(v), None
    s = clean(v)
    if not s or s in {"-", "—"}: return None, None
    if s.lower() in {"fixo", "+"}: return None, s
    try: return float(s.replace(",", ".")), None
    except: return None, s

def iso(v):
    if isinstance(v, datetime): return v.date().isoformat()
    if isinstance(v, date): return v.isoformat()
    return None

for sheet_name in wb.sheetnames:
    month, year, sheet_prop = parse_sheet_meta(sheet_name)
    if not month or not year: continue
    ws = wb[sheet_name]
    header_row = None
    cols = {}
    for r in range(1, min(ws.max_row or 1, 40) + 1):
        found = {}
        for c in range(1, (ws.max_column or 1) + 1):
            v = ws.cell(r, c).value
            if v is None: continue
            s = clean(v).lower()
            if s.startswith("cpf"): found["cpf"] = c
            elif "nome" in s: found["name"] = c
            elif s.startswith("setor"): found["dept"] = c
            elif "dias" in s: found["days"] = c
            elif "aliment" in s: found["meal"] = c
            elif "mobilidade" in s: found["mobility"] = c
            elif "vale transporte" in s or s == "vale transporte": found["vt"] = c
            elif "início" in s or "inicio" in s: found["start"] = c
            elif "pedido" in s: found["order"] = c
        if "cpf" in found and "name" in found:
            header_row = r
            cols = found
            break
    if not header_row: continue

    for r in range(header_row + 1, (ws.max_row or 0) + 1):
        name = clean(ws.cell(r, cols["name"]).value) if cols.get("name") else ""
        cpf = digits(ws.cell(r, cols["cpf"]).value) if cols.get("cpf") else ""
        if not name or name.lower().startswith("benef") or name.lower() == "nome completo":
            continue
        if not cpf and not name: continue
        dept = clean(ws.cell(r, cols["dept"]).value) if cols.get("dept") else ""
        wd, wd_note = days(ws.cell(r, cols["days"]).value) if cols.get("days") else (None, None)
        meal, _ = money(ws.cell(r, cols["meal"]).value) if cols.get("meal") else (None, None)
        mob_amt, mob_note = money(ws.cell(r, cols["mobility"]).value) if cols.get("mobility") else (None, None)
        vt_amt, vt_note = money(ws.cell(r, cols["vt"]).value) if cols.get("vt") else (None, None)
        # if VT column missing, mobility note may hold VT label
        if vt_amt is None and vt_note:
            mob_note = mob_note or vt_note
        start = iso(ws.cell(r, cols["start"]).value) if cols.get("start") else None
        order = iso(ws.cell(r, cols["order"]).value) if cols.get("order") else None
        if meal is None and mob_amt is None and vt_amt is None and not mob_note and not wd and not wd_note:
            continue
        rows_out.append({
            "monthNumber": month,
            "year": year,
            "isProportional": bool(sheet_prop or start),
            "cpf": cpf,
            "employeeName": name,
            "departmentName": dept,
            "workDays": wd,
            "workDaysNote": wd_note,
            "mealAmount": meal,
            "mobilityAmount": mob_amt,
            "mobilityNote": mob_note,
            "transportAmount": vt_amt,
            "startDate": start,
            "orderDate": order,
        })

with open(r${JSON.stringify(jsonPath)}, "w", encoding="utf-8") as f:
    json.dump(rows_out, f, ensure_ascii=False)
`;
  const tmp = join(process.cwd(), "scripts", "_tmp_benefit_extract.py");
  writeFileSync(tmp, py, "utf8");
  try {
    execFileSync("python", ["-X", "utf8", tmp], {
      encoding: "utf8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    return JSON.parse(readFileSync(jsonPath, "utf8"));
  } finally {
    for (const file of [tmp, jsonPath]) {
      try {
        unlinkSync(file);
      } catch {
        /* ignore */
      }
    }
  }
}

async function main() {
  const raw = extractViaPython();
  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, cpf: true },
  });
  const byCpf = new Map(
    employees.filter((e) => e.cpf).map((e) => [normalizeCpf(e.cpf), e] as const),
  );
  const byFoldedName = new Map(employees.map((e) => [foldName(e.name), e] as const));

  function matchEmployee(cpf: string, employeeName: string) {
    if (cpf && byCpf.has(cpf)) return byCpf.get(cpf)!;
    const folded = foldName(employeeName);
    if (folded && byFoldedName.has(folded)) return byFoldedName.get(folded)!;
    const parts = folded.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      for (const [key, emp] of byFoldedName) {
        if (key.startsWith(parts[0]) && key.endsWith(parts[parts.length - 1])) return emp;
      }
    }
    return null;
  }

  const map = new Map<string, RawRow>();
  for (const row of raw) {
    const cpf = normalizeCpf(row.cpf);
    const key = `${row.year}-${row.monthNumber}-${cpf || foldName(row.employeeName)}-${row.isProportional ? "p" : "f"}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...row, cpf });
      continue;
    }
    // Prefer row with more filled amounts
    const score = (r: RawRow) =>
      (r.mealAmount ? 1 : 0) + (r.mobilityAmount ? 1 : 0) + (r.transportAmount ? 1 : 0);
    if (score(row) >= score(existing)) map.set(key, { ...row, cpf });
  }

  await prisma.benefitCredit.deleteMany({ where: { year: YEAR } });

  let linked = 0;
  let proportional = 0;
  let index = 0;
  for (const row of map.values()) {
    index += 1;
    const match = matchEmployee(row.cpf, row.employeeName);
    if (match) linked += 1;
    if (row.isProportional) proportional += 1;

    await prisma.benefitCredit.create({
      data: {
        id: `benefit_${YEAR}_${String(index).padStart(4, "0")}`,
        employeeId: match?.id ?? null,
        employeeName: match?.name ?? cleanName(row.employeeName),
        cpf: row.cpf || match?.cpf || null,
        year: row.year,
        monthLabel: MONTH_LABELS[row.monthNumber] ?? String(row.monthNumber),
        monthNumber: row.monthNumber,
        departmentName: row.departmentName || null,
        workDays: row.workDays,
        workDaysNote: row.workDaysNote,
        mealAmount: row.mealAmount,
        mobilityAmount: row.mobilityAmount,
        mobilityNote: row.mobilityNote,
        transportAmount: row.transportAmount,
        isProportional: row.isProportional,
        startDate: row.startDate ? new Date(`${row.startDate}T12:00:00.000Z`) : null,
        orderDate: row.orderDate ? new Date(`${row.orderDate}T12:00:00.000Z`) : null,
        notes: row.isProportional
          ? "Crédito proporcional (admissão / início no mês)."
          : "Crédito mensal CAJU.",
      },
    });
  }

  const all = Array.from(map.values());
  console.log(
    JSON.stringify(
      {
        year: YEAR,
        credits: map.size,
        linked,
        proportional,
        mealTotal: all.reduce((s, r) => s + (r.mealAmount ?? 0), 0),
        mobilityTotal: all.reduce((s, r) => s + (r.mobilityAmount ?? 0), 0),
        transportTotal: all.reduce((s, r) => s + (r.transportAmount ?? 0), 0),
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
