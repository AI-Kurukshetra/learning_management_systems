import { AppShell } from "@/components/AppShell";
import { AttendanceTable } from "@/components/AttendanceTable";
import { getCurrentViewer } from "@/lib/dbActions";
import { getChildAttendance, getParentChild } from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

export default async function ParentAttendancePage() {
  const [viewer, childState, attendance] = await Promise.all([
    getCurrentViewer(),
    getParentChild(),
    getChildAttendance(),
  ]);

  return (
    <AppShell
      title="Child Attendance"
      description="Mock attendance derived from assignment submission patterns for the linked child."
      viewer={viewer}
    >
      {childState.child ? (
        <AttendanceTable variant="summary" items={attendance} />
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No child is linked to this parent account yet.
        </div>
      )}
    </AppShell>
  );
}
