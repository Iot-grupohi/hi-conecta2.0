"use client";

import { useMemo, useState } from "react";
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
import { TagBadge } from "@/components/hr/tag-badge";
import { formatDate } from "@/lib/hr";
import { resolveDepartmentTag, resolveVacationStatusTag } from "@/lib/tags";
import type { Vacation } from "@/types/hr";

export function VacationsTable({ items }: { items: Vacation[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [sortValue, setSortValue] = useState("createdAt:desc");

  const departments = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.departmentName) set.add(item.departmentName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (statusFilter !== "todos" && item.status !== statusFilter) return false;
      if (departmentFilter !== "todos" && item.departmentName !== departmentFilter) return false;
      if (!q) return true;
      return [item.employeeName, item.departmentName, item.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    const [sortBy, sortDir] = sortValue.split(":") as [
      "name" | "startDate" | "days" | "createdAt",
      "asc" | "desc",
    ];
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === "days") return ((a.days ?? 0) - (b.days ?? 0)) * dir;
      if (sortBy === "createdAt") {
        const aKey = a.createdAt ?? a.startDate ?? "";
        const bKey = b.createdAt ?? b.startDate ?? "";
        return (aKey.localeCompare(bKey) || 0) * dir;
      }
      if (sortBy === "startDate") {
        return ((a.startDate ?? "").localeCompare(b.startDate ?? "") || 0) * dir;
      }
      return a.employeeName.localeCompare(b.employeeName, "pt-BR") * dir;
    });
    return rows;
  }, [items, query, statusFilter, departmentFilter, sortValue]);

  return (
    <div>
      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar colaborador ou setor..."
        filters={[
          {
            id: "status",
            label: "Situação",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "todos", label: "Todas as situações" },
              { value: "programada", label: "Programada" },
              { value: "concluida", label: "Concluída" },
              { value: "solicitar", label: "A solicitar" },
              { value: "pendente", label: "Aguardando RH" },
              { value: "recusada", label: "Recusada" },
            ],
          },
          {
            id: "department",
            label: "Setor",
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: [
              { value: "todos", label: "Todos os setores" },
              ...departments.map((name) => ({ value: name, label: name })),
            ],
          },
        ]}
        sortOptions={[
          { value: "createdAt:desc", label: "Pedido (mais recente)" },
          { value: "createdAt:asc", label: "Pedido (mais antigo)" },
          { value: "startDate:desc", label: "Início (recente)" },
          { value: "startDate:asc", label: "Início (antigo)" },
          { value: "name:asc", label: "Nome (A-Z)" },
          { value: "days:desc", label: "Dias (maior)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={items.length}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma férias encontrada" description="Ajuste os filtros ou a busca." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Limite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vacation) => (
                <TableRow key={vacation.id}>
                  <TableCell className="font-medium">{vacation.employeeName}</TableCell>
                  <TableCell>
                    <TagBadge tag={resolveDepartmentTag(vacation.departmentName)} />
                  </TableCell>
                  <TableCell>{formatDate(vacation.startDate)}</TableCell>
                  <TableCell>{formatDate(vacation.endDate)}</TableCell>
                  <TableCell>{vacation.days ?? "—"}</TableCell>
                  <TableCell>
                    <TagBadge tag={resolveVacationStatusTag(vacation.status)} />
                  </TableCell>
                  <TableCell>{formatDate(vacation.deadlineDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
