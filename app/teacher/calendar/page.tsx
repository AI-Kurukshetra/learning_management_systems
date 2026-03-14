import { AppShell } from "@/components/AppShell";
import { CalendarComposer } from "@/components/CalendarComposer";
import { CalendarView } from "@/components/CalendarView";
import { getCourses, getCurrentViewer } from "@/lib/dbActions";
import { createCalendarEvent, getCalendarEvents } from "@/lib/calendar-actions";

export const dynamic = "force-dynamic";

export default async function TeacherCalendarPage() {
  const viewer = await getCurrentViewer();
  const [courses, events] = await Promise.all([getCourses(viewer), getCalendarEvents()]);

  return (
    <AppShell title="Course Calendar" description="Schedule assignments, events, and exams for your courses." viewer={viewer}>
      <div className="grid gap-8 xl:grid-cols-[420px,1fr]">
        <CalendarComposer courses={courses} action={createCalendarEvent} />
        <CalendarView events={events} />
      </div>
    </AppShell>
  );
}