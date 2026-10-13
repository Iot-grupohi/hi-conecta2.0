"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  name: string;
  cpf: string | null;
  status: string;
  positionName: string | null;
  departmentName: string | null;
};

export function GlobalSearch() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onShortcut);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onShortcut);
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results);
        setOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function goToEmployee(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/colaboradores/${id}`);
  }

  function goToFullList() {
    const q = query.trim();
    setOpen(false);
    router.push(q ? `/colaboradores?q=${encodeURIComponent(q)}` : "/colaboradores");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        goToEmployee(results[activeIndex].id);
      } else {
        goToFullList();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    }
  }

  return (
    <div ref={rootRef} className="relative max-w-xl flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
      <Input
        ref={inputRef}
        className="bg-[var(--color-muted)] pl-9 pr-16 hover:bg-[var(--color-surface)] focus-visible:bg-[var(--color-surface)]"
        placeholder="Buscar colaborador, CPF, cargo..."
        aria-label="Busca global"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[var(--color-muted-foreground)] sm:block">
        Ctrl K
      </kbd>

      {open && query.trim().length >= 2 ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
        >
          {loading ? (
            <p className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
              Nenhum colaborador encontrado.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      activeIndex === index
                        ? "bg-[var(--color-green-soft)]"
                        : "hover:bg-[var(--color-muted)]/70",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goToEmployee(result.id)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                      <UserRound className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                        {result.name}
                      </p>
                      <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                        {[result.positionName, result.departmentName, result.cpf]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-[var(--color-border)] px-4 py-2">
            <Link
              href={
                query.trim()
                  ? `/colaboradores?q=${encodeURIComponent(query.trim())}`
                  : "/colaboradores"
              }
              className="text-xs font-semibold text-[var(--color-green-text)] hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver todos os resultados →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
