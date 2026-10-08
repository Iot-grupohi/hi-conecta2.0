/**
 * Sincroniza departamentos e colaboradores a partir de Bitrix Colaboradores/org_tree.json
 * Uso: npx tsx scripts/sync-bitrix-org.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toDisplayCase } from "../lib/utils";
import { newId } from "../lib/hr-write";

const prisma = new PrismaClient();
const ORG_PATH = join(process.cwd(), "Bitrix Colaboradores", "org_tree.json");

type BitrixChefe = { id: string; nome: string; cargo?: string; ativo?: boolean } | null;
type BitrixUser = {
  id: string;
  nome: string;
  email?: string;
  cargo?: string;
  ativo?: boolean;
  eh_chefe?: boolean;
};
type BitrixNode = {
  id: string | number;
  nome: string;
  caminho?: string;
  pai_id?: string | number | null;
  chefe?: BitrixChefe;
  total_usuarios?: number;
  cargos?: Record<string, BitrixUser[]>;
  subdepartamentos?: BitrixNode[];
};

type FlatDep = {
  bitrixId: string;
  name: string;
  parentBitrixId: string | null;
  path: string;
  chefe: BitrixChefe;
  userCount: number;
};

type Assignment = {
  bitrixUserId: string;
  name: string;
  email: string | null;
  position: string | null;
  departmentBitrixId: string;
  departmentName: string;
  isChief: boolean;
  path: string;
};

function foldName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b\d{3,5}\b/g, " ")
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanBitrixPersonName(value: string): string {
  return value.replace(/\b\d{3,5}\b/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string): string[] {
  return foldName(value)
    .split(" ")
    .filter((t) => t.length > 1 && !["de", "da", "do", "dos", "das", "e"].includes(t));
}

/** Bitrix "Sofia Morais" casa com "Sofia Cavalcanti de Morais Coutinho" */
function scoreNameMatch(bitrixName: string, employeeName: string): number {
  const b = tokens(bitrixName);
  const e = new Set(tokens(employeeName));
  if (b.length === 0) return 0;
  const hits = b.filter((t) => e.has(t)).length;
  if (hits < Math.min(2, b.length)) return 0;
  if (b.every((t) => e.has(t))) return 100 + hits * 10 + b.length;
  return hits * 10;
}

function isSkipPerson(name: string, email: string | null): boolean {
  const n = foldName(name);
  const e = (email ?? "").toLowerCase();
  if (!n && e) return true;
  if (/teste|automacao|bitrix|connectthink|universonext|red control|v4company|agente externo/.test(n)) {
    return true;
  }
  if (/automacao|teste@|connectthink|universonext|redcontrol|v4company/.test(e)) return true;
  if (e && !e.includes("@")) return true;
  // email usado como nome
  if (n.includes("@")) return true;
  return false;
}

function walk(node: BitrixNode, deps: FlatDep[], assignments: Omit<Assignment, "path">[]) {
  const bitrixId = String(node.id);
  deps.push({
    bitrixId,
    name: node.nome,
    parentBitrixId: node.pai_id != null ? String(node.pai_id) : null,
    path: node.caminho ?? node.nome,
    chefe: node.chefe ?? null,
    userCount: node.total_usuarios ?? 0,
  });

  for (const [cargo, users] of Object.entries(node.cargos ?? {})) {
    for (const user of users) {
      assignments.push({
        bitrixUserId: String(user.id),
        name: cleanBitrixPersonName(user.nome),
        email: user.email?.trim().toLowerCase() || null,
        position: cargo === "(sem cargo)" ? null : cargo,
        departmentBitrixId: bitrixId,
        departmentName: node.nome,
        isChief: Boolean(
          user.eh_chefe || (node.chefe && String(node.chefe.id) === String(user.id)),
        ),
      });
    }
  }

  for (const child of node.subdepartamentos ?? []) {
    walk(child, deps, assignments);
  }
}

function leadershipFromChefe(chefe: BitrixChefe) {
  if (!chefe?.nome) {
    return {
      managerName: null as string | null,
      directorName: null as string | null,
      coordinatorName: null as string | null,
      supervisorName: null as string | null,
    };
  }
  const name = toDisplayCase(cleanBitrixPersonName(chefe.nome));
  const cargo = (chefe.cargo ?? "").toLowerCase();
  if (/diretor|presidente|ceo|coo|cfo|cro|founder|conselho/.test(cargo)) {
    return { managerName: null, directorName: name, coordinatorName: null, supervisorName: null };
  }
  if (/coordenad/.test(cargo)) {
    return { managerName: null, directorName: null, coordinatorName: name, supervisorName: null };
  }
  if (/supervisor/.test(cargo)) {
    return { managerName: null, directorName: null, coordinatorName: null, supervisorName: name };
  }
  return { managerName: name, directorName: null, coordinatorName: null, supervisorName: null };
}

function pickBestAssignment(items: Assignment[]): Assignment {
  return [...items].sort((a, b) => b.path.length - a.path.length)[0];
}

async function main() {
  const raw = JSON.parse(readFileSync(ORG_PATH, "utf8")) as {
    resumo: Record<string, unknown>;
    arvore: BitrixNode[];
  };

  const deps: FlatDep[] = [];
  const rawAssignments: Omit<Assignment, "path">[] = [];
  for (const root of raw.arvore) walk(root, deps, rawAssignments);

  const depPath = new Map(deps.map((d) => [d.bitrixId, d.path] as const));
  const assignments: Assignment[] = rawAssignments.map((a) => ({
    ...a,
    path: depPath.get(a.departmentBitrixId) ?? a.departmentName,
  }));

  const byUser = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = byUser.get(a.bitrixUserId) ?? [];
    list.push(a);
    byUser.set(a.bitrixUserId, list);
  }
  const primary = Array.from(byUser.values()).map(pickBestAssignment);

  console.log(
    JSON.stringify(
      {
        bitrix: raw.resumo,
        flattened: {
          departments: deps.length,
          assignments: assignments.length,
          uniqueUsers: primary.length,
        },
      },
      null,
      2,
    ),
  );

  const existingDeps = await prisma.department.findMany();
  const depByFolded = new Map(existingDeps.map((d) => [foldName(d.name), d]));
  const bitrixToLocalId = new Map<string, string>();

  let depsCreated = 0;
  let depsUpdated = 0;

  for (const dep of deps) {
    const folded = foldName(dep.name);
    let local = depByFolded.get(folded);
    const leadership = leadershipFromChefe(dep.chefe);

    if (!local) {
      local = await prisma.department.create({
        data: {
          id: newId("dep"),
          name: toDisplayCase(dep.name),
          ...leadership,
        },
      });
      depByFolded.set(folded, local);
      depsCreated += 1;
    } else {
      await prisma.department.update({
        where: { id: local.id },
        data: {
          name: toDisplayCase(dep.name),
          ...(dep.chefe ? leadership : {}),
        },
      });
      depsUpdated += 1;
    }
    bitrixToLocalId.set(dep.bitrixId, local.id);
  }

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, status: true, departmentId: true, positionId: true },
  });

  function findEmployee(bitrixName: string) {
    let best: (typeof employees)[number] | null = null;
    let bestScore = 0;
    for (const emp of employees) {
      const score = scoreNameMatch(bitrixName, emp.name);
      if (score > bestScore) {
        bestScore = score;
        best = emp;
      }
    }
    return bestScore >= 20 ? best : null;
  }

  const positions = await prisma.position.findMany();
  const posByFolded = new Map(positions.map((p) => [foldName(p.name), p]));

  let matched = 0;
  let created = 0;
  let skipped = 0;
  let deptChanged = 0;
  let positionsCreated = 0;
  const unmatchedAfter: string[] = [];
  const usedEmployeeIds = new Set<string>();

  for (const person of primary) {
    if (isSkipPerson(person.name, person.email)) {
      skipped += 1;
      continue;
    }

    const departmentId = bitrixToLocalId.get(person.departmentBitrixId) ?? null;
    let emp = findEmployee(person.name);

    // evita dois bitrix apontarem pro mesmo colaborador
    if (emp && usedEmployeeIds.has(emp.id)) {
      emp = null;
    }

    let positionId: string | null = emp?.positionId ?? null;
    if (person.position) {
      const pf = foldName(person.position);
      let pos = posByFolded.get(pf);
      if (!pos) {
        pos = await prisma.position.create({
          data: {
            id: newId("pos"),
            name: toDisplayCase(person.position),
            departmentId,
          },
        });
        posByFolded.set(pf, pos);
        positionsCreated += 1;
      }
      positionId = pos.id;
    }

    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          id: newId("emp"),
          name: toDisplayCase(person.name),
          departmentId,
          positionId,
          status: "ativo",
          notes: person.email
            ? `Importado do Bitrix · ${person.email}`
            : "Importado do Bitrix",
        },
      });
      employees.push(emp);
      created += 1;
    } else {
      matched += 1;
      const data: {
        departmentId?: string | null;
        positionId?: string | null;
        name?: string;
        status?: "ativo";
      } = {};
      if (departmentId && departmentId !== emp.departmentId) {
        data.departmentId = departmentId;
        deptChanged += 1;
      }
      if (positionId && positionId !== emp.positionId) data.positionId = positionId;
      const display = toDisplayCase(person.name);
      if (display && tokens(display).length >= tokens(emp.name).length) {
        // não encurtar nome completo existente
      } else if (emp.name === emp.name.toUpperCase()) {
        data.name = display;
      }
      if (emp.status === "desligado") data.status = "ativo";
      if (Object.keys(data).length > 0) {
        await prisma.employee.update({ where: { id: emp.id }, data });
      }
    }

    usedEmployeeIds.add(emp.id);
  }

  const activeMissing = employees.filter(
    (e) => e.status !== "desligado" && !usedEmployeeIds.has(e.id),
  );

  console.log(
    JSON.stringify(
      {
        departments: { created: depsCreated, updated: depsUpdated, totalBitrix: deps.length },
        employees: {
          matched,
          created,
          skippedExternalOrTest: skipped,
          deptChanged,
          positionsCreated,
          unmatched: unmatchedAfter.length,
          activeInSystemNotInBitrix: activeMissing.length,
        },
        activeNotInBitrixSample: activeMissing.slice(0, 20).map((e) => e.name),
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
