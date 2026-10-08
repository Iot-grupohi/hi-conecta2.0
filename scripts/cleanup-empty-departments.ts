/**
 * Lista e remove departamentos vazios (sem colaboradores ativos vinculados),
 * especialmente duplicatas com o mesmo nome.
 *
 * Uso: npx tsx scripts/cleanup-empty-departments.ts
 *      npx tsx scripts/cleanup-empty-departments.ts --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

async function main() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      employees: { select: { id: true, status: true } },
      positions: { select: { id: true } },
      vacations: { select: { id: true } },
    },
  });

  const rows = departments.map((dep) => {
    const active = dep.employees.filter((e) => e.status !== "desligado").length;
    const allEmployees = dep.employees.length;
    return {
      id: dep.id,
      name: dep.name,
      active,
      allEmployees,
      positions: dep.positions.length,
      vacations: dep.vacations.length,
      fold: fold(dep.name),
    };
  });

  const byFold = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byFold.get(row.fold) ?? [];
    list.push(row);
    byFold.set(row.fold, list);
  }

  // Remover: cards sem colaboradores ativos quando existe outro com o mesmo nome,
  // OU qualquer departamento sem nenhum colaborador (ativo ou desligado) e sem cargos.
  const toDelete: typeof rows = [];
  for (const group of byFold.values()) {
    const withPeople = group.filter((g) => g.active > 0);
    const empty = group.filter((g) => g.active === 0);

    if (withPeople.length > 0) {
      // Há pelo menos um com gente → remove os vazios duplicados
      toDelete.push(...empty);
      continue;
    }

    // Todos vazios: se mais de um, mantém o primeiro e remove o resto;
    // se só um vazio sem vínculos, também remove (card sem colaborador).
    if (group.length > 1) {
      const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
      toDelete.push(...sorted.slice(1));
      // se o restante também não tem ninguém, remove ele também
      if (sorted[0].allEmployees === 0) toDelete.push(sorted[0]);
    } else if (group[0].allEmployees === 0) {
      toDelete.push(group[0]);
    }
  }

  // Deduplicate ids
  const unique = Array.from(new Map(toDelete.map((r) => [r.id, r])).values());

  console.log(
    JSON.stringify(
      {
        totalDepartments: rows.length,
        emptyActive: rows.filter((r) => r.active === 0).length,
        toDelete: unique.length,
        apply: APPLY,
        names: unique.map((r) => ({ id: r.id, name: r.name, active: r.active })),
      },
      null,
      2,
    ),
  );

  if (!APPLY || unique.length === 0) return;

  for (const row of unique) {
    // Desvincula desligados / cargos / férias antes de excluir
    await prisma.employee.updateMany({
      where: { departmentId: row.id },
      data: { departmentId: null },
    });
    await prisma.position.updateMany({
      where: { departmentId: row.id },
      data: { departmentId: null },
    });
    await prisma.vacation.updateMany({
      where: { departmentId: row.id },
      data: { departmentId: null },
    });
    await prisma.department.delete({ where: { id: row.id } });
  }

  console.log(JSON.stringify({ deleted: unique.length }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
