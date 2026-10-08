import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const d = await p.department.findMany({ orderBy: { name: "asc" } });
  console.log(d.map((x) => `${x.id} | ${x.name}`).join("\n"));
  await p.$disconnect();
}

main();
