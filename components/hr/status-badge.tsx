import { Badge } from "@/components/ui/badge";
import { resolveEmployeeStatusTag } from "@/lib/tags";
import type { EmployeeStatus } from "@/types/hr";

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const tag = resolveEmployeeStatusTag(status);
  return (
    <Badge tone={tag.tone} title={tag.label}>
      {tag.label}
    </Badge>
  );
}
