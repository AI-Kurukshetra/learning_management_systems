import { redirect } from "next/navigation";

export default async function TeacherAssignmentsPage() {
  redirect("/teacher/courses");
}
