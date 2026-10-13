"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createEmployeeAction,
  updateEmployeeAction,
  type EmployeeActionState,
} from "@/features/employees/actions";
import type { Department, Employee } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PositionOption = { id: string; name: string };

const initialState: EmployeeActionState = {};

function normalizeContractType(value: string | null | undefined): "CLT" | "PJ" | "Sócio" {
  const key = (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (key.includes("pj") || key.includes("pessoa juridica")) return "PJ";
  if (key.includes("socio") || key.includes("dono") || key.includes("proprietario")) return "Sócio";
  return "CLT";
}

function normalizeTransportBenefit(value: string | null | undefined): "VT" | "Mobilidade" {
  const key = (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (key.includes("mobilidade")) return "Mobilidade";
  return "VT";
}

export function EmployeeForm({
  mode,
  employee,
  departments,
  positions,
  canViewSalary = false,
  returnTo = "/colaboradores",
}: {
  mode: "create" | "edit";
  employee?: Employee;
  departments: Department[];
  positions: PositionOption[];
  canViewSalary?: boolean;
  returnTo?: string;
}) {
  const action = mode === "create" ? createEmployeeAction : updateEmployeeAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const cancelHref = returnTo || (employee ? `/colaboradores/${employee.id}` : "/colaboradores");

  return (
    <form action={formAction} className="space-y-6">
      {employee ? <input type="hidden" name="id" value={employee.id} /> : null}
      {mode === "edit" ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      {state.error ? (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo" required>
            <Input name="name" defaultValue={employee?.name ?? ""} required />
          </Field>
          <Field label="CPF">
            <Input name="cpf" defaultValue={employee?.cpf ?? ""} placeholder="000.000.000-00" />
          </Field>
          <Field label="Nascimento">
            <Input name="birthDate" type="date" defaultValue={employee?.birthDate ?? ""} />
          </Field>
          <Field label="Código externo">
            <Input name="externalCode" defaultValue={employee?.externalCode ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados profissionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Status">
            <Select name="status" defaultValue={employee?.status ?? "ativo"}>
              <option value="ativo">Ativo</option>
              <option value="ferias">Férias</option>
              <option value="afastado">Afastado</option>
              <option value="desligado">Desligado</option>
            </Select>
          </Field>
          <Field label="Tipo de contrato">
            <Select name="contractType" defaultValue={normalizeContractType(employee?.contractType)}>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Sócio">Sócio</option>
            </Select>
          </Field>
          <Field label="Cargo">
            <Select name="positionId" defaultValue={employee?.positionId ?? ""}>
              <option value="">Sem cargo</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Departamento">
            <Select name="departmentId" defaultValue={employee?.departmentId ?? ""}>
              <option value="">Sem departamento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data de admissão">
            <Input name="hireDate" type="date" defaultValue={employee?.hireDate ?? ""} />
          </Field>
          <Field label="Salário">
            {canViewSalary ? (
              <Input
                name="salary"
                defaultValue={employee?.salary != null ? String(employee.salary) : ""}
                placeholder="0.00"
              />
            ) : (
              <Input value="R$ ••••••" disabled readOnly aria-label="Salário mascarado" />
            )}
          </Field>
          <Field label="Escala">
            <Input name="workScale" defaultValue={employee?.workScale ?? ""} />
          </Field>
          <Field label="Horário">
            <Input name="workSchedule" defaultValue={employee?.workSchedule ?? ""} />
          </Field>
          <Field label="Gestor">
            <Input name="managerName" defaultValue={employee?.managerName ?? ""} />
          </Field>
          <Field label="Diretor">
            <Input name="directorName" defaultValue={employee?.directorName ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefícios e observações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Transporte" required>
            <Select
              name="transportBenefit"
              defaultValue={normalizeTransportBenefit(employee?.transportBenefit)}
              required
            >
              <option value="VT">VT</option>
              <option value="Mobilidade">Mobilidade</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hasHealthInsurance"
              defaultChecked={employee?.hasHealthInsurance ?? false}
              className="h-4 w-4"
            />
            Possui plano Sul América
          </label>
          <Field label="Observações internas" className="md:col-span-2">
            <textarea
              name="notes"
              defaultValue={employee?.notes ?? ""}
              rows={4}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : mode === "create" ? "Criar colaborador" : "Salvar alterações"}
        </Button>
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`space-y-1.5 text-sm ${className ?? ""}`}>
      <span className="font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
