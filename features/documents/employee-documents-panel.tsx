"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Download, Trash2, Upload } from "lucide-react";
import {
  deleteEmployeeDocumentAction,
  uploadEmployeeDocumentAction,
  type DocumentActionState,
} from "@/features/documents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagBadge } from "@/components/hr/tag-badge";
import { DOCUMENT_TYPE_TAGS, getDocumentTypeTag } from "@/lib/tags";
import { formatDate } from "@/lib/hr";

export type EmployeeDocumentItem = {
  id: string;
  title: string;
  documentType: string;
  fileName: string;
  fileSize: number | null;
  notes: string | null;
  uploadedBy: string | null;
  createdAt: string;
};

const initialState: DocumentActionState = {};

export function EmployeeDocumentsPanel({
  employeeId,
  documents,
  canManage,
}: {
  employeeId: string;
  documents: EmployeeDocumentItem[];
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadEmployeeDocumentAction, initialState);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Documentos anexados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage ? (
          <form action={formAction} className="grid gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 md:grid-cols-2">
            <input type="hidden" name="employeeId" value={employeeId} />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Título</span>
              <Input name="title" required placeholder="Ex.: Contrato assinado" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Tipo</span>
              <Select name="documentType" defaultValue="contrato">
                {DOCUMENT_TYPE_TAGS.map((tag) => (
                  <option key={tag.key} value={tag.key}>
                    {tag.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium">Arquivo</span>
              <Input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" />
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium">Observações</span>
              <Input name="notes" placeholder="Opcional" />
            </label>
            {state.error ? (
              <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)] md:col-span-2">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p className="rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)] md:col-span-2">
                {state.success}
              </p>
            ) : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={pending}>
                <Upload className="h-4 w-4" />
                {pending ? "Enviando..." : "Anexar documento"}
              </Button>
            </div>
          </form>
        ) : null}

        {documents.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Nenhum documento anexado para este colaborador.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{document.title}</p>
                    <TagBadge tag={getDocumentTypeTag(document.documentType)} />
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {document.fileName}
                    {document.fileSize ? ` · ${(document.fileSize / 1024).toFixed(0)} KB` : ""}
                    {" · "}
                    {formatDate(document.createdAt.slice(0, 10))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage ? (
                    <>
                      <Link
                        href={`/api/documents/${document.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs font-medium hover:bg-[var(--color-muted)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Link>
                      <form action={deleteEmployeeDocumentAction}>
                        <input type="hidden" name="id" value={document.id} />
                        <Button type="submit" variant="ghost" size="sm" aria-label="Excluir documento">
                          <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                        </Button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
