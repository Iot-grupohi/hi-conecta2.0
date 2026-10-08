import { EmptyState } from "@/components/ui/empty-state";
import { requireMyEmployee } from "@/features/me/require-my-employee";
import { MeusDocumentosSection } from "@/features/me/meu-espaco-sections";

export default async function MeuEspacoDocumentosPage() {
  const { history } = await requireMyEmployee();
  if (!history) {
    return (
      <EmptyState
        title="Conta sem vínculo de colaborador"
        description="Fale com o RH para liberar o Meu espaço."
      />
    );
  }
  return <MeusDocumentosSection history={history} />;
}
