import { AppShell } from "@/components/AppShell";
import { GradesTable } from "@/components/GradesTable";
import { getCurrentViewer } from "@/lib/dbActions";
import { getChildGrades, getParentChild } from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

export default async function ParentGradesPage() {
  const [viewer, childState, grades] = await Promise.all([
    getCurrentViewer(),
    getParentChild(),
    getChildGrades(),
  ]);

  return (
    <AppShell
      title="Child Grades"
      description="Submission grades and feedback for the linked child."
      viewer={viewer}
    >
      {childState.child ? (
        <GradesTable grades={grades} />
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No child is linked to this parent account yet.
        </div>
      )}
    </AppShell>
  );
}
