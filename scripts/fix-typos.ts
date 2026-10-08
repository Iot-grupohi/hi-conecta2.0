import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Exact string replacements (typos, accents, truncated Excel names). */
const REPLACEMENTS: Array<[string, string]> = [
  // Critical letter typos
  ["Oerador de lavanderia e entregas", "Operador de Lavanderia e Entregas"],
  ["OPERADOR DE LAVANDERIAS E ENTREGA", "Operador de Lavanderia e Entregas"],
  ["Operador de Lavanderia e entregas", "Operador de Lavanderia e Entregas"],
  ["Relacionamento E Perfomance", "Relacionamento e Performance"],
  ["SUPERVISORA DE RELKACIONAMENTO E PERFORMANCE", "Supervisora de Relacionamento e Performance"],
  ["ANALISTA DE DADOS E BUSSINESS INTELIGENCE", "Analista de Dados e Business Intelligence"],
  ["Analista de auditória operacional", "Analista de Auditoria Operacional"],

  // Truncated cargos → full names
  ["ANALISTA ADMINISTRATI", "Analista Administrativo"],
  ["ANALISTA ADMINISTRATIVO", "Analista Administrativo"],
  ["ANALISTA DE CONTAS A", "Analista de Contas a Pagar e Tesouraria"],
  ["ANALISTA DE CONTAS A PAGAR E TESOURARIA", "Analista de Contas a Pagar e Tesouraria"],
  ["ANALISTA DE DADOS E B", "Analista de Dados e Business Intelligence"],
  ["ANALISTA DE DESENVOLV", "Analista de Desenvolvimento"],
  ["ANALISTA DE ONBOARDIN", "Analista de Onboarding"],
  ["ANALISTA DE PERFORMAN", "Analista de Performance"],
  ["ANALISTA DE RECRUTAME", "Analista de Recrutamento e Seleção II"],
  ["ANALISTA DE RECRUTAMENTO E SELEÇÃO II", "Analista de Recrutamento e Seleção II"],
  ["ANALISTA DE SOCIAL MI", "Analista de Social Mídia"],
  ["ANALISTA DE SOCIAL MIDIA II", "Analista de Social Mídia II"],
  ["Analista de Novos Neg", "Analista de Novos Negócios"],
  ["CONSULTOR DE ESTRATEG", "Consultor de Estratégia"],
  ["COORDENADOR DE DESENV", "Coordenador de Desenvolvimento"],
  ["COORDENADOR DE DESENVOLVIMENTO", "Coordenador de Desenvolvimento"],
  ["COORDENADOR DE LOGIST", "Coordenador de Logística"],
  ["COORDENADOR DE LOGISTICA", "Coordenador de Logística"],
  ["COORDENADOR DE MARKET", "Coordenador de Marketing"],
  ["COORDENADOR DE MARKETING", "Coordenador de Marketing"],
  ["COORDENADOR DE ONBOAR", "Coordenador de Onboarding"],
  ["ESPECIALISTA FISCAL E", "Especialista Fiscal e Contábil"],
  ["GERENTE ADMINISTRATIV", "Gerente Administrativo"],
  ["GERENTE ADMINISTRATIVO (JUNIOR 1)", "Gerente Administrativo (Junior 1)"],
  ["GERENTE DE RELACIONAM", "Gerente de Relacionamento"],
  ["GERENTE DE RELACIONAMENTO", "Gerente de Relacionamento"],
  ["SUPERVISOR DE BACKOFF", "Supervisor de Backoffice"],
  ["SUPERVISOR DE BACKOFFICE", "Supervisor de Backoffice"],
  ["SUPERVISOR DE EXPANSA", "Supervisor de Expansão"],
  ["SUPERVISOR DE EXPANSAO", "Supervisor de Expansão"],
  ["SUPERVISOR DE ONBOARD", "Supervisor de Onboarding"],
  ["SUPERVISOR DE OPERACO", "Supervisor de Operações"],
  ["SUPERVISOR DE OPERACOES", "Supervisor de Operações"],
  ["SUPERVISOR DE PERFOR", "Supervisor de Performance e Tráfego Pago"],
  ["SUPERVISOR DE PERFORMANCE E TRAFEGO PAGO", "Supervisor de Performance e Tráfego Pago"],
  ["SUPERVISOR DE SEGURAN", "Supervisor de Segurança da Informação"],
  ["SUPERVISOR DE SEGURANÇA DA INFORMAÇÃO", "Supervisor de Segurança da Informação"],
  ["Supervisor de Pesquis", "Supervisor de Pesquisa e Desenvolvimento"],
  ["Supervisor de Pesquisa e Desenvolvimento", "Supervisor de Pesquisa e Desenvolvimento"],

  // Accents / spelling
  ["Tecnico", "Técnico"],
  ["ANALISTA TECNICO", "Analista Técnico"],
  ["AUXILIAR TECNICO I", "Auxiliar Técnico I"],
  ["COORDENADOR TECNICO", "Coordenador Técnico"],
  ["AUXILIAR DE OPERACOES", "Auxiliar de Operações"],
  ["ANALISTA CONTABIL II", "Analista Contábil II"],
  ["Analista Contabil 2", "Analista Contábil 2"],
  ["ANALISTA DE EXPANSAO II", "Analista de Expansão II"],
  ["DESIGNER GRAFICO I", "Designer Gráfico I"],
  ["ESTAGIARIO", "Estagiário"],
  ["Estagiaria de Desenvolvimento", "Estagiária de Desenvolvimento"],
  ["Estágiario de Arquitetura", "Estagiário de Arquitetura"],
  ["Gestor de trafego pago", "Gestor de Tráfego Pago"],
  ["Analista de Performance e Trafego Pago", "Analista de Performance e Tráfego Pago"],
  ["Redator de Conteudo e Copywriter", "Redator de Conteúdo e Copywriter"],
  ["ANALISTA DE SEGURANÇA DE INFORMAÇÃO", "Analista de Segurança da Informação"],
];

function applyReplacements(value: string): string {
  let next = value;
  for (const [from, to] of REPLACEMENTS) {
    if (next === from) {
      next = to;
      break;
    }
  }
  return next;
}

function walkReplace(value: unknown): { value: unknown; changed: number } {
  let changed = 0;
  if (typeof value === "string") {
    const next = applyReplacements(value);
    if (next !== value) changed += 1;
    return { value: next, changed };
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => {
      const result = walkReplace(item);
      changed += result.changed;
      return result.value;
    });
    return { value: items, changed };
  }
  if (value && typeof value === "object") {
    const obj: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const result = walkReplace(child);
      changed += result.changed;
      obj[key] = result.value;
    }
    return { value: obj, changed };
  }
  return { value, changed };
}

async function fixDatabase() {
  const summary = {
    departments: 0,
    positions: 0,
    employeesPositionName: 0,
    employeesDepartmentName: 0,
    merges: 0,
  };

  const departments = await prisma.department.findMany();
  for (const department of departments) {
    const name = applyReplacements(department.name);
    if (name !== department.name) {
      await prisma.department.update({ where: { id: department.id }, data: { name } });
      summary.departments += 1;
    }
  }

  const positions = await prisma.position.findMany();
  for (const position of positions) {
    const name = applyReplacements(position.name);
    if (name !== position.name) {
      await prisma.position.update({ where: { id: position.id }, data: { name } });
      summary.positions += 1;
    }
  }

  // Merge duplicate positions (same normalized name)
  const after = await prisma.position.findMany({ include: { _count: { select: { employees: true } } } });
  const byName = new Map<string, typeof after>();
  for (const position of after) {
    const key = position.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const list = byName.get(key) ?? [];
    list.push(position);
    byName.set(key, list);
  }

  for (const group of byName.values()) {
    if (group.length < 2) continue;
    // Prefer the one with departmentId, then with most employees
    group.sort((a, b) => {
      const deptScore = Number(Boolean(b.departmentId)) - Number(Boolean(a.departmentId));
      if (deptScore !== 0) return deptScore;
      return b._count.employees - a._count.employees;
    });
    const keep = group[0]!;
    for (const duplicate of group.slice(1)) {
      await prisma.employee.updateMany({
        where: { positionId: duplicate.id },
        data: {
          positionId: keep.id,
          departmentId: keep.departmentId ?? undefined,
        },
      });
      await prisma.position.delete({ where: { id: duplicate.id } });
      summary.merges += 1;
    }
  }

  return summary;
}

async function main() {
  const seedPath = path.join(process.cwd(), "data", "seed.json");
  const raw = fs.readFileSync(seedPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const { value: fixed, changed } = walkReplace(parsed);
  fs.writeFileSync(seedPath, `${JSON.stringify(fixed, null, 2)}\n`, "utf8");
  console.log(`seed.json replacements: ${changed}`);

  const db = await fixDatabase();
  console.log("database:", db);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
