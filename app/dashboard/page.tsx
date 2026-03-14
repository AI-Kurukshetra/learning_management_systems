import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function LegacyDashboardPage() {
  const viewer = await getCurrentViewer();

  redirect(viewer.dashboardPath);
}
