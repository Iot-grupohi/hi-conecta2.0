/**
 * Importa PLanilha Modelo IFOOD (1).xlsx — bonificações do mês.
 * Campo "Livre" = valor da bonificação.
 *
 * Uso: npx tsx scripts/import-ifood-bonuses.ts
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const YEAR = 2026;
const MONTH = 10; // Outubro — mês corrente da planilha
const MONTH_LABEL = "Outubro";
const XLSX_PATH = join(process.cwd(), "PLanilha Modelo IFOOD (1).xlsx");

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

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const raw = String(value).replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type RawRow = {
  employeeName: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  costCenter: string | null;
  amount: number;
  mealPatAmount: number | null;
  ifoodEatAmount: number | null;
};

function extractViaPython(): RawRow[] {
  const py = `
import json, re, openpyxl
wb = openpyxl.load_workbook(r${JSON.stringify(XLSX_PATH)}, data_only=True)
ws = wb.active
rows_out = []

def digits(v):
    return re.sub(r"\\D", "", str(v or ""))

def clean(v):
    return re.sub(r"\\s+", " ", str(v or "").replace("\\xa0", " ")).strip()

def num(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None

for r in range(2, ws.max_row + 1):
    name = clean(ws.cell(r, 2).value)
    if not name:
        continue
    amount = num(ws.cell(r, 8).value)
    if amount is None:
        continue
    cpf = digits(ws.cell(r, 3).value)
    if cpf:
        cpf = cpf.zfill(11)[-11:]
    phone = clean(ws.cell(r, 6).value) or None
    email = clean(ws.cell(r, 5).value) or None
    cost = clean(ws.cell(r, 7).value) or None
    rows_out.append({
        "employeeName": name,
        "cpf": cpf,
        "email": email,
        "phone": phone,
        "costCenter": cost,
        "amount": amount,
        "mealPatAmount": num(ws.cell(r, 9).value),
        "ifoodEatAmount": num(ws.cell(r, 10).value),
    })

out_path = r${JSON.stringify(join(process.cwd(), "scripts", "_tmp_ifood_extract.json"))}
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(rows_out, f, ensure_ascii=False)
print(out_path)
`;
  const tmp = join(process.cwd(), "scripts", "_tmp_ifood_extract.py");
  const outJson = join(process.cwd(), "scripts", "_tmp_ifood_extract.json");
  writeFileSync(tmp, py, "utf8");
  try {
    execFileSync("python", [tmp], { stdio: "inherit" });
    return JSON.parse(readFileSync(outJson, "utf8")) as RawRow[];
  } finally {
    for (const file of [tmp, outJson]) {
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
      const hint = `${parts[0]} ${parts[parts.length - 1]}`;
      for (const [key, emp] of byFoldedName) {
        if (key.startsWith(parts[0]) && key.endsWith(parts[parts.length - 1])) return emp;
        if (key.includes(hint)) return emp;
      }
    }
    return null;
  }

  await prisma.ifoodBonus.deleteMany({ where: { year: YEAR, monthNumber: MONTH } });

  let linked = 0;
  let index = 0;
  let total = 0;
  for (const row of raw) {
    index += 1;
    const cpf = normalizeCpf(row.cpf);
    const match = matchEmployee(cpf, row.employeeName);
    if (match) linked += 1;
    total += row.amount;

    await prisma.ifoodBonus.create({
      data: {
        id: `ifood_${YEAR}_${MONTH}_${String(index).padStart(4, "0")}`,
        employeeId: match?.id ?? null,
        employeeName: match?.name ?? row.employeeName,
        cpf: cpf || match?.cpf || null,
        email: row.email,
        phone: row.phone,
        costCenter: row.costCenter,
        year: YEAR,
        monthLabel: MONTH_LABEL,
        monthNumber: MONTH,
        amount: row.amount,
        mealPatAmount: row.mealPatAmount,
        ifoodEatAmount: row.ifoodEatAmount,
        notes: `Bonificação IFOOD · ${MONTH_LABEL}/${YEAR}`,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        year: YEAR,
        month: MONTH_LABEL,
        bonuses: raw.length,
        linked,
        unmatched: raw.length - linked,
        totalAmount: Math.round(total * 100) / 100,
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
