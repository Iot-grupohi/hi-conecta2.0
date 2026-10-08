import { PositionsBoard } from "@/features/positions/positions-board";
import { getHrData } from "@/lib/data";
import { auth } from "@/auth";
import { canWriteHr } from "@/lib/hr-write";

export default async function PositionsPage() {
  const [data, session] = await Promise.all([getHrData(), auth()]);
  return (
    <PositionsBoard
      positions={data.positions}
      employees={data.employees}
      departments={data.departments}
      canWrite={canWriteHr(session?.user.permissions ?? [])}
    />
  );
}
