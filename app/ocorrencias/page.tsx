import { ModulePlaceholder } from "@/components/hr/module-placeholder";

export default function OccurrencesPage() {
  return (
    <ModulePlaceholder
      title="Ocorrências e advertências"
      description="Não constava nas planilhas atuais. Estrutura prevista para registros disciplinares e históricos."
      items={["Advertência", "Suspensão", "Elogio", "Ocorrência operacional"]}
    />
  );
}
