import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const withoutDept = await prisma.employee.findMany({
    where: { departmentId: null },
    include: { position: true },
  });

  const withPos = withoutDept.filter((e) => e.positionId);
  const linkable = withoutDept.filter((e) => e.position?.departmentId);
  const noPos = withoutDept.filter((e) => !e.positionId);
  const posNoDept = withoutDept.filter((e) => e.positionId && !e.position?.departmentId);

  console.log(
    JSON.stringify(
      {
        totalWithoutDept: withoutDept.length,
        withPosition: withPos.length,
        linkableViaPositionDept: linkable.length,
        withoutPosition: noPos.length,
        positionWithoutDept: posNoDept.length,
        sampleLinkable: linkable.slice(0, 10).map((e) => ({
          name: e.name,
          cargo: e.position?.name,
          deptId: e.position?.departmentId,
        })),
        sampleNoPos: noPos.slice(0, 5).map((e) => ({
          name: e.name,
          positionNameHint: null,
        })),
        samplePosNoDept: posNoDept.slice(0, 8).map((e) => ({
          name: e.name,
          positionId: e.positionId,
          cargo: e.position?.name,
        })),
      },
      null,
      2,
    ),
  );

  // Also check if we can match by position name to a position that has department
  const positions = await prisma.position.findMany({
    where: { NOT: { departmentId: null } },
  });
  const byName = new Map(positions.map((p) => [p.name.trim().toLowerCase(), p]));

  let matchByName = 0;
  for (const e of posNoDept) {
    const key = (e.position?.name ?? "").trim().toLowerCase();
    if (key && byName.has(key)) matchByName += 1;
  }
  console.log("posNoDept matchable by same position name with dept:", matchByName);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
