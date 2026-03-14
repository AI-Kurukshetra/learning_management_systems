import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import type { Viewer } from "@/lib/types";

interface AppShellProps {
  title: string;
  description: string;
  viewer: Viewer;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  title,
  description,
  viewer,
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <Sidebar role={viewer.role} />
        <div className="flex min-h-screen flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0f172a_50%,_#111827_100%)]">
          <Header title={title} description={description} viewer={viewer} actions={actions} />
          <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
