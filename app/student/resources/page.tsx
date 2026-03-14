import { AppShell } from "@/components/AppShell";
import { FileList } from "@/components/FileList";
import { FileUploader } from "@/components/FileUploader";
import { getAssignments, getCourses, getCurrentViewer } from "@/lib/dbActions";
import { getCourseFiles, uploadFile } from "@/lib/file-actions";

export const dynamic = "force-dynamic";

export default async function StudentResourcesPage() {
  const viewer = await getCurrentViewer();
  const [courses, assignments, files] = await Promise.all([
    getCourses(viewer),
    getAssignments({ viewer }),
    getCourseFiles(),
  ]);

  return (
    <AppShell title="Resources" description="Download course resources and upload supporting files for your work." viewer={viewer}>
      <div className="space-y-6">
        <FileUploader courses={courses} assignments={assignments} categories={["submission"]} defaultCategory="submission" uploadAction={uploadFile} />
        <FileList files={files} />
      </div>
    </AppShell>
  );
}