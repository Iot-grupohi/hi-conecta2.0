"use client";

export type EmployeeOption = { id: string; name: string };

export function EmployeePicker({
  employees,
  employeeId,
  employeeName,
  onChange,
  requiredName = true,
}: {
  employees: EmployeeOption[];
  employeeId: string;
  employeeName: string;
  onChange: (next: { employeeId: string; employeeName: string }) => void;
  requiredName?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-[var(--color-muted-foreground)]">
        Colaborador
      </label>
      <select
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
        value={employeeId}
        onChange={(event) => {
          const id = event.target.value;
          const found = employees.find((item) => item.id === id);
          onChange({
            employeeId: id,
            employeeName: found?.name ?? employeeName,
          });
        }}
      >
        <option value="">Selecionar da base…</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
      <input
        name="employeeId"
        type="hidden"
        value={employeeId}
      />
      <input
        name="employeeName"
        required={requiredName}
        value={employeeName}
        onChange={(event) =>
          onChange({ employeeId, employeeName: event.target.value })
        }
        placeholder="Ou digite o nome"
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
      />
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-[var(--color-muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm";
