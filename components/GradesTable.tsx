import { formatDateDdMmYyyy } from "@/lib/date-format";
import type { ParentGradeItem } from "@/lib/types";

interface GradesTableProps {
  grades: ParentGradeItem[];
}

export function GradesTable({ grades }: GradesTableProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Grades</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Submission performance</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {grades.length} records
        </span>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-950/70 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Assignment</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-900/50">
            {grades.map((grade) => (
              <tr key={grade.id}>
                <td className="px-4 py-4 text-white">{grade.assignmentTitle}</td>
                <td className="px-4 py-4 text-slate-300">{grade.courseName}</td>
                <td className="px-4 py-4 text-slate-300">{formatDateDdMmYyyy(grade.dueDate)}</td>
                <td className="px-4 py-4 text-white">{grade.grade === null ? "Pending" : `${grade.grade}%`}</td>
                <td className="px-4 py-4 text-slate-300">{grade.feedback || "No feedback yet."}</td>
              </tr>
            ))}
            {grades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-slate-400">
                  No grade records are available yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
