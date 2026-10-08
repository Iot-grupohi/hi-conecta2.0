"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export type SortOption = {
  value: string;
  label: string;
};

export type FilterOption = {
  value: string;
  label: string;
};

export function DataToolbar({
  query,
  onQueryChange,
  queryPlaceholder = "Buscar...",
  filters = [],
  sortOptions = [],
  sortValue,
  onSortChange,
  resultCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder?: string;
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <Card className="mb-4 p-4 hover:translate-y-0 hover:border-[var(--color-border)] hover:shadow-[var(--shadow-sm)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(auto-fit,minmax(160px,1fr))]">
        <div className="relative min-w-0 lg:col-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            className="pl-9"
            placeholder={queryPlaceholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Buscar na tabela"
          />
        </div>
        {filters.map((filter) => (
          <Select
            key={filter.id}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.label}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ))}
        {sortOptions.length && sortValue && onSortChange ? (
          <Select
            value={sortValue}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Ordenar"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
        Exibindo {resultCount} de {totalCount} registros
      </p>
    </Card>
  );
}
