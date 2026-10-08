import Link from "next/link";
import { ArrowLeft, Pencil, ShieldPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/hr/status-badge";
import { TagBadge } from "@/components/hr/tag-badge";
import { EmployeeDocumentsPanel } from "@/features/documents/employee-documents-panel";
import {
  formatCurrency,
  formatCpf,
  formatDate,
  formatSalary,
  getEmployeeAge,
  getTenureYears,
} from "@/lib/hr";
import { terminateEmployeeAction } from "@/features/employees/actions";
import { DeleteEmployeeButton } from "@/features/employees/delete-employee-button";
import { EmployeeHistoryCrud } from "@/features/employees/employee-history-crud";
import {
  resolveContractTag,
  resolveDepartmentTag,
  resolveInsuranceTag,
  resolveNoticeTag,
  resolvePositionTag,
  resolveScaleTag,
  resolveTerminationTag,
  resolveTransportTag,
} from "@/lib/tags";
import type { Employee } from "@/types/hr";
import type { Permission } from "@/lib/permissions";

type History = Awaited<ReturnType<typeof import("@/lib/data").getEmployeeHistory>>;

export function EmployeeDetailView({
  employee,
  history,
  permissions,
  returnTo = "/colaboradores",
}: {
  employee: Employee;
  history: History;
  permissions: Permission[];
  returnTo?: string;
}) {
  const age = getEmployeeAge(employee.birthDate);
  const tenure = getTenureYears(employee.hireDate);
  const canUpdate = permissions.includes("employees:update");
  const canDelete = permissions.includes("employees:delete");
  const canViewSalary = permissions.includes("salary:read");
  const canManageDocs = permissions.includes("employees:update");
  const editHref = `/colaboradores/${employee.id}/editar?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div>
      <div className="mb-4">
        <Link
          href={returnTo}
          className="inline-flex h-8 items-center gap-2 rounded-[var(--radius-md)] px-3 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Link>
      </div>

      <PageHeader
        title={employee.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <TagBadge tag={resolvePositionTag(employee.positionName)} />
            <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
          </span>
        }
        actions={
          <>
            <StatusBadge status={employee.status} />
            {canUpdate ? (
              <Link
                href={editHref}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs font-medium hover:bg-[var(--color-muted)]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Link>
            ) : null}
            {canDelete && employee.status !== "desligado" ? (
              <form action={terminateEmployeeAction}>
                <input type="hidden" name="id" value={employee.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Button variant="outline" size="sm" type="submit">
                  Desligar
                </Button>
              </form>
            ) : null}
            {canDelete ? (
              <DeleteEmployeeButton
                employeeId={employee.id}
                employeeName={employee.name}
                returnTo={returnTo}
              />
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>Identificação e informações cadastrais</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="CPF" value={formatCpf(employee.cpf)} />
            <InfoItem label="Nascimento" value={formatDate(employee.birthDate)} />
            <InfoItem label="Idade" value={age != null ? `${age} anos` : "—"} />
            <InfoItem label="Código externo" value={employee.externalCode ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Tempo de casa" value={tenure != null ? `${tenure} anos` : "—"} />
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]">
                Contrato
              </p>
              <div className="mt-1">
                <TagBadge tag={resolveContractTag(employee.contractType)} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]">
                Escala
              </p>
              <div className="mt-1">
                <TagBadge tag={resolveScaleTag(employee.workScale)} />
              </div>
            </div>
            <InfoItem label="Horário" value={employee.workSchedule ?? "—"} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Dados profissionais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]">
                Cargo
              </p>
              <div className="mt-1">
                <TagBadge tag={resolvePositionTag(employee.positionName)} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]">
                Setor
              </p>
              <div className="mt-1">
                <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
              </div>
            </div>
            <InfoItem label="Gestor" value={employee.managerName ?? "—"} />
            <InfoItem label="Diretor" value={employee.directorName ?? "—"} />
            <InfoItem label="Data de admissão" value={formatDate(employee.hireDate)} />
            <InfoItem label="Salário" value={formatSalary(employee.salary, canViewSalary)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefícios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem
              label="Alimentação"
              value={
                employee.mealAllowance != null ? formatCurrency(employee.mealAllowance) : "—"
              }
            />
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]">
                VT / Mobilidade
              </p>
              <div className="mt-1">
                <TagBadge tag={resolveTransportTag(employee.transportBenefit)} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <ShieldPlus className="h-4 w-4 text-[var(--color-primary)]" />
              <TagBadge
                tag={resolveInsuranceTag(
                  employee.hasHealthInsurance || history.insurance.length > 0,
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployeeHistoryCrud employee={employee} history={history} canWrite={canUpdate} />

      {history.terminations.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Histórico de desligamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.terminations.map((item) => {
              const typeTag = resolveTerminationTag(item.terminationType, item.terminationTypeLabel);
              const noticeTag = resolveNoticeTag(item.noticeType);
              return (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                >
                  <div className="flex flex-wrap gap-2">
                    <TagBadge tag={typeTag} />
                    <TagBadge tag={noticeTag} />
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                    Último dia {formatDate(item.lastWorkDay)} · Valor {formatCurrency(item.value)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <EmployeeDocumentsPanel
        employeeId={employee.id}
        documents={history.documents}
        canManage={canManageDocs}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Observações internas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {employee.notes ??
              "Sem observações cadastradas. Este espaço está preparado para anotações internas do RH."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}

