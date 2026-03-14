import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function LegacyAssignmentDetailPage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const viewer = await getCurrentViewer();

  if (viewer.role === "admin") {
    redirect("/admin/dashboard");
  }

  redirect(`/${viewer.role}/assignments/${params.assignmentId}`);
}
