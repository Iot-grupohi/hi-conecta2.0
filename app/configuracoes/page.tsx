import { ModulePlaceholder } from "@/components/hr/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Configurações"
      description="Parâmetros de empresa, escalas, tipos de rescisão, status e design tokens do sistema."
      items={["Empresa", "Escalas", "Tipos de contrato", "Tipos de rescisão", "Tema"]}
    />
  );
}
