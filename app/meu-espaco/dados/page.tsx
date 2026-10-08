import { EmptyState } from "@/components/ui/empty-state";
import { requireMyEmployee } from "@/features/me/require-my-employee";
import { MeusDadosSection } from "@/features/me/meu-espaco-sections";

export default async function MeuEspacoDadosPage() {
  const { employee } = await requireMyEmployee();
  if (!employee) {
    return (
      <EmptyState
        title="Conta sem vínculo de colaborador"
        description="Fale com o RH para liberar o Meu espaço."
      />
    );
  }
  return <MeusDadosSection employee={employee} />;
}
