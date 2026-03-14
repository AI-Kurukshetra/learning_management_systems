import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedViewer } from "@/lib/auth";
import { getUsersByRole } from "@/lib/dbActions";
import { addParentMessage, getMessagesForParent } from "@/lib/parent-message-store";
import {
  getAllParentLinks,
  getLinkedStudentIdForParent,
  linkParentToStudent,
  unlinkParent,
} from "@/lib/parent-links-store";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type {
  AppUser,
  ParentAssignmentItem,
  ParentAttendanceItem,
  ParentChildLinkItem,
  ParentChildOverview,
  ParentCourseItem,
  ParentGradeItem,
  ParentMessageItem,
  ParentTeacherContact,
} from "@/lib/types";

type CourseRow = {
  id: string;
  title: string;
  teacher_id: string;
  created_at: string;
};

type EnrollmentRow = {
  course_id: string;
  student_id: string;
};

type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  due_date: string;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
};

export interface ParentMessageActionState {
  success: boolean;
  error: string | null;
  message: string | null;
}

export const initialParentMessageState: ParentMessageActionState = {
  success: false,
  error: null,
  message: null,
};

function assertValue(value: FormDataEntryValue | null, message: string) {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    throw new Error(message);
  }

  return parsed;
}

async function getUserMap(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map<string, AppUser>();
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((user) => [user.id, user as AppUser]));
}

async function getParentContext() {
  const viewer = await requireAuthenticatedViewer(["parent"]);
  const linkedStudentId = await getLinkedStudentIdForParent(viewer.currentUser);
  const links = await getAllParentLinks([viewer.currentUser]);
  const link = links[0] ?? null;

  if (!linkedStudentId) {
    return {
      viewer,
      child: null,
      linkedAt: null,
    };
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .eq("id", linkedStudentId)
    .eq("role", "student")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    viewer,
    child: (data as AppUser | null) ?? null,
    linkedAt: link?.linkedAt ?? null,
  };
}

async function getChildCourseRows(childId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id,student_id")
    .eq("student_id", childId);

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
  const courseIds = [...new Set(enrollmentRows.map((row) => row.course_id))];

  if (courseIds.length === 0) {
    return [] as CourseRow[];
  }

  const { data: courses, error: courseError } = await supabase
    .from("courses")
    .select("id,title,teacher_id,created_at")
    .in("id", courseIds)
    .order("title", { ascending: true });

  if (courseError) {
    throw new Error(courseError.message);
  }

  return (courses ?? []) as CourseRow[];
}

async function getAssignmentsForCourseIds(courseIds: string[]) {
  if (courseIds.length === 0) {
    return [] as AssignmentRow[];
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("id,course_id,title,due_date,created_at")
    .in("course_id", courseIds)
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AssignmentRow[];
}

async function getSubmissionsForChild(childId: string, assignmentIds: string[]) {
  if (assignmentIds.length === 0) {
    return [] as SubmissionRow[];
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id,assignment_id,student_id,grade,feedback,submitted_at")
    .eq("student_id", childId)
    .in("assignment_id", assignmentIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SubmissionRow[];
}

async function buildParentDataset() {
  const context = await getParentContext();

  if (!context.child) {
    return {
      ...context,
      courses: [] as ParentCourseItem[],
      assignments: [] as ParentAssignmentItem[],
      grades: [] as ParentGradeItem[],
      attendance: [] as ParentAttendanceItem[],
      overview: {
        child: null,
        courseCount: 0,
        totalAssignments: 0,
        averageGrade: null,
      } as ParentChildOverview,
    };
  }

  const courseRows = await getChildCourseRows(context.child.id);
  const teacherMap = await getUserMap(courseRows.map((course) => course.teacher_id));
  const assignments = await getAssignmentsForCourseIds(courseRows.map((course) => course.id));
  const submissions = await getSubmissionsForChild(
    context.child.id,
    assignments.map((assignment) => assignment.id),
  );
  const courseMap = new Map(courseRows.map((course) => [course.id, course]));
  const submissionMap = new Map(submissions.map((submission) => [submission.assignment_id, submission]));

  const courses = courseRows.map<ParentCourseItem>((course) => ({
    id: course.id,
    title: course.title,
    teacherId: course.teacher_id,
    teacherName: teacherMap.get(course.teacher_id)?.name ?? "Unknown teacher",
    teacherEmail: teacherMap.get(course.teacher_id)?.email ?? "",
  }));

  const assignmentItems = assignments.map<ParentAssignmentItem>((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    courseName: courseMap.get(assignment.course_id)?.title ?? "Unknown course",
    dueDate: assignment.due_date,
  }));

  const gradeItems = assignments.map<ParentGradeItem>((assignment) => {
    const submission = submissionMap.get(assignment.id) ?? null;

    return {
      id: submission?.id ?? assignment.id,
      assignmentTitle: assignment.title,
      courseName: courseMap.get(assignment.course_id)?.title ?? "Unknown course",
      dueDate: assignment.due_date,
      grade: submission?.grade ?? null,
      feedback: submission?.feedback ?? null,
      submittedAt: submission?.submitted_at ?? null,
    };
  });

  const graded = gradeItems.filter((item) => item.grade !== null);
  const averageGrade =
    graded.length === 0
      ? null
      : graded.reduce((total, item) => total + (item.grade ?? 0), 0) / graded.length;

  const attendance = assignments
    .map<ParentAttendanceItem>((assignment) => {
      const submission = submissionMap.get(assignment.id) ?? null;
      const sessionDate = assignment.due_date || assignment.created_at;
      const status = !submission
        ? "absent"
        : submission.submitted_at <= sessionDate
          ? "present"
          : "late";

      return {
        id: assignment.id,
        date: sessionDate,
        course: courseMap.get(assignment.course_id)?.title ?? "Unknown course",
        status,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return {
    ...context,
    courses,
    assignments: assignmentItems,
    grades: gradeItems,
    attendance,
    overview: {
      child: context.child,
      courseCount: courses.length,
      totalAssignments: assignmentItems.length,
      averageGrade,
    } as ParentChildOverview,
  };
}

export async function getParentChild() {
  const context = await getParentContext();

  return {
    child: context.child,
    linkedAt: context.linkedAt,
  };
}

export async function getChildCourses() {
  return (await buildParentDataset()).courses;
}

export async function getChildAssignments() {
  return (await buildParentDataset()).assignments;
}

export async function getChildGrades() {
  return (await buildParentDataset()).grades;
}

export async function getChildAttendance() {
  return (await buildParentDataset()).attendance;
}

export async function getParentDashboardData() {
  const data = await buildParentDataset();

  return {
    child: data.child,
    linkedAt: data.linkedAt,
    overview: data.overview,
    courses: data.courses,
  };
}

export async function getParentTeacherContacts() {
  const data = await buildParentDataset();
  const deduped = new Map<string, ParentTeacherContact>();

  for (const course of data.courses) {
    if (!deduped.has(course.teacherId)) {
      deduped.set(course.teacherId, {
        id: course.teacherId,
        name: course.teacherName,
        email: course.teacherEmail,
      });
    }
  }

  return Array.from(deduped.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getParentMessages() {
  const { viewer } = await getParentContext();
  const records = getMessagesForParent(viewer.currentUser.id);
  const teacherMap = await getUserMap(records.map((record) => record.teacherId));

  return records.map<ParentMessageItem>((record) => ({
    id: record.id,
    parentId: record.parentId,
    teacherId: record.teacherId,
    teacherName: teacherMap.get(record.teacherId)?.name ?? "Teacher",
    teacherEmail: teacherMap.get(record.teacherId)?.email ?? "",
    content: record.content,
    timestamp: record.timestamp,
  }));
}

export async function sendParentMessage(
  _state: ParentMessageActionState,
  formData: FormData,
): Promise<ParentMessageActionState> {
  "use server";

  try {
    const { viewer, child } = await getParentContext();

    if (!child) {
      return {
        success: false,
        error: "No child is linked to this parent account yet.",
        message: null,
      };
    }

    const teacherId = assertValue(formData.get("teacherId"), "Teacher is required.");
    const content = assertValue(formData.get("content"), "Message content is required.");
    const contacts = await getParentTeacherContacts();

    if (!contacts.some((contact) => contact.id === teacherId)) {
      return {
        success: false,
        error: "That teacher is not connected to your linked child.",
        message: null,
      };
    }

    addParentMessage(viewer.currentUser.id, teacherId, content);
    revalidatePath("/parent/messages");

    return {
      success: true,
      error: null,
      message: "Message sent successfully.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
      message: null,
    };
  }
}

export async function getAdminParentManagementData() {
  await requireAuthenticatedViewer(["admin"]);
  const [parents, students, links] = await Promise.all([
    getUsersByRole("parent"),
    getUsersByRole("student"),
    getAllParentLinks(),
  ]);

  const parentMap = new Map(parents.map((parent) => [parent.id, parent]));
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const hydratedLinks = links
    .map<ParentChildLinkItem | null>((link) => {
      const parent = parentMap.get(link.parentId);
      const student = studentMap.get(link.studentId);

      if (!parent || !student) {
        return null;
      }

      return {
        parentId: parent.id,
        parentName: parent.name,
        parentEmail: parent.email,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        linkedAt: link.linkedAt,
      };
    })
    .filter((link): link is ParentChildLinkItem => Boolean(link));

  return {
    parents,
    students,
    links: hydratedLinks,
  };
}

export async function linkParentToStudentAction(formData: FormData) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);
  const redirectPath = String(formData.get("redirectPath") ?? "/admin/parents");
  const parentId = assertValue(formData.get("parentId"), "Parent is required.");
  const studentId = String(formData.get("studentId") ?? "").trim();
  const supabase = createServiceRoleSupabaseClient();

  const { data: parent, error: parentError } = await supabase
    .from("users")
    .select("id,role,auth_user_id")
    .eq("id", parentId)
    .maybeSingle();

  if (parentError) {
    throw new Error(parentError.message);
  }

  if (!parent || parent.role !== "parent") {
    throw new Error("Invalid parent selected.");
  }

  if (!studentId) {
    await unlinkParent(parent as AppUser);
  } else {
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("id,role")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError) {
      throw new Error(studentError.message);
    }

    if (!student || student.role !== "student") {
      throw new Error("Invalid student selected.");
    }

    await linkParentToStudent(parent as AppUser, studentId);
  }

  revalidatePath("/admin/parents");
  revalidatePath("/admin/students");
  revalidatePath("/parent/dashboard");
  revalidatePath("/parent/children");
  revalidatePath("/parent/courses");
  revalidatePath("/parent/grades");
  revalidatePath("/parent/attendance");
  revalidatePath("/parent/messages");
  redirect(redirectPath);
}
