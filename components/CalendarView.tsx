import type { CalendarEventItem } from "@/lib/types";

export function CalendarView({ events }: { events: CalendarEventItem[] }) {
  const grouped = events.reduce<Record<string, CalendarEventItem[]>>((acc, event) => {
    const key = event.scheduledAt.slice(0, 10);
    acc[key] = [...(acc[key] ?? []), event];
    return acc;
  }, {});

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Calendar</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Upcoming schedule</h2>
      </div>

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h3 className="text-lg font-semibold text-white">
              {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`))}
            </h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {items.length} items
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {items.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{event.courseTitle}</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
                    {event.eventType}
                  </span>
                </div>
                {event.description ? <p className="mt-3 text-sm text-slate-300">{event.description}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ))}

      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
          No scheduled items yet.
        </div>
      ) : null}
    </section>
  );
}