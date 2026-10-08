import { BenefitsView } from "@/features/benefits/benefits-view";
import { getHrData } from "@/lib/data";

export default async function BenefitsPage() {
  const data = await getHrData();
  return <BenefitsView employees={data.employees} />;
}
