import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PREFIX_DEPT: Array<{ prefix: string; deptId: string }> = [
  { prefix: "coordenador de desenvolv", deptId: "dep_003" },
  { prefix: "coordenador de desenv", deptId: "dep_003" },
  { prefix: "coordenador de market", deptId: "dep_001" },
  { prefix: "coordenador de onboar", deptId: "dep_010" },
  { prefix: "coordenador de logist", deptId: "dep_006" },
  { prefix: "supervisor de expansa", deptId: "dep_002" },
  { prefix: "supervisor de perfor", deptId: "dep_001" },
  { prefix: "supervisor de seguran", deptId: "dep_021" },
  { prefix: "supervisor de pesquis", deptId: "dep_022" },
  { prefix: "supervisor de onboar", deptId: "dep_010" },
  { prefix: "supervisor de backoff", deptId: "dep_012" },
  { prefix: "gerente de relacionam", deptId: "dep_016" },
];

async function main() {
  const departments = await prisma.department.findMany();
  const deptIds = new Set(departments.map((d) => d.id));

  const positions = await prisma.position.findMany({ where: { departmentId: null } });
  let positionsUpdated = 0;
  for (const position of positions) {
    const key = normalize(position.name);
    const hit = PREFIX_DEPT.find((rule) => key.startsWith(rule.prefix) || key.includes(rule.prefix));
    if (!hit || !deptIds.has(hit.deptId)) {
      console.log("still unresolved position:", position.name);
      continue;
    }
    await prisma.position.update({
      where: { id: position.id },
      data: { departmentId: hit.deptId },
    });
    positionsUpdated += 1;
  }

  const positionsAfter = await prisma.position.findMany();
  const positionById = new Map(positionsAfter.map((p) => [p.id, p]));

  // Match employees without position to existing employees/cargos by similar name
  const withPosition = await prisma.employee.findMany({
    where: { NOT: { positionId: null } },
    include: { position: true },
  });

  const withoutDept = await prisma.employee.findMany({
    where: { departmentId: null },
  });

  let linked = 0;
  let byNameMatch = 0;

  for (const employee of withoutDept) {
    let departmentId: string | null = null;
    let positionId: string | null = employee.positionId;

    if (positionId) {
      departmentId = positionById.get(positionId)?.departmentId ?? null;
    }

    if (!departmentId && !positionId) {
      const n = normalize(employee.name);
      // exact-ish name match to someone who has cargo/setor
      const twin = withPosition.find((other) => {
        const on = normalize(other.name);
        return on === n || on.includes(n) || n.includes(on);
      });
      if (twin?.positionId) {
        positionId = twin.positionId;
        departmentId = twin.departmentId ?? twin.position?.departmentId ?? null;
        byNameMatch += 1;
      }
    }

    // Sócio / PJ without data → Expansão as default business unit
    if (!departmentId) {
      const contract = normalize(employee.contractType ?? "");
      if (contract.includes("socio") || contract.includes("pj")) {
        departmentId = "dep_002";
      }
    }

    if (!departmentId) continue;

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        departmentId,
        ...(positionId && !employee.positionId ? { positionId } : {}),
      },
    });
    linked += 1;
  }

  const remaining = await prisma.employee.count({ where: { departmentId: null } });
  const remainingActive = await prisma.employee.count({
    where: { departmentId: null, status: { not: "desligado" } },
  });
  const remainingActiveList = await prisma.employee.findMany({
    where: { departmentId: null, status: { not: "desligado" } },
    select: { name: true, contractType: true, positionId: true },
  });

  console.log(
    JSON.stringify(
      {
        positionsUpdated,
        employeesLinked: linked,
        byNameMatch,
        remainingWithoutDept: remaining,
        remainingActiveWithoutDept: remainingActive,
        remainingActiveList,
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
