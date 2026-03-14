"use client";

import { useState } from "react";
import type { NotificationItem } from "@/lib/types";

interface NotificationBellProps {
  notifications: NotificationItem[];
  action: () => Promise<void>;
}

export function NotificationBell({ notifications, action }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
      >
        Notifications
        {unreadCount > 0 ? (
          <span className="ml-2 rounded-full bg-cyan-400 px-2 py-0.5 text-xs font-semibold text-slate-950">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-[360px] rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Recent notifications</p>
              <p className="text-xs text-slate-400">System alerts from your LMS workspace.</p>
            </div>
            <form action={action}>
              <button className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white">
                Mark all read
              </button>
            </form>
          </div>

          <div className="mt-4 space-y-3">
            {notifications.map((notification) => (
              <a
                key={notification.id}
                href={notification.link ?? "#"}
                className={`block rounded-2xl border px-4 py-3 ${notification.isRead ? "border-white/10 bg-white/5" : "border-cyan-400/20 bg-cyan-500/10"}`}
              >
                <p className="text-sm font-medium text-white">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-300">{notification.body || "No additional details."}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}
                </p>
              </a>
            ))}
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                No notifications yet.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}