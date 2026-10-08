/**
 * Importa Crédito lavanderia 2026.xlsx
 * Regra: R$ 120 padrão; valor proporcional quando informado (admissão no meio do mês).
 *
 * Uso: npx tsx scripts/import-laundry-credits.ts
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const YEAR = 2026;
const FULL_AMOUNT = 120;
const XLSX_PATH = join(process.cwd(), "Crédito lavanderia 2026.xlsx");

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

/** Excel sometimes stores ã/á as Latin-1 Ã/Á — normalize common cases for matching. */
function repairExcelName(value: string): string {
  return cleanName(value)
    .replace(/\uFFFD/g, "")
    .replace(/LE\u00C3O/gi, "LEÃO")
    .replace(/S\u00C1\b/gi, "SÁ")
    .replace(/([A-Z])\u00C3([A-Z])/gi, "$1Ã$2");
}

function extractViaPython(): Array<{
  monthNumber: number;
  year: number;
  employeeName: string;
  cpf: string;
  amount: number;
  isProportional: boolean;
}> {
  const py = `
import json, re, openpyxl
from openpyxl.utils import get_column_letter

wb = openpyxl.load_workbook(r${JSON.stringify(XLSX_PATH)}, data_only=True)
FULL = ${FULL_AMOUNT}
rows_out = []

def digits(v):
    return re.sub(r"\\D", "", str(v or ""))

def clean(v):
    return re.sub(r"\\s+", " ", str(v or "").replace("\\xa0", " ")).strip()

def parse_sheet_meta(title):
    t = title.lower().replace("_x0009_", " ").strip()
    # 08-26 / 08/26
    m = re.search(r"(proporcional|porporcional)?\\s*(\\d{1,2})[./\\-\\s]+(\\d{2,4})", t)
    if m:
        month = int(m.group(2))
        year = int(m.group(3))
        if year < 100: year += 2000
        prop = bool(m.group(1)) or "propor" in t
        return month, year, prop
    m2 = re.search(r"^(\\d{1,2})\\s+(\\d{4})", t)
    if m2:
        return int(m2.group(1)), int(m2.group(2)), "propor" in t
    return None, None, False

for sheet_name in wb.sheetnames:
    month, year, sheet_prop = parse_sheet_meta(sheet_name)
    if not month or not year:
        continue
    ws = wb[sheet_name]
    # find header row with NOME
    header_row = None
    name_col = cpf_col = amount_col = None
    for r in range(1, min(ws.max_row or 1, 30) + 1):
        vals = []
        for c in range(1, (ws.max_column or 1) + 1):
            v = ws.cell(r, c).value
            if v is None: continue
            s = clean(v).lower()
            vals.append((c, s))
        labels = {s: c for c, s in vals}
        if any(k.startswith("nome") for k in labels):
            header_row = r
            for c, s in vals:
                if s.startswith("nome"): name_col = c
                elif "cpf" in s: cpf_col = c
                elif "proporcional" in s or s in ("valor", "valor "): amount_col = c
            break
    if not header_row or not name_col:
        # sheets without header (Porporcional 08-26 style): scan all rows for name+cpf+value
        for r in range(1, (ws.max_row or 0) + 1):
            cells = [ws.cell(r, c).value for c in range(1, (ws.max_column or 1) + 1)]
            cells = [x for x in cells if x is not None and clean(x) != ""]
            if len(cells) < 2: continue
            name = None; cpf = None; amount = None
            for cell in cells:
                d = digits(cell)
                if isinstance(cell, (int, float)) and not (11 <= len(d) <= 11 and d.isdigit() and len(str(int(cell)))>=10):
                    # numeric amount candidate
                    if 0 < float(cell) <= FULL * 2:
                        amount = float(cell)
                        continue
                if len(d) >= 10 and len(d) <= 11:
                    cpf = d
                    continue
                if isinstance(cell, str) and len(clean(cell)) > 3 and not clean(cell).lower().startswith("ikli"):
                    name = clean(cell)
            if name and (cpf or amount is not None):
                amt = amount if amount is not None else FULL
                rows_out.append({
                    "monthNumber": month,
                    "year": year,
                    "employeeName": name,
                    "cpf": cpf or "",
                    "amount": amt,
                    "isProportional": True if sheet_prop or (amount is not None and abs(amount - FULL) > 0.01) else False,
                })
        continue

    for r in range(header_row + 1, (ws.max_row or 0) + 1):
        name = clean(ws.cell(r, name_col).value)
        if not name or name.lower().startswith("ikli") or name.lower() == "nome":
            continue
        cpf = digits(ws.cell(r, cpf_col).value) if cpf_col else ""
        raw_amt = ws.cell(r, amount_col).value if amount_col else None
        amount = FULL
        is_prop = sheet_prop
        if isinstance(raw_amt, (int, float)):
            amount = float(raw_amt)
            if abs(amount - FULL) > 0.01:
                is_prop = True
        elif isinstance(raw_amt, str) and digits(raw_amt):
            try:
                amount = float(str(raw_amt).replace(",", "."))
                if abs(amount - FULL) > 0.01:
                    is_prop = True
            except: pass
        rows_out.append({
            "monthNumber": month,
            "year": year,
            "employeeName": name,
            "cpf": cpf,
            "amount": amount,
            "isProportional": bool(is_prop),
        })

out_path = r${JSON.stringify(join(process.cwd(), "scripts", "_tmp_laundry_extract.json"))}
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(rows_out, f, ensure_ascii=False)
print(out_path)
`;
  const tmp = join(process.cwd(), "scripts", "_tmp_laundry_extract.py");
  const jsonPath = join(process.cwd(), "scripts", "_tmp_laundry_extract.json");
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
    employees
      .filter((e) => e.cpf)
      .map((e) => [normalizeCpf(e.cpf), e] as const),
  );
  const byFoldedName = new Map(
    employees.map((e) => [foldName(e.name), e] as const),
  );

  function matchEmployee(cpf: string, employeeName: string) {
    if (cpf && byCpf.has(cpf)) return byCpf.get(cpf)!;
    const folded = foldName(repairExcelName(employeeName));
    if (folded && byFoldedName.has(folded)) return byFoldedName.get(folded)!;
    // partial: first + last token
    const parts = folded.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      const hint = `${parts[0]} ${parts[parts.length - 1]}`;
      for (const [key, emp] of byFoldedName) {
        if (key.startsWith(parts[0]) && key.endsWith(parts[parts.length - 1])) {
          return emp;
        }
        if (key.includes(hint)) return emp;
      }
    }
    return null;
  }

  // Deduplicate: key year-month-cpf|name — proportional / explicit amount wins over default 120
  const map = new Map<
    string,
    {
      monthNumber: number;
      year: number;
      employeeName: string;
      cpf: string;
      amount: number;
      isProportional: boolean;
    }
  >();

  for (const row of raw) {
    const cpf = normalizeCpf(row.cpf);
    const normalized = {
      ...row,
      cpf,
      isProportional: row.amount < FULL_AMOUNT - 0.01,
    };
    const key = `${normalized.year}-${normalized.monthNumber}-${cpf || cleanName(normalized.employeeName).toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, normalized);
      continue;
    }
    // Prefer proportional / non-full amount when conflicting
    if (normalized.isProportional && !existing.isProportional) {
      map.set(key, normalized);
    } else if (
      normalized.isProportional === existing.isProportional &&
      normalized.amount !== FULL_AMOUNT
    ) {
      map.set(key, normalized);
    }
  }

  await prisma.laundryCredit.deleteMany({ where: { year: YEAR } });

  let linked = 0;
  let proportional = 0;
  let index = 0;
  for (const row of map.values()) {
    index += 1;
    const match = matchEmployee(row.cpf, row.employeeName);
    if (match) linked += 1;
    const isProportional = row.amount < FULL_AMOUNT - 0.01;
    if (isProportional) proportional += 1;

    await prisma.laundryCredit.create({
      data: {
        id: `laundry_${YEAR}_${String(index).padStart(4, "0")}`,
        employeeId: match?.id ?? null,
        // Prefer cadastro name (UTF-8 correto) over Excel broken accents
        employeeName: match?.name ?? repairExcelName(row.employeeName),
        cpf: row.cpf || match?.cpf || null,
        year: row.year,
        monthLabel: MONTH_LABELS[row.monthNumber] ?? String(row.monthNumber),
        monthNumber: row.monthNumber,
        amount: row.amount,
        fullAmount: FULL_AMOUNT,
        isProportional,
        notes: isProportional
          ? "Valor proporcional (admissão no meio do mês)."
          : Math.abs(row.amount - FULL_AMOUNT) > 0.01
            ? "Valor ajustado no mês."
            : "Crédito mensal padrão de lavanderia (R$ 120).",
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        year: YEAR,
        fullAmount: FULL_AMOUNT,
        credits: map.size,
        linked,
        proportional,
        totalAmount: Array.from(map.values()).reduce((s, r) => s + r.amount, 0),
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
