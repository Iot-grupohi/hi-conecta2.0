import {
  formatCpf,
  formatCurrency,
  formatDate,
  formatSalary,
  getEmployeeAge,
  getTenureYears,
} from "@/lib/hr";
import { StatusBadge } from "@/components/hr/status-badge";
import { TagBadge } from "@/components/hr/tag-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  resolveContractTag,
  resolveDepartmentTag,
  resolveInsuranceTag,
  resolvePositionTag,
  resolveScaleTag,
  resolveTransportTag,
  resolveVacationStatusTag,
} from "@/lib/tags";
import type { Employee } from "@/types/hr";
import { VacationRequestForm } from "@/features/vacations/vacation-request-form";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  ShieldPlus,
  UserRound,
  UtensilsCrossed,
  Shirt,
  Bus,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

type History = Awaited<ReturnType<typeof import("@/lib/data").getEmployeeHistory>>;

function MeHero({
  eyebrow = "Meu espaço",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="relative mb-2 overflow-hidden rounded-[var(--radius-lg)] text-white shadow-[var(--shadow-md)]">
      <div className="absolute inset-0" style={{ background: "var(--gradient-mesh)" }} />
      <div className="brand-orb -left-12 top-0 h-40 w-40 bg-[rgba(0,217,49,0.28)]" />
      <div className="brand-orb -right-10 bottom-0 h-36 w-36 bg-[rgba(0,24,200,0.35)]" />
      <div className="relative flex flex-col gap-5 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-8 md:py-10">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold tracking-[0.22em] text-[var(--color-green)] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/75">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ProfileFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">
        {label}
      </p>
      <div className="mt-2 text-sm font-extrabold text-[var(--color-heading)]">{value}</div>
    </div>
  );
}

function SummaryCard({
  eyebrow,
  title,
  badges,
  avatar,
  icon: Icon,
  facts,
}: {
  eyebrow: string;
  title: string;
  badges?: React.ReactNode;
  avatar?: string;
  icon?: LucideIcon;
  facts: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:px-7">
        {avatar ? (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-[var(--color-navy)]"
            style={{ background: "linear-gradient(145deg, #e8fff0 0%, #dce4ff 100%)" }}
            aria-hidden
          >
            {avatar}
          </div>
        ) : Icon ? (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[var(--color-navy)]"
            style={{ background: "linear-gradient(145deg, #e8fff0 0%, #dce4ff 100%)" }}
            aria-hidden
          >
            <Icon className="h-7 w-7" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-1 truncate text-xl font-extrabold text-[var(--color-heading)]">
            {title}
          </h2>
          {badges ? <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div> : null}
        </div>
      </div>
      <div
        className={`grid gap-4 border-t border-[var(--color-border)] bg-[var(--color-muted)]/35 px-5 py-5 md:px-7 ${
          facts.length >= 4
            ? "sm:grid-cols-2 lg:grid-cols-4"
            : facts.length === 3
              ? "sm:grid-cols-3"
              : facts.length === 2
                ? "sm:grid-cols-2"
                : ""
        }`}
      >
        {facts.map((fact) => (
          <ProfileFact key={fact.label} label={fact.label} value={fact.value} />
        ))}
      </div>
    </section>
  );
}

function ContentBlock({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] md:p-6 ${className}`}
    >
      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-base font-extrabold text-[var(--color-heading)]">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function HighlightStrip({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[rgba(0,217,49,0.3)] bg-[var(--color-green-soft)]/40 px-5 py-5 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-navy)] uppercase">
            {label}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{hint}</p>
        </div>
        <div className="text-2xl font-extrabold text-[var(--color-navy)]">{value}</div>
      </div>
    </section>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-8 shadow-[var(--shadow-sm)]">
      <EmptyState title={title} description={description} />
    </div>
  );
}

export function MeuEspacoHome({ employee, history }: { employee: Employee; history: History }) {
  const firstName = employee.name.split(" ")[0];
  const pendingVacations = history.vacations.filter(
    (item) => item.status === "pendente" || item.status === "solicitar",
  ).length;
  const programmed = history.vacations.filter((item) => item.status === "programada").length;
  const tenure = getTenureYears(employee.hireDate);

  const shortcuts = [
    {
      href: "/meu-espaco/dados",
      label: "Meus dados",
      description: "Cadastro, cargo e contrato",
      meta: employee.positionName ?? "Ver perfil",
      icon: UserRound,
      eyebrow: "Perfil",
    },
    {
      href: "/meu-espaco/ferias",
      label: "Férias",
      description: "Solicitar e acompanhar",
      meta:
        pendingVacations > 0
          ? `${pendingVacations} aguardando RH`
          : programmed > 0
            ? `${programmed} programada(s)`
            : "Nenhuma pendência",
      icon: CalendarDays,
      eyebrow: "Ausências",
    },
    {
      href: "/meu-espaco/beneficios",
      label: "Benefícios",
      description: "Transporte e plano",
      meta: employee.transportBenefit ?? "Ver benefícios",
      icon: BriefcaseBusiness,
      eyebrow: "Pacote",
    },
    {
      href: "/meu-espaco/aso",
      label: "Exames ASO",
      description: "Admissional e periódicos",
      meta: history.aso.length ? `${history.aso.length} registro(s)` : "Sem exames",
      icon: ClipboardList,
      eyebrow: "Saúde",
    },
    {
      href: "/meu-espaco/documentos",
      label: "Documentos",
      description: "Arquivos do RH",
      meta: history.documents.length ? `${history.documents.length} arquivo(s)` : "Vazio",
      icon: FileText,
      eyebrow: "Arquivos",
    },
  ];

  return (
    <div className="space-y-6">
      <MeHero
        title={`Olá, ${firstName}`}
        description="Acesse seus dados, férias, benefícios e documentos."
        actions={
          <>
            <StatusBadge status={employee.status} />
            <Link
              href="/meu-espaco/ferias"
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-green)] px-4 text-xs font-extrabold text-[var(--color-navy)] transition hover:bg-[var(--color-green-hover)]"
            >
              Solicitar férias
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <SummaryCard
        eyebrow="Colaborador"
        title={employee.name}
        avatar={getInitials(employee.name)}
        badges={
          <>
            <TagBadge tag={resolvePositionTag(employee.positionName)} />
            <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
          </>
        }
        facts={[
          {
            label: "Tempo de casa",
            value: tenure != null ? `${tenure} anos` : "—",
          },
          {
            label: "Aguardando RH",
            value: String(pendingVacations),
          },
          {
            label: "Admissão",
            value: formatDate(employee.hireDate),
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(0,217,49,0.35)] md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-foreground)] transition group-hover:text-[var(--color-green)]" />
              </div>
              <p className="mt-4 text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase">
                {item.eyebrow}
              </p>
              <p className="mt-1 text-base font-extrabold text-[var(--color-heading)]">{item.label}</p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{item.description}</p>
              <p className="mt-4 text-xs font-semibold text-[var(--color-navy)]">{item.meta}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MeusDadosSection({ employee }: { employee: Employee }) {
  const age = getEmployeeAge(employee.birthDate);
  const tenure = getTenureYears(employee.hireDate);
  const firstName = employee.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <MeHero
        title={firstName}
        description="Seu cadastro e vínculo com a empresa, em um só lugar."
        actions={<StatusBadge status={employee.status} />}
      />

      <SummaryCard
        eyebrow="Colaborador"
        title={employee.name}
        avatar={getInitials(employee.name)}
        badges={
          <>
            <TagBadge tag={resolvePositionTag(employee.positionName)} />
            <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
          </>
        }
        facts={[
          { label: "Admissão", value: formatDate(employee.hireDate) },
          {
            label: "Tempo de casa",
            value: tenure != null ? `${tenure} anos` : "—",
          },
          {
            label: "Contrato",
            value: <TagBadge tag={resolveContractTag(employee.contractType)} />,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentBlock eyebrow="Pessoal" title="Dados cadastrais">
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileFact label="CPF" value={formatCpf(employee.cpf)} />
            <ProfileFact label="Nascimento" value={formatDate(employee.birthDate)} />
            <ProfileFact label="Idade" value={age != null ? `${age} anos` : "—"} />
          </div>
        </ContentBlock>

        <ContentBlock eyebrow="Trabalho" title="Rotina e equipe">
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileFact
              label="Escala"
              value={<TagBadge tag={resolveScaleTag(employee.workScale)} />}
            />
            <ProfileFact label="Horário" value={employee.workSchedule ?? "—"} />
            <ProfileFact label="Gestor" value={employee.managerName ?? "—"} />
            {employee.directorName ? (
              <ProfileFact label="Diretoria" value={employee.directorName} />
            ) : null}
          </div>
        </ContentBlock>
      </div>

      <HighlightStrip
        label="Remuneração"
        hint="Valor base do seu vínculo"
        value={formatSalary(employee.salary, true)}
      />
    </div>
  );
}

function sortVacationsNewest(
  a: History["vacations"][number],
  b: History["vacations"][number],
) {
  return (b.createdAt ?? b.startDate ?? "").localeCompare(a.createdAt ?? a.startDate ?? "");
}

function VacationStatusLine({
  item,
  emphasize,
}: {
  item: History["vacations"][number];
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border px-5 py-4 ${
        emphasize
          ? "border-[rgba(0,217,49,0.4)] bg-[var(--color-green-soft)]/50"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-heading)]">
            {formatDate(item.startDate)} — {formatDate(item.endDate)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {item.days != null ? `${item.days} dias úteis` : "Período registrado"}
          </p>
        </div>
        <TagBadge tag={resolveVacationStatusTag(item.status)} />
      </div>
      {item.status === "pendente" && item.notes ? (
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">Obs.: {item.notes}</p>
      ) : null}
      {item.rhNotes ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-muted)] px-3 py-2 text-xs font-medium">
          <span className="text-[var(--color-muted-foreground)]">Resposta do RH · </span>
          {item.rhNotes}
        </p>
      ) : null}
    </div>
  );
}

export function MinhasFeriasSection({ history }: { history: History }) {
  const awaitingItems = [...history.vacations]
    .filter((item) => item.status === "pendente" || item.status === "solicitar")
    .sort(sortVacationsNewest);

  const programmedItems = [...history.vacations]
    .filter((item) => item.status === "programada")
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));

  const pastItems = [...history.vacations]
    .filter((item) => item.status === "concluida" || item.status === "recusada")
    .sort(sortVacationsNewest)
    .slice(0, 6);

  const nextProgrammed = programmedItems[0];

  return (
    <div className="space-y-6">
      <MeHero
        title="Férias"
        description="Acompanhe o que ainda espera o RH e o que já foi confirmado."
      />

      <SummaryCard
        eyebrow="Ausências"
        title="Suas férias"
        icon={CalendarDays}
        facts={[
          { label: "Aguardando RH", value: String(awaitingItems.length) },
          { label: "Confirmadas", value: String(programmedItems.length) },
          {
            label: "Próximo período",
            value: nextProgrammed
              ? formatDate(nextProgrammed.startDate)
              : "Sem programação",
          },
        ]}
      />

      <VacationRequestForm />

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentBlock eyebrow="Análise" title="Aguardando RH">
          {awaitingItems.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Nenhuma solicitação pendente no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {awaitingItems.map((item) => (
                <VacationStatusLine key={item.id} item={item} emphasize />
              ))}
            </div>
          )}
        </ContentBlock>

        <ContentBlock eyebrow="Confirmado" title="Férias programadas">
          {programmedItems.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Assim que o RH aprovar, o período aparece aqui.
            </p>
          ) : (
            <div className="space-y-3">
              {programmedItems.map((item) => (
                <VacationStatusLine key={item.id} item={item} emphasize />
              ))}
            </div>
          )}
        </ContentBlock>
      </div>

      {pastItems.length > 0 ? (
        <ContentBlock eyebrow="Passado" title="Histórico recente">
          <div className="space-y-3">
            {pastItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"
              >
                <p className="text-sm font-semibold text-[var(--color-heading)]">
                  {formatDate(item.startDate)} — {formatDate(item.endDate)}
                  <span className="ml-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                    {item.days != null ? `${item.days} dias` : ""}
                  </span>
                </p>
                <TagBadge tag={resolveVacationStatusTag(item.status)} />
              </div>
            ))}
          </div>
        </ContentBlock>
      ) : null}
    </div>
  );
}

export function MeusBeneficiosSection({
  employee,
  history,
}: {
  employee: Employee;
  history: History;
}) {
  const hasPlan = employee.hasHealthInsurance || history.insurance.length > 0;
  const partnerCredits = history.mealPartnerCredits ?? [];
  const partnerQty = partnerCredits.reduce((sum, item) => sum + item.quantity, 0);
  const partnerTotal = partnerCredits.reduce((sum, item) => sum + item.consumptionValue, 0);
  const partnerName = partnerCredits[0]?.partnerName ?? "Paraíba Grill";
  const laundryCredits = history.laundryCredits ?? [];
  const laundryTotal = laundryCredits.reduce((sum, item) => sum + item.amount, 0);
  const latestLaundry = laundryCredits[0];
  const benefitCredits = history.benefitCredits ?? [];
  const latestBenefit = benefitCredits[0];
  const benefitMealTotal = benefitCredits.reduce((sum, item) => sum + (item.mealAmount ?? 0), 0);
  const transportCredits = history.transportCredits ?? [];
  const transportTotal = transportCredits.reduce((sum, item) => sum + item.totalAmount, 0);
  const latestTransport = transportCredits[0];

  return (
    <div className="space-y-6">
      <MeHero
        title="Benefícios"
        description="CAJU, vale transporte, lavanderia, crédito parceiro e plano de saúde."
      />

      <SummaryCard
        eyebrow="Pacote"
        title="Seus benefícios"
        icon={BriefcaseBusiness}
        facts={[
          {
            label: "CAJU (último mês)",
            value:
              latestBenefit?.mealAmount != null
                ? formatCurrency(latestBenefit.mealAmount)
                : employee.mealAllowance != null
                  ? formatCurrency(employee.mealAllowance)
                  : "—",
          },
          {
            label: "Vale transporte",
            value: latestTransport ? formatCurrency(latestTransport.totalAmount) : "—",
          },
          {
            label: "Lavanderia",
            value: latestLaundry ? formatCurrency(latestLaundry.amount) : "—",
          },
          {
            label: "Plano de saúde",
            value: <TagBadge tag={resolveInsuranceTag(hasPlan)} />,
          },
        ]}
      />

      {benefitCredits.length > 0 ? (
        <>
          <HighlightStrip
            label="Controle CAJU"
            hint="Alimentação creditada nos meses importados"
            value={formatCurrency(benefitMealTotal)}
          />
          <ContentBlock eyebrow="CAJU" title="Alimentação e mobilidade">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
                <WalletCards className="h-4 w-4" />
              </span>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Valores mensais de auxílio alimentação e mobilidade. Entradas no meio do mês
                aparecem como proporcionais.
              </p>
            </div>
            <div className="space-y-3">
              {benefitCredits.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-extrabold text-[var(--color-heading)]">
                      {item.monthLabel}/{item.year}
                      {item.isProportional ? " · proporcional" : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      Alimentação{" "}
                      {item.mealAmount != null ? formatCurrency(item.mealAmount) : "—"}
                      {item.mobilityAmount != null
                        ? ` · Mobilidade ${formatCurrency(item.mobilityAmount)}`
                        : item.mobilityNote
                          ? ` · ${item.mobilityNote}`
                          : ""}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-[var(--color-navy)]">
                    {formatCurrency(
                      (item.mealAmount ?? 0) +
                        (item.mobilityAmount ?? 0) +
                        (item.transportAmount ?? 0),
                    )}
                  </p>
                </div>
              ))}
            </div>
          </ContentBlock>
        </>
      ) : null}

      {transportCredits.length > 0 ? (
        <>
          <HighlightStrip
            label="Vale transporte"
            hint="Passagens diárias × dias do mês · proporcional quando aplicável"
            value={formatCurrency(transportTotal)}
          />
          <ContentBlock eyebrow="Transporte" title="Histórico de vale transporte">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
                <Bus className="h-4 w-4" />
              </span>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Valores mensais de vale transporte conforme a planilha de RH. Entradas no meio
                do mês aparecem como proporcionais.
              </p>
            </div>
            <div className="space-y-3">
              {transportCredits.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-extrabold text-[var(--color-heading)]">
                      {item.monthLabel}/{item.year}
                      {item.isProportional ? " · proporcional" : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {[
                        item.days != null ? `${item.days} dia(s)` : null,
                        item.dailyValue != null
                          ? `${formatCurrency(item.dailyValue)}/dia`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Crédito mensal"}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-[var(--color-navy)]">
                    {formatCurrency(item.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </ContentBlock>
        </>
      ) : null}

      {laundryCredits.length > 0 ? (
        <>
          <HighlightStrip
            label="Crédito lavanderia"
            hint="Padrão R$ 120,00 · proporcional se admitido no meio do mês"
            value={formatCurrency(laundryTotal)}
          />

          <ContentBlock eyebrow="Lavanderia" title="Histórico mensal">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
                <Shirt className="h-4 w-4" />
              </span>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Crédito mensal para lavanderia. Quem entra no meio do mês recebe valor
                proporcional aos dias trabalhados.
              </p>
            </div>
            <div className="space-y-3">
              {laundryCredits.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-extrabold text-[var(--color-heading)]">
                      {item.monthLabel}/{item.year}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {item.isProportional ? "Proporcional (meio do mês)" : "Valor integral"}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-[var(--color-navy)]">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </ContentBlock>
        </>
      ) : null}

      {partnerCredits.length > 0 ? (
        <>
          <HighlightStrip
            label={`Crédito ${partnerName}`}
            hint="Refeições liberadas no restaurante parceiro até o vale alimentação"
            value={formatCurrency(partnerTotal)}
          />

          <ContentBlock eyebrow="Parceiro" title={`${partnerName} · até o vale`}>
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Enquanto o vale alimentação não chega, a empresa registra o crédito das
                refeições no {partnerName}. Total: {partnerQty} refeição(ões).
              </p>
            </div>
            <div className="space-y-3">
              {partnerCredits.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-extrabold text-[var(--color-heading)]">
                      {item.monthLabel}/{item.year}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {item.orderDates || "Datas não informadas"} · {item.quantity} refeição(ões)
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-[var(--color-navy)]">
                    {formatCurrency(item.consumptionValue)}
                  </p>
                </div>
              ))}
            </div>
          </ContentBlock>
        </>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentBlock eyebrow="Dia a dia" title="Vale e deslocamento">
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileFact
              label="Vale alimentação"
              value={
                employee.mealAllowance != null
                  ? formatCurrency(employee.mealAllowance)
                  : "Aguardando liberação"
              }
            />
            <ProfileFact
              label="Transporte"
              value={<TagBadge tag={resolveTransportTag(employee.transportBenefit)} />}
            />
          </div>
        </ContentBlock>

        <ContentBlock eyebrow="Saúde" title="Plano médico">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
              <ShieldPlus className="h-4 w-4" />
            </span>
            <div>
              <TagBadge tag={resolveInsuranceTag(hasPlan)} />
              <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                {hasPlan
                  ? "Cobertura vinculada ao seu cadastro."
                  : "Nenhum plano vinculado no momento."}
              </p>
            </div>
          </div>
        </ContentBlock>
      </div>

      {history.insurance.length > 0 ? (
        <ContentBlock eyebrow="Detalhes" title="Registros do plano">
          <div className="space-y-3">
            {history.insurance.map((item, index) => (
              <div
                key={`${item.employeeId ?? "ins"}-${index}`}
                className="rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"
              >
                <p className="text-sm font-extrabold text-[var(--color-heading)]">
                  {item.provider ?? "Plano de saúde"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{item.name}</p>
              </div>
            ))}
          </div>
        </ContentBlock>
      ) : null}
    </div>
  );
}

export function MeusAsoSection({ history }: { history: History }) {
  const exam = history.aso[0];
  const lines = exam
    ? [
        {
          label: "Admissional",
          date: exam.admissionExamDate,
          valid: exam.admissionExamValidUntil,
        },
        {
          label: "1º periódico",
          date: exam.periodic1Date,
          valid: exam.periodic1ValidUntil,
        },
        {
          label: "2º periódico",
          date: exam.periodic2Date,
          valid: exam.periodic2ValidUntil,
        },
        {
          label: "3º periódico",
          date: exam.periodic3Date,
          valid: exam.periodic3ValidUntil,
        },
      ].filter((item) => item.date || item.valid)
    : [];

  return (
    <div className="space-y-6">
      <MeHero
        title="Exames ASO"
        description="Admissional e periódicos registrados pelo RH."
      />

      <SummaryCard
        eyebrow="Saúde ocupacional"
        title="Seus exames"
        icon={ClipboardList}
        facts={[
          { label: "Registros", value: String(history.aso.length) },
          {
            label: "Último admissional",
            value: exam?.admissionExamDate ? formatDate(exam.admissionExamDate) : "—",
          },
          {
            label: "Validade",
            value: exam?.admissionExamValidUntil
              ? formatDate(exam.admissionExamValidUntil)
              : "—",
          },
        ]}
      />

      {history.aso.length === 0 ? (
        <EmptyPanel
          title="Sem exames cadastrados"
          description="Seus ASOs aparecerão aqui quando o RH registrar."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lines.map((item) => (
            <ContentBlock key={item.label} eyebrow="Exame" title={item.label}>
              <div className="grid gap-5 sm:grid-cols-2">
                <ProfileFact label="Realizado em" value={formatDate(item.date) || "—"} />
                <ProfileFact label="Válido até" value={formatDate(item.valid) || "—"} />
              </div>
            </ContentBlock>
          ))}
        </div>
      )}
    </div>
  );
}

export function MeusDocumentosSection({ history }: { history: History }) {
  const latest = history.documents[0];

  return (
    <div className="space-y-6">
      <MeHero
        title="Documentos"
        description="Arquivos disponibilizados pelo RH para você."
      />

      <SummaryCard
        eyebrow="Arquivos"
        title="Sua pasta"
        icon={FileText}
        facts={[
          { label: "Total", value: String(history.documents.length) },
          {
            label: "Mais recente",
            value: latest ? latest.title : "Nenhum",
          },
          {
            label: "Enviado em",
            value: latest ? formatDate(latest.createdAt.slice(0, 10)) : "—",
          },
        ]}
      />

      {history.documents.length === 0 ? (
        <EmptyPanel
          title="Nenhum documento"
          description="Quando o RH enviar arquivos, eles aparecerão aqui."
        />
      ) : (
        <ContentBlock eyebrow="Disponíveis" title="Lista de documentos">
          <div className="space-y-3">
            {history.documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[var(--color-heading)]">
                      {document.title}
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                      {document.documentType} · {document.fileName}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">
                  {formatDate(document.createdAt.slice(0, 10))}
                </span>
              </div>
            ))}
          </div>
        </ContentBlock>
      )}
    </div>
  );
}
