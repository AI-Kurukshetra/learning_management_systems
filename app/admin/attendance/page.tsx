import { AppShell } from "@/components/AppShell";
import { getCurrentViewer } from "@/lib/dbActions";
import { getAttendance, getAttendanceReport } from "@/lib/attendance-actions";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  const viewer = await getCurrentViewer();
  const [{ courses, selectedCourseId, selectedDate, records }, summaries] = await Promise.all([
    getAttendance(),
    getAttendanceReport(),
  ]);

  return (
    <AppShell title="Attendance Reports" description="Monitor teacher attendance activity and course participation trends." viewer={viewer}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaries.map((item) => (
          <div key={item.courseId} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.courseTitle}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{item.total}</p>
            <p className="mt-2 text-sm text-slate-400">Present {item.present} · Absent {item.absent} · Late {item.late}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Latest recorded session</h2>
          <p className="mt-2 text-sm text-slate-400">{selectedCourseId ? `${courses.find((course) => course.id === selectedCourseId)?.title ?? "Course"} · ${selectedDate}` : "No attendance data yet."}</p>
        </div>
        <div className="mt-5 space-y-3">
          {records.map((record) => (
            <div key={record.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="font-medium text-white">{record.studentName}</p>
              <p className="mt-1 text-sm text-slate-400">{record.courseTitle} · {record.status}</p>
            </div>
          ))}
          {records.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No attendance records available.</div> : null}
        </div>
      </section>
    </AppShell>
  );
}