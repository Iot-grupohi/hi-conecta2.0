import { EmptyState } from "@/components/ui/empty-state";
import { requireMyEmployee } from "@/features/me/require-my-employee";
import { MeusAsoSection } from "@/features/me/meu-espaco-sections";

export default async function MeuEspacoAsoPage() {
  const { history } = await requireMyEmployee();
  if (!history) {
    return (
      <EmptyState
        title="Conta sem vínculo de colaborador"
        description="Fale com o RH para liberar o Meu espaço."
      />
    );
  }
  return <MeusAsoSection history={history} />;
}
