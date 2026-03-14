import Link from "next/link";
import type { CourseListItem } from "@/lib/types";

interface CourseCardProps {
  course: CourseListItem;
  href?: string;
}

export function CourseCard({ course, href }: CourseCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Course</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{course.title}</h3>
          <p className="mt-2 text-sm text-slate-400">Instructor: {course.teacherName}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
          {course.assignmentCount} assignments
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-900/70 p-3 text-slate-300">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Students</p>
          <p className="mt-2 text-lg font-semibold text-white">{course.studentCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/70 p-3 text-slate-300">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Created</p>
          <p className="mt-2 text-sm font-medium text-white">
            {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
              new Date(course.createdAt),
            )}
          </p>
        </div>
      </div>
    </>
  );

  if (!href) {
    return <article className="rounded-3xl border border-white/10 bg-white/5 p-5">{content}</article>;
  }

  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/8"
    >
      {content}
    </Link>
  );
}
