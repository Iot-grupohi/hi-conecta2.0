import { ModulePlaceholder } from "@/components/hr/module-placeholder";
import { buildDashboardStats } from "@/lib/hr";
import { getHrData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const stats = buildDashboardStats(await getHrData());

  return (
    <div className="space-y-6">
      <ModulePlaceholder
        title="Relatórios e indicadores"
        description="Indicadores base já disponíveis no dashboard. Próxima etapa: exportações e filtros avançados."
        items={[
          "Headcount por setor",
          "Turnover mensal",
          "Férias a vencer",
          "ASO pendente",
          "Custo de benefícios",
        ]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.activeEmployees}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admitidos no mês</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.hiredThisMonth}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desligados no mês</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.terminatedThisMonth}</CardContent>
        </Card>
      </div>
    </div>
  );
}
