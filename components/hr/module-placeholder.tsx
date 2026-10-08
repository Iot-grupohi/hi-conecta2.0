import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export function ModulePlaceholder({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items?: string[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader>
          <CardTitle>Módulo em evolução</CardTitle>
          <CardDescription>
            A estrutura já está mapeada a partir das planilhas. Esta tela será expandida na próxima
            etapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items && items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <Badge key={item} tone="primary">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Conteúdo em preparação"
              description="Os dados seed já estão disponíveis para conectar este módulo."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
