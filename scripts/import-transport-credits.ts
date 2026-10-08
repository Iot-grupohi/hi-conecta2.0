/**
 * Importa Planilha de Vale Transporte 2026.xlsx
 * Uso: npx tsx scripts/import-transport-credits.ts
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const YEAR = 2026;
const XLSX_PATH = join(process.cwd(), "Planilha de Vale Transporte 2026.xlsx");

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
  employeeName: string;
  departmentName: string;
  status: string;
  location: string;
  cardNumber: string;
  fare1: number | null;
  fare2: number | null;
  tripsPerDay: number | null;
  dailyValue: number | null;
  days: number | null;
  totalAmount: number;
  balance: number | null;
};

function cleanName(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
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
  const jsonPath = join(process.cwd(), "scripts", "_tmp_transport_extract.json");
  const py = `
import json, re, openpyxl

wb = openpyxl.load_workbook(r${JSON.stringify(XLSX_PATH)}, data_only=True, read_only=True)
rows_out = []

def clean(v):
    return re.sub(r"\\s+", " ", str(v or "").replace("\\xa0", " ").replace("\\t", " ")).strip()

def num(v):
    if v is None: return None
    if isinstance(v, (int, float)): return float(v)
    s = clean(v)
    if not s or s in {"-", "—"}: return None
    try: return float(s.replace(",", "."))
    except: return None

def parse_sheet_meta(title):
    t = title.lower().replace("_x0009_", " ").strip()
    prop = "propor" in t
    m = re.search(r"(\\d{1,2})\\s*[-./]?\\s*(\\d{4})", t)
    if m: return int(m.group(1)), int(m.group(2)), prop
    return None, None, prop

for sheet_name in wb.sheetnames:
    month, year, sheet_prop = parse_sheet_meta(sheet_name)
    if not month or not year: continue
    ws = wb[sheet_name]
    # collect limited rows
    matrix = []
    for i, row in enumerate(ws.iter_rows(values_only=True), 1):
        if i > 80: break
        matrix.append(list(row))

    # find all header rows (some proportional sheets repeat headers)
    header_idxs = []
    for i, row in enumerate(matrix):
        labels = [clean(c).lower() for c in row if c is not None]
        if any("colaborador" in x for x in labels) and any("departamento" in x for x in labels):
            header_idxs.append(i)
    if not header_idxs: continue

    for hi in header_idxs:
        header = matrix[hi]
        cols = {}
        for c, val in enumerate(header):
            if val is None: continue
            s = clean(val).lower()
            if "colaborador" in s: cols["name"] = c
            elif "departamento" in s: cols["dept"] = c
            elif "situa" in s: cols["status"] = c
            elif s.startswith("local"): cols["location"] = c
            elif "cart" in s: cols["card"] = c
            elif "passagem 1" in s or s.endswith("passagem 1"): cols["fare1"] = c
            elif "passagem 2" in s: cols["fare2"] = c
            elif "qtd dia" in s: cols["trips"] = c
            elif "valor/dia" in s or "valor dia" in s: cols["daily"] = c
            elif "qntd dias" in s or "qtd dias" in s: cols["days"] = c
            elif s.startswith("total"): cols["total"] = c
            elif "saldo" in s: cols["balance"] = c

        if "name" not in cols: continue
        next_header = header_idxs[header_idxs.index(hi) + 1] if hi in header_idxs and header_idxs.index(hi) + 1 < len(header_idxs) else len(matrix)

        for r in range(hi + 1, next_header):
            row = matrix[r]
            name = clean(row[cols["name"]]) if cols["name"] < len(row) else ""
            if not name or "colaborador" in name.lower() or name.lower().startswith("vale transporte"):
                continue
            total = num(row[cols["total"]]) if "total" in cols and cols["total"] < len(row) else None
            days = num(row[cols["days"]]) if "days" in cols and cols["days"] < len(row) else None
            daily = num(row[cols["daily"]]) if "daily" in cols and cols["daily"] < len(row) else None
            trips = num(row[cols["trips"]]) if "trips" in cols and cols["trips"] < len(row) else None
            fare1 = num(row[cols["fare1"]]) if "fare1" in cols and cols["fare1"] < len(row) else None
            fare2 = num(row[cols["fare2"]]) if "fare2" in cols and cols["fare2"] < len(row) else None
            if total is None and days is not None and daily is not None:
                total = days * daily
            if total is None:
                total = 0
            # skip empty totals with no days (but keep zero? skip if no meaningful data)
            if total == 0 and not days and not daily and not trips:
                continue
            rows_out.append({
                "monthNumber": month,
                "year": year,
                "isProportional": bool(sheet_prop),
                "employeeName": name,
                "departmentName": clean(row[cols["dept"]]) if "dept" in cols and cols["dept"] < len(row) else "",
                "status": clean(row[cols["status"]]) if "status" in cols and cols["status"] < len(row) else "",
                "location": clean(row[cols["location"]]) if "location" in cols and cols["location"] < len(row) else "",
                "cardNumber": clean(row[cols["card"]]) if "card" in cols and cols["card"] < len(row) else "",
                "fare1": fare1,
                "fare2": fare2,
                "tripsPerDay": trips,
                "dailyValue": daily,
                "days": days,
                "totalAmount": float(total),
                "balance": num(row[cols["balance"]]) if "balance" in cols and cols["balance"] < len(row) else None,
            })

wb.close()
with open(r${JSON.stringify(jsonPath)}, "w", encoding="utf-8") as f:
    json.dump(rows_out, f, ensure_ascii=False)
`;
  const tmp = join(process.cwd(), "scripts", "_tmp_transport_extract.py");
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
    select: { id: true, name: true },
  });
  const byFoldedName = new Map(employees.map((e) => [foldName(e.name), e] as const));

  function matchEmployee(employeeName: string) {
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
    const key = `${row.year}-${row.monthNumber}-${foldName(row.employeeName)}-${row.isProportional ? "p" : "f"}`;
    const existing = map.get(key);
    if (!existing || row.totalAmount >= existing.totalAmount) {
      map.set(key, row);
    }
  }

  await prisma.transportCredit.deleteMany({ where: { year: YEAR } });

  let linked = 0;
  let proportional = 0;
  let index = 0;
  for (const row of map.values()) {
    index += 1;
    const match = matchEmployee(row.employeeName);
    if (match) linked += 1;
    if (row.isProportional) proportional += 1;

    await prisma.transportCredit.create({
      data: {
        id: `vt_${YEAR}_${String(index).padStart(4, "0")}`,
        employeeId: match?.id ?? null,
        employeeName: match?.name ?? cleanName(row.employeeName),
        year: row.year,
        monthLabel: MONTH_LABELS[row.monthNumber] ?? String(row.monthNumber),
        monthNumber: row.monthNumber,
        departmentName: row.departmentName || null,
        status: row.status || null,
        location: row.location || null,
        cardNumber: row.cardNumber || null,
        fare1: row.fare1,
        fare2: row.fare2,
        tripsPerDay: row.tripsPerDay,
        dailyValue: row.dailyValue,
        days: row.days,
        totalAmount: row.totalAmount,
        isProportional: row.isProportional,
        balance: row.balance,
        notes: row.isProportional
          ? "Vale transporte proporcional."
          : "Vale transporte mensal.",
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        year: YEAR,
        credits: map.size,
        linked,
        proportional,
        totalAmount: Array.from(map.values()).reduce((s, r) => s + r.totalAmount, 0),
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
