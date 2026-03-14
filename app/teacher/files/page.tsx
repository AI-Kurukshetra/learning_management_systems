import { AppShell } from "@/components/AppShell";
import { ResourceRepository } from "@/components/ResourceRepository";
import { getAssignments, getCourses, getCurrentViewer } from "@/lib/dbActions";
import { getCourseFiles } from "@/lib/file-actions";

export const dynamic = "force-dynamic";

export default async function TeacherFilesPage() {
  const viewer = await getCurrentViewer();
  const [courses, assignments, files] = await Promise.all([
    getCourses(viewer),
    getAssignments({ viewer }),
    getCourseFiles(),
  ]);

  return (
    <AppShell title="File Uploads" description="Upload resources, attach files to assignments, and manage shared course documents." viewer={viewer}>
      <ResourceRepository files={files} courses={courses} assignments={assignments} categories={["resource", "assignment_attachment"]} defaultCategory="resource" canManage />
    </AppShell>
  );
}