import { auth } from "@/auth";
import { IfoodBonusBoard } from "@/features/benefits/ifood-bonus-board";
import { getHrData, getIfoodBonuses } from "@/lib/data";
import { canWriteHr } from "@/lib/hr-write";

export default async function BonificacaoIfoodPage() {
  const [data, credits, session] = await Promise.all([
    getHrData(),
    getIfoodBonuses(),
    auth(),
  ]);
  const permissions = session?.user.permissions ?? [];

  return (
    <IfoodBonusBoard
      credits={credits}
      employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}
      canWrite={canWriteHr(permissions)}
    />
  );
}
