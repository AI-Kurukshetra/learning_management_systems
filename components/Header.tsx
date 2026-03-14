import type { ReactNode } from "react";
import { logout } from "@/lib/dbActions";
import { getNotifications, markAllNotificationsRead } from "@/lib/notification-actions";
import type { Viewer } from "@/lib/types";
import { NotificationBell } from "@/components/NotificationBell";

interface HeaderProps {
  title: string;
  description: string;
  viewer: Viewer;
  actions?: ReactNode;
}

export async function Header({ title, description, viewer, actions }: HeaderProps) {
  const notifications = await getNotifications();

  return (
    <header className="border-b border-white/10 bg-slate-950/50 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">EduFlow</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 capitalize text-cyan-200">
              {viewer.role}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
              {viewer.currentUser.email}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <NotificationBell notifications={notifications} action={markAllNotificationsRead} />
          {actions}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-sm font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-400/25">
              {viewer.currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{viewer.currentUser.name}</p>
              <p className="text-xs capitalize text-slate-400">{viewer.role} workspace</p>
            </div>
            <form action={logout}>
              <button className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}