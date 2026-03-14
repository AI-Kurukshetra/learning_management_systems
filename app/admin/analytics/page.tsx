import { AppShell } from "@/components/AppShell";
import { getAllUsers, getAssignments, getCourses, getEnrollments } from "@/lib/dbActions";
import { getAttendanceReport } from "@/lib/attendance-actions";
import { getCalendarEvents } from "@/lib/calendar-actions";
import { getCourseFiles } from "@/lib/file-actions";
import { getQuizzes } from "@/lib/quiz-actions";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const { viewer, users } = await getAllUsers();
  const [courses, assignments, enrollments, attendance, events, quizzes, files] = await Promise.all([
    getCourses(viewer),
    getAssignments({ viewer }),
    getEnrollments(),
    getAttendanceReport(),
    getCalendarEvents(),
    getQuizzes(),
    getCourseFiles(),
  ]);

  return (
    <AppShell title="Analytics Overview" description="Cross-module insight into courses, attendance, scheduling, quizzes, and shared resources." viewer={viewer}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Teachers", value: users.filter((user) => user.role === "teacher").length },
          { label: "Students", value: users.filter((user) => user.role === "student").length },
          { label: "Courses", value: courses.length },
          { label: "Enrollments", value: enrollments.length },
          { label: "Assignments", value: assignments.length },
          { label: "Calendar events", value: events.length },
          { label: "Quizzes", value: quizzes.length },
          { label: "Files", value: files.length },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Attendance coverage</h2>
          <div className="mt-5 space-y-3">
            {attendance.map((item) => (
              <div key={item.courseId} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="font-medium text-white">{item.courseTitle}</p>
                <p className="mt-2 text-sm text-slate-400">Present {item.present} · Absent {item.absent} · Late {item.late}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Upcoming schedule</h2>
          <div className="mt-5 space-y-3">
            {events.slice(0, 6).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="font-medium text-white">{event.title}</p>
                <p className="mt-1 text-sm text-slate-400">{event.courseTitle} · {event.eventType}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}