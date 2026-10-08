"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ROLE_LABELS, getPermissionsForRole, type Permission } from "@/lib/permissions";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import type { Role } from "@prisma/client";
import {
  createUserAction,
  deleteUserAction,
  updateUserAction,
  type UserActionState,
} from "@/features/users/actions";
import { Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  employeeId: string | null;
};

export function UsersBoard({
  users,
  employees,
  canManage,
}: {
  users: UserRow[];
  employees: EmployeeOption[];
  canManage: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pending] = useActionState<UserActionState, FormData>(
    async (prev, formData) =>
      formData.get("id") ? updateUserAction(prev, formData) : createUserAction(prev, formData),
    {},
  );

  useCloseOnSuccess(pending, state.success, () => {
    setFormOpen(false);
    setEditing(null);
  });

  return (
    <div>
      <PageHeader
        title="Usuários e permissões"
        description="Contas de acesso ao Hi-Conecta RH com papéis e permissões."
        actions={
          canManage ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{user.name}</CardTitle>
                <Badge tone={user.active ? "success" : "danger"}>
                  {user.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-[var(--color-muted-foreground)]">{user.email}</p>
              <p>
                <span className="font-medium">Papel:</span> {ROLE_LABELS[user.role]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {getPermissionsForRole(user.role).map((permission: Permission) => (
                  <Badge key={permission} tone="primary">
                    {permission}
                  </Badge>
                ))}
              </div>
              {canManage ? (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(user);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-danger)]"
                    onClick={() => setDeleteId(user.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <FormDialog
        open={formOpen}
        title={editing ? "Editar usuário" : "Novo usuário"}
        onClose={() => !pending && setFormOpen(false)}
        pending={pending}
        footer={
          <FormDialogFooter formId="user-form" onCancel={() => setFormOpen(false)} pending={pending} />
        }
      >
        <form id="user-form" action={action} className="space-y-3">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <Field label="Nome">
            <input name="name" required defaultValue={editing?.name ?? ""} className={fieldClass} />
          </Field>
          <Field label="E-mail">
            <input
              name="email"
              type="email"
              required
              defaultValue={editing?.email ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label={editing ? "Nova senha (opcional)" : "Senha"}>
            <input
              name="password"
              type="password"
              required={!editing}
              className={fieldClass}
              minLength={6}
            />
          </Field>
          <Field label="Papel">
            <select name="role" defaultValue={editing?.role ?? "VIEWER"} className={fieldClass}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Colaborador vinculado">
            <select
              name="employeeId"
              defaultValue={editing?.employeeId ?? ""}
              className={fieldClass}
            >
              <option value="">Nenhum</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={editing?.active ?? true} />
            Conta ativa
          </label>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir usuário?"
        description="Esta ação remove o acesso permanentemente."
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            try {
              await deleteUserAction(fd);
              setDeleteId(null);
            } catch (error) {
              alert(error instanceof Error ? error.message : "Falha ao excluir.");
              setDeleteId(null);
            }
          });
        }}
      />
    </div>
  );
}
