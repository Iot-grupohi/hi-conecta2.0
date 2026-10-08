import type { BadgeProps } from "@/components/ui/badge";
import type { EmployeeStatus, VacationStatus } from "@/types/hr";
import { toDisplayCase } from "@/lib/utils";

type Tone = NonNullable<BadgeProps["tone"]>;

export type TagDefinition = {
  key: string;
  label: string;
  tone: Tone;
};

export function normalizeKey(value: string | null | undefined): string {
  if (!value) return "nao_informado";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function matchCatalog(
  source: string,
  catalog: Array<{ match: RegExp; tag: TagDefinition }>,
  fallbackLabel?: string | null,
): TagDefinition {
  const key = normalizeKey(source);
  for (const item of catalog) {
    if (item.match.test(key)) return item.tag;
  }
  if (!source || key === "nao_informado" || key === "null" || key === "-") {
    return { key: "nao_informado", label: "Não informado", tone: "neutral" };
  }
  return {
    key,
    label: toDisplayCase(fallbackLabel ?? source),
    tone: "neutral",
  };
}

const TERMINATION_CATALOG: Array<{ match: RegExp; tag: TagDefinition }> = [
  {
    match: /sem.?justa.?caisa|sem.?justa.?causa.*acordo|acordo/,
    tag: {
      key: "demissao_sem_justa_causa_acordo",
      label: "Demissão sem justa causa (acordo)",
      tone: "warning",
    },
  },
  {
    match: /sem.?justa.?causa/,
    tag: {
      key: "demissao_sem_justa_causa",
      label: "Demissão sem justa causa",
      tone: "danger",
    },
  },
  {
    match: /com.?justa.?causa/,
    tag: {
      key: "demissao_com_justa_causa",
      label: "Demissão com justa causa",
      tone: "danger",
    },
  },
  {
    match: /pedido.*experiencia|experiencia.*pedido/,
    tag: {
      key: "pedido_demissao_experiencia",
      label: "Pedido de demissão (experiência)",
      tone: "warning",
    },
  },
  {
    match: /pedido/,
    tag: {
      key: "pedido_de_demissao",
      label: "Pedido de demissão",
      tone: "warning",
    },
  },
  {
    match: /termino.?antecipado.*colaborador/,
    tag: {
      key: "termino_antecipado_experiencia_colaborador",
      label: "Término antecipado experiência — colaborador",
      tone: "info",
    },
  },
  {
    match: /termino.?antecipado.*empresa/,
    tag: {
      key: "termino_antecipado_experiencia_empresa",
      label: "Término antecipado experiência — empresa",
      tone: "info",
    },
  },
  {
    match: /termino.?antecipado/,
    tag: {
      key: "termino_antecipado_experiencia",
      label: "Término antecipado experiência",
      tone: "info",
    },
  },
  {
    match: /termino.*experiencia.*empresa/,
    tag: {
      key: "termino_experiencia_empresa",
      label: "Término experiência — empresa",
      tone: "info",
    },
  },
  {
    match: /termino.*experiencia/,
    tag: {
      key: "termino_experiencia",
      label: "Término contrato experiência",
      tone: "info",
    },
  },
  {
    match: /estagio.*contratacao|contratacao/,
    tag: {
      key: "rescisao_estagio_contratacao",
      label: "Rescisão estágio — contratação",
      tone: "primary",
    },
  },
  {
    match: /estagio.*empresa/,
    tag: {
      key: "rescisao_estagio_empresa",
      label: "Rescisão estágio — empresa",
      tone: "primary",
    },
  },
  {
    match: /estagio.*estagiario|estagiario/,
    tag: {
      key: "rescisao_estagio_estagiario",
      label: "Rescisão estágio — estagiário",
      tone: "primary",
    },
  },
  {
    match: /estagio/,
    tag: {
      key: "rescisao_estagio",
      label: "Rescisão contrato de estágio",
      tone: "primary",
    },
  },
  {
    match: /complementar/,
    tag: {
      key: "rescisao_complementar",
      label: "Rescisão complementar",
      tone: "neutral",
    },
  },
];

const CONTRACT_CATALOG: Array<{ match: RegExp; tag: TagDefinition }> = [
  { match: /^clt$|contrato.?clt/, tag: { key: "clt", label: "CLT", tone: "success" } },
  { match: /estag/, tag: { key: "estagio", label: "Estágio", tone: "info" } },
  { match: /pj|pessoa.?juridica/, tag: { key: "pj", label: "PJ", tone: "warning" } },
  { match: /socio/, tag: { key: "socio", label: "Sócio", tone: "primary" } },
  { match: /dono|proprietario/, tag: { key: "dono", label: "Dono", tone: "primary" } },
  { match: /temporar/, tag: { key: "temporario", label: "Temporário", tone: "warning" } },
  { match: /aprendiz/, tag: { key: "aprendiz", label: "Aprendiz", tone: "info" } },
];

const SCALE_CATALOG: Array<{ match: RegExp; tag: TagDefinition }> = [
  { match: /^6x1$|6.?x.?1/, tag: { key: "6x1", label: "Escala 6X1", tone: "info" } },
  { match: /^6x2$|6.?x.?2/, tag: { key: "6x2", label: "Escala 6X2", tone: "info" } },
  {
    match: /segunda.?a.?sexta|seg.?a.?sex|segunda.?sexta/,
    tag: { key: "seg_sex", label: "Segunda a sexta", tone: "primary" },
  },
  {
    match: /segunda.?a.?sab|seg.?a.?sab|segunda.?sab/,
    tag: { key: "seg_sab", label: "Segunda a sábado", tone: "primary" },
  },
  { match: /12x36|12.?x.?36/, tag: { key: "12x36", label: "Escala 12X36", tone: "warning" } },
  { match: /5x2|5.?x.?2/, tag: { key: "5x2", label: "Escala 5X2", tone: "info" } },
];

const TRANSPORT_CATALOG: Array<{ match: RegExp; tag: TagDefinition }> = [
  { match: /mobilidade/, tag: { key: "mobilidade", label: "Mobilidade", tone: "primary" } },
  {
    match: /vale.?transporte|^vt$|transporte/,
    tag: { key: "vt", label: "Vale transporte", tone: "info" },
  },
  { match: /^pix$/, tag: { key: "pix", label: "PIX", tone: "warning" } },
  {
    match: /combustivel|gasolina/,
    tag: { key: "combustivel", label: "Combustível", tone: "warning" },
  },
  { match: /nao|sem|n\/a/, tag: { key: "sem_beneficio", label: "Sem benefício", tone: "neutral" } },
];

const POSITION_FAMILY_CATALOG: Array<{ match: RegExp; family: string; tone: Tone }> = [
  { match: /chief|cro|cxo|cxo|ceo|cto|cfo/, family: "diretoria", tone: "danger" },
  { match: /socio|dono/, family: "diretoria", tone: "danger" },
  { match: /gerente/, family: "gerencia", tone: "danger" },
  { match: /coordenador/, family: "coordenacao", tone: "warning" },
  { match: /supervisor|supervisora/, family: "supervisao", tone: "warning" },
  { match: /analista/, family: "analista", tone: "info" },
  { match: /desenvolvedor|developer/, family: "tecnologia", tone: "primary" },
  { match: /consultor|consultoria|mentor|closer|sdr/, family: "comercial", tone: "success" },
  { match: /concierge/, family: "comercial", tone: "success" },
  { match: /auxiliar|assistente|operador|tecnico|montagem/, family: "operacional", tone: "neutral" },
  { match: /estagiar/, family: "estagio", tone: "primary" },
  { match: /designer|videomaker|copywriter|redator|social.?media/, family: "criativo", tone: "info" },
  { match: /advogado|juridic/, family: "juridico", tone: "warning" },
  { match: /contabil|fiscal|tesouraria|controladoria/, family: "financeiro", tone: "success" },
];

function cleanPositionLabel(value: string): string {
  return toDisplayCase(value.replace(/\s+/g, " ").replace(/\s*-\s*/g, " — ").trim());
}

export function resolvePositionTag(value: string | null | undefined): TagDefinition {
  if (!value || !value.trim()) {
    return { key: "sem_cargo", label: "Sem cargo", tone: "neutral" };
  }

  const key = normalizeKey(value);
  let family = "outros";
  let tone: Tone = "neutral";

  for (const item of POSITION_FAMILY_CATALOG) {
    if (item.match.test(key)) {
      family = item.family;
      tone = item.tone;
      break;
    }
  }

  return {
    key: `${family}_${key}`.slice(0, 80),
    label: cleanPositionLabel(value),
    tone,
  };
}

export function resolvePositionFamilyTag(value: string | null | undefined): TagDefinition {
  const position = resolvePositionTag(value);
  const family = position.key.split("_")[0] ?? "outros";
  const labels: Record<string, string> = {
    diretoria: "Diretoria",
    gerencia: "Gerência",
    coordenacao: "Coordenação",
    supervisao: "Supervisão",
    analista: "Analista",
    tecnologia: "Tecnologia",
    comercial: "Comercial",
    operacional: "Operacional",
    estagio: "Estágio",
    criativo: "Criativo",
    juridico: "Jurídico",
    financeiro: "Financeiro",
    outros: "Outros",
    sem: "Sem cargo",
  };
  return {
    key: family,
    label: labels[family] ?? "Outros",
    tone: position.tone,
  };
}

const DEPARTMENT_CATALOG: Array<{ match: RegExp; tag: TagDefinition }> = [
  { match: /marketing/, tag: { key: "marketing", label: "Marketing", tone: "info" } },
  { match: /expansao/, tag: { key: "expansao", label: "Expansão", tone: "success" } },
  {
    match: /desenvolvimento|inovacao/,
    tag: { key: "desenvolvimento", label: "Desenvolvimento", tone: "primary" },
  },
  {
    match: /tecnologia|helpdesk|^ti$/,
    tag: { key: "tecnologia", label: "Tecnologia", tone: "primary" },
  },
  {
    match: /novos.?negocios/,
    tag: { key: "novos_negocios", label: "Novos negócios", tone: "success" },
  },
  { match: /juridico/, tag: { key: "juridico", label: "Jurídico", tone: "warning" } },
  { match: /operacoes/, tag: { key: "operacoes", label: "Operações", tone: "neutral" } },
  { match: /tecnica/, tag: { key: "tecnica", label: "Técnica", tone: "info" } },
  {
    match: /gente.?e.?gestao|recursos.?humanos/,
    tag: { key: "gente_gestao", label: "Gente e gestão", tone: "warning" },
  },
  {
    match: /financeiro|contabil/,
    tag: { key: "financeiro", label: "Financeiro", tone: "success" },
  },
  { match: /onboarding|onbording/, tag: { key: "onboarding", label: "Onboarding", tone: "info" } },
  { match: /^nrp$/, tag: { key: "nrp", label: "NRP", tone: "primary" } },
  { match: /^nrs$/, tag: { key: "nrs", label: "NRS", tone: "primary" } },
  { match: /^npf$/, tag: { key: "npf", label: "NPF", tone: "primary" } },
  {
    match: /^cs$|sucesso.?do.?cliente|customer.?success/,
    tag: { key: "cs", label: "CS", tone: "success" },
  },
  {
    match: /administracao|administrativo/,
    tag: { key: "administracao", label: "Administração", tone: "neutral" },
  },
  { match: /consultoria/, tag: { key: "consultoria", label: "Consultoria", tone: "info" } },
  { match: /qsgi/, tag: { key: "qsgi", label: "QSGI", tone: "warning" } },
  { match: /^p.?d$|pesquisa/, tag: { key: "pd", label: "P&D", tone: "info" } },
];

export function resolveDepartmentTag(value: string | null | undefined): TagDefinition {
  if (!value || !value.trim()) {
    return { key: "sem_setor", label: "Sem setor", tone: "neutral" };
  }
  return matchCatalog(value, DEPARTMENT_CATALOG, value);
}

export function resolveTerminationTag(
  type: string | null | undefined,
  label?: string | null,
): TagDefinition {
  return matchCatalog(`${label ?? ""} ${type ?? ""}`, TERMINATION_CATALOG, label ?? type);
}

export function resolveNoticeTag(notice: string | null | undefined): TagDefinition {
  const key = normalizeKey(notice);
  if (!notice || key === "-" || key === "nao_informado" || key === "null") {
    return { key: "nao_informado", label: "Sem aviso", tone: "neutral" };
  }
  if (key.includes("indeniz")) {
    return { key: "indenizado", label: "Aviso indenizado", tone: "warning" };
  }
  if (key.includes("trabalh")) {
    return { key: "trabalhado", label: "Aviso trabalhado", tone: "info" };
  }
  return { key, label: toDisplayCase(notice), tone: "neutral" };
}

export function resolveContractTag(value: string | null | undefined): TagDefinition {
  return matchCatalog(value ?? "", CONTRACT_CATALOG, value);
}

export function resolveScaleTag(value: string | null | undefined): TagDefinition {
  return matchCatalog(value ?? "", SCALE_CATALOG, value);
}

export function resolveTransportTag(value: string | null | undefined): TagDefinition {
  return matchCatalog(value ?? "", TRANSPORT_CATALOG, value);
}

export function resolveEmployeeStatusTag(status: EmployeeStatus | string | null | undefined): TagDefinition {
  switch (status) {
    case "ativo":
      return { key: "ativo", label: "Ativo", tone: "success" };
    case "afastado":
      return { key: "afastado", label: "Afastado", tone: "warning" };
    case "desligado":
      return { key: "desligado", label: "Desligado", tone: "danger" };
    case "ferias":
      return { key: "ferias", label: "Férias", tone: "info" };
    default:
      return { key: "nao_informado", label: "Não informado", tone: "neutral" };
  }
}

export function resolveVacationStatusTag(
  status: VacationStatus | string | null | undefined,
): TagDefinition {
  switch (status) {
    case "concluida":
      return { key: "concluida", label: "Concluída", tone: "success" };
    case "programada":
      return { key: "programada", label: "Programada", tone: "info" };
    case "em_gozo":
      return { key: "em_gozo", label: "Em gozo", tone: "warning" };
    case "solicitar":
      return { key: "solicitar", label: "A solicitar", tone: "warning" };
    case "pendente":
      return { key: "pendente", label: "Aguardando RH", tone: "warning" };
    case "recusada":
      return { key: "recusada", label: "Recusada", tone: "danger" };
    default:
      return {
        key: normalizeKey(status),
        label: toDisplayCase(status ?? "Não informado"),
        tone: "neutral",
      };
  }
}

export function resolveInsuranceTag(hasInsurance: boolean): TagDefinition {
  return hasInsurance
    ? { key: "sul_america", label: "Sul América", tone: "success" }
    : { key: "sem_plano", label: "Sem plano", tone: "neutral" };
}

export function resolveAsoValueTag(value: string | null | undefined): TagDefinition | null {
  if (!value) return { key: "nao_informado", label: "Não informado", tone: "neutral" };
  if (normalizeKey(value) === "pendente") {
    return { key: "pendente", label: "Pendente", tone: "warning" };
  }
  return null;
}

export const VACATION_STATUS_TAGS: Record<string, TagDefinition> = {
  concluida: resolveVacationStatusTag("concluida"),
  programada: resolveVacationStatusTag("programada"),
  solicitar: resolveVacationStatusTag("solicitar"),
  pendente: resolveVacationStatusTag("pendente"),
  recusada: resolveVacationStatusTag("recusada"),
};

export const DOCUMENT_TYPE_TAGS: TagDefinition[] = [
  { key: "contrato", label: "Contrato", tone: "primary" },
  { key: "rg_cpf", label: "RG / CPF", tone: "info" },
  { key: "aso", label: "ASO", tone: "success" },
  { key: "comprovante", label: "Comprovante", tone: "neutral" },
  { key: "rescisao", label: "Rescisão", tone: "danger" },
  { key: "ferias", label: "Férias", tone: "warning" },
  { key: "outros", label: "Outros", tone: "neutral" },
];

export function getDocumentTypeTag(key: string): TagDefinition {
  return (
    DOCUMENT_TYPE_TAGS.find((item) => item.key === key) ?? {
      key: "outros",
      label: "Outros",
      tone: "neutral",
    }
  );
}
