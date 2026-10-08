import { EmptyState } from "@/components/ui/empty-state";
import { requireMyEmployee } from "@/features/me/require-my-employee";
import { MeuEspacoHome } from "@/features/me/meu-espaco-sections";

export default async function MeuEspacoPage() {
  const { employee, history } = await requireMyEmployee();

  if (!employee || !history) {
    return (
      <EmptyState
        title="Conta sem vínculo de colaborador"
        description="Seu usuário ainda não está associado a um cadastro. Fale com o RH para liberar o Meu espaço."
      />
    );
  }

  return <MeuEspacoHome employee={employee} history={history} />;
}
