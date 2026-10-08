"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Download, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DOCUMENT_TYPE_TAGS, getDocumentTypeTag } from "@/lib/tags";
import { formatDate } from "@/lib/hr";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import {
  deleteEmployeeDocumentAction,
  uploadEmployeeDocumentAction,
  type DocumentActionState,
} from "@/features/documents/actions";
import { Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";

export type DocumentListItem = {
  id: string;
  title: string;
  documentType: string;
  fileName: string;
  fileSize: number | null;
  createdAt: string;
  employeeId: string;
  employeeName: string;
};

export function DocumentsTable({
  items,
  employees = [],
  canWrite = false,
}: {
  items: DocumentListItem[];
  employees?: EmployeeOption[];
  canWrite?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [sortValue, setSortValue] = useState("createdAt:desc");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pending] = useActionState<DocumentActionState, FormData>(
    uploadEmployeeDocumentAction,
    {},
  );

  useCloseOnSuccess(pending, state.success, () => setUploadOpen(false));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (typeFilter !== "todos" && item.documentType !== typeFilter) return false;
      if (!q) return true;
      return [item.title, item.employeeName, item.fileName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const [sortBy, sortDir] = sortValue.split(":") as ["name" | "createdAt", "asc" | "desc"];
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === "createdAt") {
        return a.createdAt.localeCompare(b.createdAt) * dir;
      }
      return a.employeeName.localeCompare(b.employeeName, "pt-BR") * dir;
    });
    return rows;
  }, [items, query, typeFilter, sortValue]);

  return (
    <div>
      {canWrite ? (
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Anexar
          </Button>
        </div>
      ) : null}
      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar documento ou colaborador..."
        filters={[
          {
            id: "type",
            label: "Tipo",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "todos", label: "Todos os tipos" },
              ...DOCUMENT_TYPE_TAGS.map((tag) => ({ value: tag.key, label: tag.label })),
            ],
          },
        ]}
        sortOptions={[
          { value: "createdAt:desc", label: "Mais recentes" },
          { value: "createdAt:asc", label: "Mais antigos" },
          { value: "name:asc", label: "Colaborador (A-Z)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={items.length}
      />
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum documento anexado"
          description="Anexe arquivos no perfil do colaborador."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <p className="font-medium">{document.title}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{document.fileName}</p>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/colaboradores/${document.employeeId}`}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {document.employeeName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TagBadge tag={getDocumentTypeTag(document.documentType)} />
                  </TableCell>
                  <TableCell>{formatDate(document.createdAt.slice(0, 10))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/api/documents/${document.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-xs font-medium hover:bg-[var(--color-muted)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Link>
                      {canWrite ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--color-danger)]"
                          onClick={() => setDeleteId(document.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <FormDialog
        open={uploadOpen}
        title="Anexar documento"
        onClose={() => !pending && setUploadOpen(false)}
        pending={pending}
        footer={
          <FormDialogFooter
            formId="doc-upload-form"
            onCancel={() => setUploadOpen(false)}
            pending={pending}
            submitLabel="Enviar"
          />
        }
      >
        <form id="doc-upload-form" action={action} className="space-y-3" encType="multipart/form-data">
          <Field label="Colaborador">
            <select name="employeeId" required className={fieldClass} defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Título">
            <input name="title" required className={fieldClass} />
          </Field>
          <Field label="Tipo">
            <select name="documentType" defaultValue="outros" className={fieldClass}>
              {DOCUMENT_TYPE_TAGS.map((tag) => (
                <option key={tag.key} value={tag.key}>
                  {tag.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Arquivo">
            <input name="file" type="file" required className="block w-full text-sm" />
          </Field>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir documento?"
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            await deleteEmployeeDocumentAction(fd);
            setDeleteId(null);
          });
        }}
      />
    </div>
  );
}
