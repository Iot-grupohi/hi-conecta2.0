import { DepartmentsBoard } from "@/features/departments/departments-board";
import { getHrData } from "@/lib/data";
import { auth } from "@/auth";
import { canWriteHr } from "@/lib/hr-write";

export default async function DepartmentsPage() {
  const [data, session] = await Promise.all([getHrData(), auth()]);

  return (
    <DepartmentsBoard
      departments={data.departments}
      employees={data.employees}
      canWrite={canWriteHr(session?.user.permissions ?? [])}
    />
  );
}
