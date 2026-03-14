import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function LegacyGradebookPage() {
  const viewer = await getCurrentViewer();

  redirect(viewer.dashboardPath);
}
