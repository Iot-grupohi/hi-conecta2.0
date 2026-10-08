import { ModulePlaceholder } from "@/components/hr/module-placeholder";

export default function TrainingsPage() {
  return (
    <ModulePlaceholder
      title="Treinamentos"
      description="Não havia aba dedicada nas planilhas. O módulo já está reservado para catálogo, turmas e conclusões."
      items={["Catálogo de cursos", "Turmas", "Conclusões", "Obrigatoriedade por cargo"]}
    />
  );
}
