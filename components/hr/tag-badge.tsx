import { Badge } from "@/components/ui/badge";
import type { TagDefinition } from "@/lib/tags";

export function TagBadge({ tag, className }: { tag: TagDefinition; className?: string }) {
  return (
    <Badge tone={tag.tone} className={className} title={tag.label}>
      {tag.label}
    </Badge>
  );
}
