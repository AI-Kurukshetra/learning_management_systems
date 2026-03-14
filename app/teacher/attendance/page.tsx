import { AppShell } from "@/components/AppShell";
import { AttendanceTable } from "@/components/AttendanceTable";
import { getCurrentViewer } from "@/lib/dbActions";
import { getAttendance, markAttendance } from "@/lib/attendance-actions";

export const dynamic = "force-dynamic";

export default async function TeacherAttendancePage({ searchParams }: { searchParams: { courseId?: string; date?: string } }) {
  const viewer = await getCurrentViewer();
  const attendance = await getAttendance({ courseId: searchParams.courseId, sessionDate: searchParams.date });

  return (
    <AppShell title="Attendance Management" description="Mark attendance for each class session and review the current register." viewer={viewer}>
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {attendance.summaries.map((item) => (
          <div key={item.courseId} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.courseTitle}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{item.total}</p>
            <p className="mt-2 text-sm text-slate-400">Present {item.present} · Absent {item.absent} · Late {item.late}</p>
          </div>
        ))}
      </section>
      {attendance.selectedCourseId ? <AttendanceTable courseId={attendance.selectedCourseId} sessionDate={attendance.selectedDate} students={attendance.students} records={attendance.records} editable markAttendanceAction={markAttendance} /> : null}
    </AppShell>
  );
}