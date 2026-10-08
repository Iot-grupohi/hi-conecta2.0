"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TagBadge } from "@/components/hr/tag-badge";
import { formatCurrency } from "@/lib/hr";
import { resolveInsuranceTag, resolveTransportTag } from "@/lib/tags";
import type { Employee } from "@/types/hr";

export function BenefitsView({ employees }: { employees: Employee[] }) {
  const active = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.status !== "desligado" &&
          (employee.mealAllowance != null ||
            employee.transportBenefit ||
            employee.hasHealthInsurance),
      ),
    [employees],
  );

  const [query, setQuery] = useState("");
  const [transportFilter, setTransportFilter] = useState("todos");
  const [insuranceFilter, setInsuranceFilter] = useState("todos");
  const [sortValue, setSortValue] = useState("name:asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = active.filter((employee) => {
      const transport = resolveTransportTag(employee.transportBenefit);
      const insurance = resolveInsuranceTag(employee.hasHealthInsurance);
      if (transportFilter !== "todos" && transport.key !== transportFilter) return false;
      if (insuranceFilter !== "todos" && insurance.key !== insuranceFilter) return false;
      if (!q) return true;
      return employee.name.toLowerCase().includes(q);
    });

    const [, sortDir] = sortValue.split(":") as ["name", "asc" | "desc"];
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name, "pt-BR") * dir);
    return rows;
  }, [active, query, transportFilter, insuranceFilter, sortValue]);

  const withTransport = active.filter((e) => e.transportBenefit).length;
  const withMeal = active.filter((e) => e.mealAllowance != null).length;
  const withInsurance = active.filter((e) => e.hasHealthInsurance).length;

  return (
    <div>
      <PageHeader
        title="Benefícios"
        description="Alimentação, VT/Mobilidade e plano de saúde com tags padronizadas."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Com alimentação</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{withMeal}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">VT / Mobilidade</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{withTransport}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sul América</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{withInsurance}</CardContent>
        </Card>
      </div>

      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar colaborador..."
        filters={[
          {
            id: "transport",
            label: "Transporte",
            value: transportFilter,
            onChange: setTransportFilter,
            options: [
              { value: "todos", label: "Todos os transportes" },
              { value: "mobilidade", label: "Mobilidade" },
              { value: "vt", label: "Vale transporte" },
              { value: "pix", label: "Pix" },
              { value: "nao_informado", label: "Não informado" },
            ],
          },
          {
            id: "insurance",
            label: "Plano",
            value: insuranceFilter,
            onChange: setInsuranceFilter,
            options: [
              { value: "todos", label: "Todos os planos" },
              { value: "sul_america", label: "Sul América" },
              { value: "sem_plano", label: "Sem plano" },
            ],
          },
        ]}
        sortOptions={[
          { value: "name:asc", label: "Nome (A-Z)" },
          { value: "name:desc", label: "Nome (Z-A)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={active.length}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum benefício encontrado" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Alimentação</TableHead>
                <TableHead>VT / Mobilidade</TableHead>
                <TableHead>Plano</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/colaboradores/${employee.id}`}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {employee.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCurrency(employee.mealAllowance)}</TableCell>
                  <TableCell>
                    <TagBadge tag={resolveTransportTag(employee.transportBenefit)} />
                  </TableCell>
                  <TableCell>
                    <TagBadge tag={resolveInsuranceTag(employee.hasHealthInsurance)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
