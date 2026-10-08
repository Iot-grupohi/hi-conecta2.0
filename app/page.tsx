import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getHrData } from "@/lib/data";
import { buildDashboardStats } from "@/lib/hr";

export default async function HomePage() {
  const data = await getHrData();
  const stats = buildDashboardStats(data);

  return <DashboardView stats={stats} data={data} />;
}
