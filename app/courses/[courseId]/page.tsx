import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function LegacyCourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const viewer = await getCurrentViewer();

  if (viewer.role === "admin") {
    redirect("/admin/courses");
  }

  redirect(`/${viewer.role}/courses/${params.courseId}`);
}
