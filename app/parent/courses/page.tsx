import { AppShell } from "@/components/AppShell";
import { CourseTable } from "@/components/CourseTable";
import { getCurrentViewer } from "@/lib/dbActions";
import { getChildCourses, getParentChild } from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

export default async function ParentCoursesPage() {
  const [viewer, childState, courses] = await Promise.all([
    getCurrentViewer(),
    getParentChild(),
    getChildCourses(),
  ]);

  return (
    <AppShell
      title="Child Courses"
      description="Courses enrolled for the linked child, including the assigned teacher for each class."
      viewer={viewer}
    >
      {childState.child ? (
        <CourseTable courses={courses} />
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No child is linked to this parent account yet.
        </div>
      )}
    </AppShell>
  );
}
