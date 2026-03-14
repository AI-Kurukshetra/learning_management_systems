"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildRolePath } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

interface SidebarProps {
  role: UserRole;
}

function getNavItems(role: UserRole) {
  if (role === "admin") {
    return [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Teachers", href: "/admin/teachers" },
      { label: "Students", href: "/admin/students" },
      { label: "Parents", href: "/admin/parents" },
      { label: "Courses", href: "/admin/courses" },
      { label: "Enrollments", href: "/admin/enrollments" },
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Attendance", href: "/admin/attendance" },
      { label: "Messages", href: "/admin/messages" },
    ];
  }

  if (role === "teacher") {
    return [
      { label: "Dashboard", href: "/teacher/dashboard" },
      { label: "Courses", href: "/teacher/courses" },
      { label: "Calendar", href: "/teacher/calendar" },
      { label: "Attendance", href: "/teacher/attendance" },
      { label: "Quizzes", href: "/teacher/quizzes" },
      { label: "Files", href: "/teacher/files" },
      { label: "Messages", href: "/teacher/messages" },
    ];
  }

  if (role === "parent") {
    return [
      { label: "Dashboard", href: "/parent/dashboard" },
      { label: "Child", href: "/parent/children" },
      { label: "Courses", href: "/parent/courses" },
      { label: "Grades", href: "/parent/grades" },
      { label: "Attendance", href: "/parent/attendance" },
      { label: "Messages", href: "/parent/messages" },
    ];
  }

  return [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Courses", href: "/student/courses" },
    { label: "Calendar", href: "/student/calendar" },
    { label: "Quizzes", href: "/student/quizzes" },
    { label: "Resources", href: "/student/resources" },
    { label: "Messages", href: "/student/messages" },
  ];
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <aside className="border-b border-slate-800/80 bg-slate-950/95 px-4 py-4 backdrop-blur md:sticky md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r md:px-5 md:py-6">
      <div className="mb-4 flex items-center justify-between md:mb-10 md:flex-col md:items-start md:gap-4">
        <Link href={buildRolePath(role, "/dashboard")} className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-lg font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/30">E</span>
          <span>
            <span className="block text-lg font-semibold text-white">EduFlow</span>
            <span className="block text-xs uppercase tracking-[0.28em] text-slate-400">Secure LMS</span>
          </span>
        </Link>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium capitalize text-cyan-200">{role} view</span>
      </div>

      <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-w-fit rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 hidden rounded-3xl border border-white/10 bg-white/5 p-4 md:block">
        <p className="text-sm font-medium text-white">
          {role === "admin"
            ? "Administration"
            : role === "teacher"
              ? "Teaching workflow"
              : role === "parent"
                ? "Parent portal"
                : "Learning workflow"}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {role === "admin"
            ? "Monitor analytics, manage parents, teachers, students, and coordinate the wider LMS operation."
            : role === "teacher"
              ? "Schedule classes, track attendance, build quizzes, share files, and message your learners."
              : role === "parent"
                ? "Track your linked child, monitor grades, review coursework, and message teachers from one place."
                : "Follow the calendar, take quizzes, access files, and stay aligned with course communication."}
        </p>
      </div>
    </aside>
  );
}
