"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataToolbar } from "@/components/ui/data-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CostStat } from "@/components/hr/cost-stat";
import { TagBadge } from "@/components/hr/tag-badge";
import {
  formatCurrency,
  formatDate,
  formatSalary,
  monthlyMealForHire,
} from "@/lib/hr";
import { resolveContractTag, resolvePositionTag, resolveScaleTag } from "@/lib/tags";
import type { Employee } from "@/types/hr";

function admissionTotal(item: Employee) {
  const meal = monthlyMealForHire(item)?.amount ?? 0;
  return (item.salary ?? 0) + meal;
}

export function AdmissionsTable({
  items,
  canViewSalary,
}: {
  items: Employee[];
  canViewSalary: boolean;
}) {
  const [query, setQuery] = useState("");
  const [contractFilter, setContractFilter] = useState("todos");
  const [sortValue, setSortValue] = useState("hireDate:desc");

  const contracts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.contractType) set.add(item.contractType);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (contractFilter !== "todos" && item.contractType !== contractFilter) return false;
      if (!q) return true;
      return [item.name, item.positionName, item.contractType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const [sortBy, sortDir] = sortValue.split(":") as [
      "name" | "hireDate" | "salary" | "total",
      "asc" | "desc",
    ];
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === "salary") return ((a.salary ?? 0) - (b.salary ?? 0)) * dir;
      if (sortBy === "total") {
        return (admissionTotal(a) - admissionTotal(b)) * dir;
      }
      if (sortBy === "hireDate") {
        return ((a.hireDate ?? "").localeCompare(b.hireDate ?? "") || 0) * dir;
      }
      return a.name.localeCompare(b.name, "pt-BR") * dir;
    });
    return rows;
  }, [items, query, contractFilter, sortValue]);

  const costs = useMemo(() => {
    const salary = filtered.reduce((sum, item) => sum + (item.salary ?? 0), 0);
    const meal = filtered.reduce(
      (sum, item) => sum + (monthlyMealForHire(item)?.amount ?? 0),
      0,
    );
    return {
      salary,
      meal,
      total: salary + meal,
      count: filtered.length,
    };
  }, [filtered]);

  const money = (value: number | null | undefined) => formatSalary(value, canViewSalary);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Custo admissional = salário + alimentação do mês (diária × dias trabalhados)
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CostStat label="Admissões" value={String(costs.count)} hint="Na lista filtrada" />
        <CostStat
          label="Total salários"
          value={money(costs.salary)}
          hint="Soma dos salários"
        />
        <CostStat
          label="Total alimentação"
          value={money(costs.meal)}
          hint="Soma no mês de cada admissão"
        />
        <CostStat
          label="Custo admissional total"
          value={money(costs.total)}
          hint="Salário + alimentação"
          emphasize
        />
      </div>

      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar colaborador ou cargo..."
        filters={[
          {
            id: "contract",
            label: "Contrato",
            value: contractFilter,
            onChange: setContractFilter,
            options: [
              { value: "todos", label: "Todos os contratos" },
              ...contracts.map((name) => ({ value: name, label: name })),
            ],
          },
        ]}
        sortOptions={[
          { value: "hireDate:desc", label: "Admissão (recente)" },
          { value: "hireDate:asc", label: "Admissão (antiga)" },
          { value: "name:asc", label: "Nome (A-Z)" },
          { value: "name:desc", label: "Nome (Z-A)" },
          { value: "total:desc", label: "Custo total (maior)" },
          { value: "total:asc", label: "Custo total (menor)" },
          { value: "salary:desc", label: "Salário (maior)" },
          { value: "salary:asc", label: "Salário (menor)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={items.length}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma admissão encontrada"
          description="Ajuste os filtros ou a busca."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Escala</TableHead>
                <TableHead className="text-right">Salário</TableHead>
                <TableHead className="text-right">Alimentação</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee) => {
                const meal = monthlyMealForHire(employee);
                const total = admissionTotal(employee);
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/colaboradores/${employee.id}`}
                        className="hover:text-[var(--color-primary)]"
                      >
                        {employee.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TagBadge tag={resolvePositionTag(employee.positionName)} />
                    </TableCell>
                    <TableCell>
                      <TagBadge tag={resolveContractTag(employee.contractType)} />
                    </TableCell>
                    <TableCell>{formatDate(employee.hireDate)}</TableCell>
                    <TableCell>
                      <TagBadge tag={resolveScaleTag(employee.workScale)} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(employee.salary)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {meal ? money(meal.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="tabular-nums font-extrabold text-[var(--color-heading)]">
                        {money(total)}
                      </div>
                      {canViewSalary ? (
                        <p className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                          {formatCurrency(employee.salary)} +{" "}
                          {formatCurrency(meal?.amount ?? 0)}
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-[var(--color-muted)]/40">
                <TableCell
                  colSpan={5}
                  className="text-sm font-extrabold text-[var(--color-heading)]"
                >
                  Totais ({costs.count} {costs.count === 1 ? "admissão" : "admissões"})
                </TableCell>
                <TableCell className="text-right text-sm font-extrabold tabular-nums">
                  {money(costs.salary)}
                </TableCell>
                <TableCell className="text-right text-sm font-extrabold tabular-nums">
                  {money(costs.meal)}
                </TableCell>
                <TableCell className="text-right text-sm font-extrabold tabular-nums text-[var(--color-navy)]">
                  {money(costs.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
