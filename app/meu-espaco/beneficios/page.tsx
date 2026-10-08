import { EmptyState } from "@/components/ui/empty-state";
import { requireMyEmployee } from "@/features/me/require-my-employee";
import { MeusBeneficiosSection } from "@/features/me/meu-espaco-sections";

export default async function MeuEspacoBeneficiosPage() {
  const { employee, history } = await requireMyEmployee();
  if (!employee || !history) {
    return (
      <EmptyState
        title="Conta sem vínculo de colaborador"
        description="Fale com o RH para liberar o Meu espaço."
      />
    );
  }
  return <MeusBeneficiosSection employee={employee} history={history} />;
}
