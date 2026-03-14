import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";
import { getCurrentViewer } from "@/lib/dbActions";
import { getCalendarEvents } from "@/lib/calendar-actions";

export const dynamic = "force-dynamic";

export default async function StudentCalendarPage() {
  const viewer = await getCurrentViewer();
  const events = await getCalendarEvents();

  return (
    <AppShell title="Calendar" description="Track assignments, events, and exams across your enrolled courses." viewer={viewer}>
      <CalendarView events={events} />
    </AppShell>
  );
}