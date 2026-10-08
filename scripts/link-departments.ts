import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inferDepartmentId(
  source: string,
  departments: Array<{ id: string; name: string }>,
): string | null {
  const key = normalize(source);
  if (!key) return null;

  for (const dept of departments) {
    const n = normalize(dept.name);
    if (!n) continue;
    if (key === n || key.includes(n) || n.includes(key)) return dept.id;
  }

  const rules: Array<{ match: RegExp; ids: string[] }> = [
    { match: /\bti\b|tecnolog|helpdesk|suporte|infra|seguranca|informa/, ids: ["dep_021", "dep_020", "dep_014"] },
    { match: /desenvolv|dev\b|arquitet|software|programa|dados|bi\b/, ids: ["dep_003", "dep_021"] },
    { match: /marketing|performan|trafego|designer|social|copy|video|conteudo/, ids: ["dep_001", "dep_016", "dep_018"] },
    { match: /expansao|comercial|vendas|closer|sdr|concierge/, ids: ["dep_002"] },
    { match: /novos neg|internacional|cro\b|cxo\b|socio|franchising/, ids: ["dep_004", "dep_002"] },
    { match: /\bcs\b|sucesso|customer|backoff/, ids: ["dep_012"] },
    { match: /juridic|advogad/, ids: ["dep_005"] },
    { match: /financeiro|contabil|fiscal|tesouraria|contas a|compras|auditoria/, ids: ["dep_009"] },
    { match: /gente|gestao|rh\b|recrut|selecao|\bdp\b|pessoas|recursos humanos/, ids: ["dep_008"] },
    { match: /operac|operador|lavanderia|montagem|servicos|logist/, ids: ["dep_006", "dep_026"] },
    { match: /onboard/, ids: ["dep_010"] },
    { match: /administrat|projetos/, ids: ["dep_017"] },
    { match: /consultor/, ids: ["dep_019", "dep_002"] },
    { match: /qsgi|qualidade/, ids: ["dep_023"] },
    { match: /\bnrp\b/, ids: ["dep_011"] },
    { match: /\bnrs\b/, ids: ["dep_013"] },
    { match: /\bnpf\b/, ids: ["dep_024"] },
    { match: /franquia/, ids: ["dep_025"] },
    { match: /p d\b|pesquisa/, ids: ["dep_022"] },
    { match: /tecnic/, ids: ["dep_007", "dep_015"] },
    { match: /relacionam/, ids: ["dep_016", "dep_014", "dep_018"] },
  ];

  const deptIds = new Set(departments.map((d) => d.id));
  for (const rule of rules) {
    if (!rule.match.test(key)) continue;
    for (const id of rule.ids) {
      if (deptIds.has(id)) return id;
    }
  }

  return null;
}

async function main() {
  const departments = await prisma.department.findMany();
  const positions = await prisma.position.findMany();

  let positionsUpdated = 0;
  for (const position of positions) {
    if (position.departmentId) continue;
    const inferred = inferDepartmentId(position.name, departments);
    if (!inferred) {
      console.log("position unresolved:", position.name);
      continue;
    }
    await prisma.position.update({
      where: { id: position.id },
      data: { departmentId: inferred },
    });
    positionsUpdated += 1;
  }

  const positionsAfter = await prisma.position.findMany();
  const positionById = new Map(positionsAfter.map((p) => [p.id, p]));
  const positionByName = new Map<string, (typeof positionsAfter)[number]>();
  for (const position of positionsAfter) {
    const key = normalize(position.name);
    const current = positionByName.get(key);
    if (!current || (!current.departmentId && position.departmentId)) {
      positionByName.set(key, position);
    }
  }

  // Load seed for original cargo/setor hints
  const seedPath = join(process.cwd(), "data", "seed.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as {
    employees: Array<{
      id: string;
      name: string;
      positionId?: string | null;
      positionName?: string | null;
      departmentId?: string | null;
      departmentName?: string | null;
    }>;
  };
  const seedById = new Map(seed.employees.map((e) => [e.id, e]));
  const seedByName = new Map(seed.employees.map((e) => [normalize(e.name), e]));

  const withoutDept = await prisma.employee.findMany({
    where: { departmentId: null },
  });

  let linked = 0;
  let assignedPosition = 0;
  const unresolved: Array<{ name: string; reason: string }> = [];

  for (const employee of withoutDept) {
    let departmentId: string | null = null;
    let positionId: string | null = employee.positionId;

    if (positionId) {
      departmentId = positionById.get(positionId)?.departmentId ?? null;
      if (!departmentId) {
        const posName = positionById.get(positionId)?.name ?? "";
        departmentId = inferDepartmentId(posName, departments);
        if (departmentId) {
          await prisma.position.update({
            where: { id: positionId },
            data: { departmentId },
          });
          positionById.set(positionId, {
            ...positionById.get(positionId)!,
            departmentId,
          });
        }
      }
    }

    const seedEmp = seedById.get(employee.id) ?? seedByName.get(normalize(employee.name));
    if (!departmentId && seedEmp?.departmentName) {
      const byDeptName = departments.find(
        (d) => normalize(d.name) === normalize(seedEmp.departmentName!),
      );
      departmentId = byDeptName?.id ?? inferDepartmentId(seedEmp.departmentName, departments);
    }

    if (!departmentId && seedEmp?.positionName) {
      const matchedPos = positionByName.get(normalize(seedEmp.positionName));
      if (matchedPos) {
        positionId = matchedPos.id;
        departmentId = matchedPos.departmentId ?? inferDepartmentId(matchedPos.name, departments);
        assignedPosition += 1;
      } else {
        departmentId = inferDepartmentId(seedEmp.positionName, departments);
        // try partial match on position names
        if (!positionId) {
          const partial = positionsAfter.find((p) => {
            const a = normalize(p.name);
            const b = normalize(seedEmp.positionName!);
            return a.includes(b) || b.includes(a) || a.slice(0, 18) === b.slice(0, 18);
          });
          if (partial) {
            positionId = partial.id;
            departmentId = partial.departmentId ?? departmentId;
            assignedPosition += 1;
          }
        }
      }
    }

    if (!departmentId) {
      unresolved.push({ name: employee.name, reason: "sem cargo/setor inferível" });
      continue;
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        departmentId,
        ...(positionId && !employee.positionId ? { positionId } : {}),
      },
    });
    linked += 1;
  }

  const remainingActive = await prisma.employee.count({
    where: { departmentId: null, status: { not: "desligado" } },
  });
  const remaining = await prisma.employee.count({ where: { departmentId: null } });

  console.log(
    JSON.stringify(
      {
        positionsUpdated,
        employeesLinked: linked,
        positionsAssignedToEmployees: assignedPosition,
        remainingWithoutDept: remaining,
        remainingActiveWithoutDept: remainingActive,
        unresolvedSample: unresolved.slice(0, 25),
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
