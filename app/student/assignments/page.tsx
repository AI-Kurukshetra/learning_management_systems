import { redirect } from "next/navigation";

export default async function StudentAssignmentsPage() {
  redirect("/student/courses");
}
