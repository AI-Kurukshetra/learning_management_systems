import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authSchemaMismatchMessage, getAuthenticatedViewer, requireAuthenticatedViewer } from "@/lib/auth";
import { buildRolePath, getDashboardPath } from "@/lib/roles";
import { createServiceRoleSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import type {
  AppUser,
  AssignmentDetail,
  AssignmentListItem,
  CourseDetail,
  CourseListItem,
  EnrollmentListItem,
  SubmissionItem,
  UserRole,
  Viewer,
} from "@/lib/types";

type CourseRow = {
  id: string;
  title: string;
  teacher_id: string;
  created_at: string;
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  student_id: string;
};

type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
};

function assertValue(value: FormDataEntryValue | null, message: string) {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    throw new Error(message);
  }

  return parsed;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function revalidateProtectedApp() {
  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/enrollments");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/teacher/courses");
  revalidatePath("/teacher/assignments");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/courses");
  revalidatePath("/student/assignments");
}

function buildAiFeedback(content: string, assignmentTitle: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const depthComment =
    wordCount >= 120
      ? "You explain your reasoning with enough depth to show understanding."
      : "Add one more concrete example or explanation to strengthen the final answer.";

  return [
    `Suggested feedback for ${assignmentTitle}:`,
    depthComment,
    "Revise one section for clarity and connect your response more directly to the assignment prompt.",
  ].join(" ");
}

async function getUsersMap(ids: string[]) {
  const uniqueIds = [...new Set(ids)];

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

  return new Map((data as AppUser[]).map((user) => [user.id, user]));
}

function mapCourses(
  courseRows: CourseRow[],
  userMap: Map<string, AppUser>,
  enrollments: EnrollmentRow[],
  assignments: AssignmentRow[],
) {
  return courseRows.map<CourseListItem>((course) => {
    const teacher = userMap.get(course.teacher_id);

    return {
      id: course.id,
      title: course.title,
      teacherId: course.teacher_id,
      teacherName: teacher?.name ?? "Unknown teacher",
      teacherEmail: teacher?.email ?? "",
      createdAt: course.created_at,
      studentCount: enrollments.filter((item) => item.course_id === course.id).length,
      assignmentCount: assignments.filter((item) => item.course_id === course.id).length,
    };
  });
}

async function getAccessibleCourseRows(viewer: Viewer, courseId?: string) {
  const supabase = createServiceRoleSupabaseClient();

  if (viewer.role === "admin") {
    let query = supabase
      .from("courses")
      .select("id,title,teacher_id,created_at")
      .order("created_at", { ascending: false });

    if (courseId) {
      query = query.eq("id", courseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as CourseRow[];
  }

  if (viewer.role === "teacher") {
    let query = supabase
      .from("courses")
      .select("id,title,teacher_id,created_at")
      .eq("teacher_id", viewer.currentUser.id)
      .order("created_at", { ascending: false });

    if (courseId) {
      query = query.eq("id", courseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as CourseRow[];
  }

  let enrollmentQuery = supabase
    .from("enrollments")
    .select("id,course_id,student_id")
    .eq("student_id", viewer.currentUser.id);

  if (courseId) {
    enrollmentQuery = enrollmentQuery.eq("course_id", courseId);
  }

  const { data: enrollments, error: enrollmentError } = await enrollmentQuery;

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const courseIds = [...new Set(((enrollments ?? []) as EnrollmentRow[]).map((row) => row.course_id))];

  if (courseIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("courses")
    .select("id,title,teacher_id,created_at")
    .in("id", courseIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseRow[];
}

export async function getCurrentViewer() {
  return requireAuthenticatedViewer();
}

export async function getAllUsers() {
  const viewer = await requireAuthenticatedViewer(["admin"]);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    viewer,
    users: (data ?? []) as AppUser[],
  };
}

export async function getUsersByRole(role: Extract<UserRole, "teacher" | "student">) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .eq("role", role)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AppUser[];
}

export async function getCourses(viewer?: Viewer) {
  const activeViewer = viewer ?? (await requireAuthenticatedViewer());
  const supabase = createServiceRoleSupabaseClient();
  const courseRows = await getAccessibleCourseRows(activeViewer);
  const courseIds = courseRows.map((course) => course.id);
  const teacherIds = [...new Set(courseRows.map((course) => course.teacher_id))];

  const [teacherMap, enrollmentResult, assignmentResult] = await Promise.all([
    getUsersMap(teacherIds),
    courseIds.length > 0
      ? supabase
          .from("enrollments")
          .select("id,course_id,student_id")
          .in("course_id", courseIds)
      : Promise.resolve({ data: [], error: null }),
    courseIds.length > 0
      ? supabase
          .from("assignments")
          .select("id,course_id,title,description,due_date,created_at")
          .in("course_id", courseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (enrollmentResult.error) {
    throw new Error(enrollmentResult.error.message);
  }

  if (assignmentResult.error) {
    throw new Error(assignmentResult.error.message);
  }

  return mapCourses(
    courseRows,
    teacherMap,
    (enrollmentResult.data ?? []) as EnrollmentRow[],
    (assignmentResult.data ?? []) as AssignmentRow[],
  );
}

export async function getCourseById(courseId: string, viewer?: Viewer): Promise<CourseDetail | null> {
  const activeViewer = viewer ?? (await requireAuthenticatedViewer());
  const supabase = createServiceRoleSupabaseClient();
  const courseRows = await getAccessibleCourseRows(activeViewer, courseId);

  if (courseRows.length === 0) {
    return null;
  }

  const [enrollmentResult, assignmentResult, teacherMap] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id,course_id,student_id")
      .eq("course_id", courseId),
    supabase
      .from("assignments")
      .select("id,course_id,title,description,due_date,created_at")
      .eq("course_id", courseId)
      .order("due_date", { ascending: true }),
    getUsersMap([courseRows[0].teacher_id]),
  ]);

  if (enrollmentResult.error) {
    throw new Error(enrollmentResult.error.message);
  }

  if (assignmentResult.error) {
    throw new Error(assignmentResult.error.message);
  }

  const enrollments = (enrollmentResult.data ?? []) as EnrollmentRow[];
  const studentIds = [...new Set(enrollments.map((row) => row.student_id))];
  const studentMap = await getUsersMap(studentIds);
  const assignmentRows = (assignmentResult.data ?? []) as AssignmentRow[];
  const assignmentIds = assignmentRows.map((assignment) => assignment.id);

  const submissionResult =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("id,assignment_id,student_id,content,grade,feedback,submitted_at")
          .in("assignment_id", assignmentIds)
      : { data: [], error: null };

  if (submissionResult.error) {
    throw new Error(submissionResult.error.message);
  }

  const submissions = (submissionResult.data ?? []) as SubmissionRow[];
  const course = mapCourses(courseRows, teacherMap, enrollments, assignmentRows)[0];

  const assignments = assignmentRows.map<AssignmentListItem>((assignment) => {
    const relatedSubmissions = submissions.filter((item) => item.assignment_id === assignment.id);
    const viewerSubmission =
      activeViewer.role === "student"
        ? relatedSubmissions.find((item) => item.student_id === activeViewer.currentUser.id) ?? null
        : undefined;

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date,
      createdAt: assignment.created_at,
      courseId: assignment.course_id,
      courseTitle: course.title,
      submissionCount: relatedSubmissions.length,
      gradedCount: relatedSubmissions.filter((item) => item.grade !== null).length,
      studentSubmission: viewerSubmission
        ? {
            id: viewerSubmission.id,
            assignmentId: viewerSubmission.assignment_id,
            studentId: viewerSubmission.student_id,
            studentName: studentMap.get(viewerSubmission.student_id)?.name ?? "You",
            studentEmail: studentMap.get(viewerSubmission.student_id)?.email ?? "",
            content: viewerSubmission.content,
            grade: viewerSubmission.grade,
            feedback: viewerSubmission.feedback,
            submittedAt: viewerSubmission.submitted_at,
          }
        : viewerSubmission,
    };
  });

  return {
    course,
    students: studentIds
      .map((id) => studentMap.get(id))
      .filter((student): student is AppUser => Boolean(student))
      .sort((left, right) => left.name.localeCompare(right.name)),
    assignments,
  };
}

export async function getAssignments({
  viewer,
  courseId,
}: {
  viewer?: Viewer;
  courseId?: string;
} = {}) {
  const activeViewer = viewer ?? (await requireAuthenticatedViewer());
  const supabase = createServiceRoleSupabaseClient();
  const courseRows = await getAccessibleCourseRows(activeViewer, courseId);
  const courseIds = courseRows.map((course) => course.id);

  if (courseIds.length === 0) {
    return [];
  }

  const { data: assignmentRows, error } = await supabase
    .from("assignments")
    .select("id,course_id,title,description,due_date,created_at")
    .in("course_id", courseIds)
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const assignments = (assignmentRows ?? []) as AssignmentRow[];
  const assignmentIds = assignments.map((assignment) => assignment.id);

  const submissionResult =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("id,assignment_id,student_id,content,grade,feedback,submitted_at")
          .in("assignment_id", assignmentIds)
      : { data: [], error: null };

  if (submissionResult.error) {
    throw new Error(submissionResult.error.message);
  }

  const submissions = (submissionResult.data ?? []) as SubmissionRow[];
  const courseMap = new Map(courseRows.map((course) => [course.id, course]));
  const userMap = await getUsersMap([
    ...new Set(submissions.map((submission) => submission.student_id)),
  ]);

  return assignments.map<AssignmentListItem>((assignment) => {
    const relatedSubmissions = submissions.filter((item) => item.assignment_id === assignment.id);
    const viewerSubmission =
      activeViewer.role === "student"
        ? relatedSubmissions.find((item) => item.student_id === activeViewer.currentUser.id) ?? null
        : undefined;

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date,
      createdAt: assignment.created_at,
      courseId: assignment.course_id,
      courseTitle: courseMap.get(assignment.course_id)?.title ?? "Unknown course",
      submissionCount: relatedSubmissions.length,
      gradedCount: relatedSubmissions.filter((item) => item.grade !== null).length,
      studentSubmission: viewerSubmission
        ? {
            id: viewerSubmission.id,
            assignmentId: viewerSubmission.assignment_id,
            studentId: viewerSubmission.student_id,
            studentName: userMap.get(viewerSubmission.student_id)?.name ?? "You",
            studentEmail: userMap.get(viewerSubmission.student_id)?.email ?? "",
            content: viewerSubmission.content,
            grade: viewerSubmission.grade,
            feedback: viewerSubmission.feedback,
            submittedAt: viewerSubmission.submitted_at,
          }
        : viewerSubmission,
    };
  });
}

export async function getSubmissions(assignmentId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id,assignment_id,student_id,content,grade,feedback,submitted_at")
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SubmissionRow[];
  const studentMap = await getUsersMap([...new Set(rows.map((row) => row.student_id))]);

  return rows.map<SubmissionItem>((submission) => ({
    id: submission.id,
    assignmentId: submission.assignment_id,
    studentId: submission.student_id,
    studentName: studentMap.get(submission.student_id)?.name ?? "Unknown student",
    studentEmail: studentMap.get(submission.student_id)?.email ?? "",
    content: submission.content,
    grade: submission.grade,
    feedback: submission.feedback,
    submittedAt: submission.submitted_at,
  }));
}

export async function getAssignmentById(
  assignmentId: string,
  viewer?: Viewer,
): Promise<AssignmentDetail | null> {
  const activeViewer = viewer ?? (await requireAuthenticatedViewer());
  const supabase = createServiceRoleSupabaseClient();
  const { data: assignmentData, error } = await supabase
    .from("assignments")
    .select("id,course_id,title,description,due_date,created_at")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!assignmentData) {
    return null;
  }

  const assignment = assignmentData as AssignmentRow;
  const courseDetail = await getCourseById(assignment.course_id, activeViewer);

  if (!courseDetail) {
    return null;
  }

  const submissions = await getSubmissions(assignmentId);
  const studentSubmission =
    activeViewer.role === "student"
      ? submissions.find((submission) => submission.studentId === activeViewer.currentUser.id) ?? null
      : null;
  const isStudentEnrolled =
    activeViewer.role === "student"
      ? courseDetail.students.some((student) => student.id === activeViewer.currentUser.id)
      : false;

  return {
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date,
      createdAt: assignment.created_at,
      courseId: assignment.course_id,
      courseTitle: courseDetail.course.title,
      submissionCount: submissions.length,
      gradedCount: submissions.filter((submission) => submission.grade !== null).length,
      studentSubmission,
    },
    course: courseDetail.course,
    submissions,
    studentSubmission,
    isStudentEnrolled,
  };
}

export async function getEnrollments() {
  await requireAuthenticatedViewer(["admin"]);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id,course_id,student_id");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as EnrollmentRow[];
  const [courseResult, studentMap] = await Promise.all([
    rows.length > 0
      ? supabase
          .from("courses")
          .select("id,title,teacher_id,created_at")
          .in(
            "id",
            [...new Set(rows.map((row) => row.course_id))],
          )
      : Promise.resolve({ data: [], error: null }),
    getUsersMap([...new Set(rows.map((row) => row.student_id))]),
  ]);

  if (courseResult.error) {
    throw new Error(courseResult.error.message);
  }

  const courses = (courseResult.data ?? []) as CourseRow[];
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const teacherMap = await getUsersMap([...new Set(courses.map((course) => course.teacher_id))]);

  return rows.map<EnrollmentListItem>((enrollment) => {
    const course = courseMap.get(enrollment.course_id);
    const teacher = course ? teacherMap.get(course.teacher_id) : null;

    return {
      id: enrollment.id,
      courseId: enrollment.course_id,
      courseTitle: course?.title ?? "Unknown course",
      teacherId: course?.teacher_id ?? "",
      teacherName: teacher?.name ?? "Unknown teacher",
      teacherEmail: teacher?.email ?? "",
      studentId: enrollment.student_id,
      studentName: studentMap.get(enrollment.student_id)?.name ?? "Unknown student",
      studentEmail: studentMap.get(enrollment.student_id)?.email ?? "",
    };
  });
}

export async function login(formData: FormData) {
  "use server";

  const email = normalizeEmail(assertValue(formData.get("email"), "Email is required."));
  const password = assertValue(formData.get("password"), "Password is required.");
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const viewer = await getAuthenticatedViewer();

  if (!viewer) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent("Invalid email or password combination.")}&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const targetPath =
    redirectTo && redirectTo.startsWith(`/${viewer.role}/`) ? redirectTo : getDashboardPath(viewer.role);

  redirect(targetPath);
}

export async function logout() {
  "use server";

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect("/login");
}

export async function createManagedUser(
  _state: { success: boolean; error: string | null; message: string | null },
  formData: FormData,
) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);

  try {
    const name = assertValue(formData.get("name"), "Name is required.");
    const email = normalizeEmail(assertValue(formData.get("email"), "Email is required."));
    const password = assertValue(formData.get("password"), "Password is required.");
    const role = assertValue(formData.get("role"), "Role is required.");

    if (role !== "teacher" && role !== "student") {
      return {
        success: false,
        error: "Admin can only create teacher or student users from this form.",
        message: null,
      };
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfileError) {
      throw new Error(existingProfileError.message);
    }

    if (existingProfile) {
      return {
        success: false,
        error: "Email already exists.",
        message: null,
      };
    }

    const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (authError) {
      const duplicateEmail = authError.message.toLowerCase().includes("already") || authError.message.toLowerCase().includes("registered");

      return {
        success: false,
        error: duplicateEmail ? "Email already exists." : authError.message,
        message: null,
      };
    }

    const authUserId = authResult.user?.id;

    if (!authUserId) {
      return {
        success: false,
        error: "Supabase did not return a user id.",
        message: null,
      };
    }

    const { error: profileError } = await supabase.from("users").insert({
      auth_user_id: authUserId,
      email,
      name,
      role,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authUserId);

      const duplicateEmail = profileError.message.toLowerCase().includes("duplicate") || profileError.message.toLowerCase().includes("unique");

      return {
        success: false,
        error: duplicateEmail ? "Email already exists." : profileError.message,
        message: null,
      };
    }

    revalidateProtectedApp();

    return {
      success: true,
      error: null,
      message: `${role === "teacher" ? "Teacher" : "Student"} created successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
      message: null,
    };
  }
}

export async function updateManagedUser(formData: FormData) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);
  const userId = assertValue(formData.get("userId"), "User is required.");
  const name = assertValue(formData.get("name"), "Name is required.");
  const role = assertValue(formData.get("role"), "Role is required.");
  const redirectPath = String(formData.get("redirectPath") ?? "/admin/teachers");

  if (role !== "teacher" && role !== "student" && role !== "admin") {
    throw new Error("Invalid role.");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({
      name,
      role,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function deleteManagedUser(formData: FormData) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);
  const userId = assertValue(formData.get("userId"), "User is required.");
  const redirectPath = String(formData.get("redirectPath") ?? "/admin/teachers");
  const supabase = createServiceRoleSupabaseClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("auth_user_id")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  const { error: deleteProfileError } = await supabase.from("users").delete().eq("id", userId);

  if (deleteProfileError) {
    throw new Error(deleteProfileError.message);
  }

  if (user?.auth_user_id) {
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.auth_user_id);

    if (deleteAuthError) {
      throw new Error(deleteAuthError.message);
    }
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function createCourse(formData: FormData) {
  "use server";

  const viewer = await requireAuthenticatedViewer(["admin"]);
  const title = assertValue(formData.get("title"), "Course title is required.");
  const teacherId = assertValue(formData.get("teacherId"), "Teacher is required.");
  const redirectPath = assertValue(formData.get("redirectPath"), "Redirect path is required.");
  const supabase = createServiceRoleSupabaseClient();

  const { error } = await supabase.from("courses").insert({
    title,
    teacher_id: teacherId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath.startsWith("/admin") ? redirectPath : buildRolePath(viewer.role, "/courses"));
}

export async function updateCourse(formData: FormData) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);
  const courseId = assertValue(formData.get("courseId"), "Course is required.");
  const title = assertValue(formData.get("title"), "Course title is required.");
  const teacherId = assertValue(formData.get("teacherId"), "Teacher is required.");
  const redirectPath = String(formData.get("redirectPath") ?? "/admin/courses");
  const supabase = createServiceRoleSupabaseClient();

  const { error } = await supabase
    .from("courses")
    .update({
      title,
      teacher_id: teacherId,
    })
    .eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function deleteCourse(formData: FormData) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);
  const courseId = assertValue(formData.get("courseId"), "Course is required.");
  const redirectPath = String(formData.get("redirectPath") ?? "/admin/courses");
  const supabase = createServiceRoleSupabaseClient();

  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function assignCourseEnrollments(formData: FormData) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);
  const courseId = assertValue(formData.get("courseId"), "Course is required.");
  const teacherId = assertValue(formData.get("teacherId"), "Teacher is required.");
  const redirectPath = String(formData.get("redirectPath") ?? "/admin/enrollments");
  const studentIds = formData
    .getAll("studentIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const supabase = createServiceRoleSupabaseClient();

  const { error: courseError } = await supabase
    .from("courses")
    .update({ teacher_id: teacherId })
    .eq("id", courseId);

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (studentIds.length > 0) {
    const { error: enrollmentError } = await supabase.from("enrollments").upsert(
      studentIds.map((studentId) => ({
        course_id: courseId,
        student_id: studentId,
      })),
      {
        onConflict: "course_id,student_id",
      },
    );

    if (enrollmentError) {
      throw new Error(enrollmentError.message);
    }
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function deleteEnrollment(formData: FormData) {
  "use server";

  await requireAuthenticatedViewer(["admin"]);
  const enrollmentId = assertValue(formData.get("enrollmentId"), "Enrollment is required.");
  const redirectPath = String(formData.get("redirectPath") ?? "/admin/enrollments");
  const supabase = createServiceRoleSupabaseClient();

  const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function enrollStudent(formData: FormData) {
  "use server";

  const viewer = await requireAuthenticatedViewer(["admin", "teacher"]);
  const courseId = assertValue(formData.get("courseId"), "Course is required.");
  const studentId = assertValue(formData.get("studentId"), "Student is required.");
  const redirectPath = assertValue(formData.get("redirectPath"), "Redirect path is required.");
  const supabase = createServiceRoleSupabaseClient();

  if (viewer.role === "teacher") {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,teacher_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) {
      throw new Error(courseError.message);
    }

    if (!course || course.teacher_id !== viewer.currentUser.id) {
      throw new Error("You can only enroll students into your own courses.");
    }
  }

  const { error } = await supabase.from("enrollments").upsert(
    {
      course_id: courseId,
      student_id: studentId,
    },
    {
      onConflict: "course_id,student_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function createAssignment(formData: FormData) {
  "use server";

  const viewer = await requireAuthenticatedViewer(["teacher"]);
  const courseId = assertValue(formData.get("courseId"), "Course is required.");
  const title = assertValue(formData.get("title"), "Assignment title is required.");
  const description = assertValue(
    formData.get("description"),
    "Assignment description is required.",
  );
  const dueDateInput = assertValue(formData.get("dueDate"), "Due date is required.");
  const redirectPath = assertValue(formData.get("redirectPath"), "Redirect path is required.");
  const dueDate = new Date(dueDateInput);
  const supabase = createServiceRoleSupabaseClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id,teacher_id")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (!course || course.teacher_id !== viewer.currentUser.id) {
    throw new Error("You can only create assignments for your own courses.");
  }

  const { error } = await supabase.from("assignments").insert({
    course_id: courseId,
    title,
    description,
    due_date: dueDate.toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function submitAssignment(formData: FormData) {
  "use server";

  const viewer = await requireAuthenticatedViewer(["student"]);
  const assignmentId = assertValue(formData.get("assignmentId"), "Assignment is required.");
  const content = assertValue(formData.get("content"), "Submission content is required.");
  const redirectPath = assertValue(formData.get("redirectPath"), "Redirect path is required.");
  const supabase = createServiceRoleSupabaseClient();

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,course_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", assignment.course_id)
    .eq("student_id", viewer.currentUser.id)
    .maybeSingle();

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  if (!enrollment) {
    throw new Error("You are not enrolled in this course.");
  }

  const { error } = await supabase.from("submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: viewer.currentUser.id,
      content,
      grade: null,
      feedback: null,
      submitted_at: new Date().toISOString(),
    },
    {
      onConflict: "assignment_id,student_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function gradeSubmission(formData: FormData) {
  "use server";

  const viewer = await requireAuthenticatedViewer(["teacher"]);
  const submissionId = assertValue(formData.get("submissionId"), "Submission is required.");
  const assignmentId = assertValue(formData.get("assignmentId"), "Assignment is required.");
  const gradeValue = assertValue(formData.get("grade"), "Grade is required.");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  const redirectPath = assertValue(formData.get("redirectPath"), "Redirect path is required.");
  const supabase = createServiceRoleSupabaseClient();

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,course_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id,teacher_id")
    .eq("id", assignment.course_id)
    .maybeSingle();

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (!course || course.teacher_id !== viewer.currentUser.id) {
    throw new Error("You can only grade submissions in your own courses.");
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      grade: Number(gradeValue),
      feedback,
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}

export async function generateAiFeedback(formData: FormData) {
  "use server";

  const viewer = await requireAuthenticatedViewer(["teacher"]);
  const submissionId = assertValue(formData.get("submissionId"), "Submission is required.");
  const assignmentId = assertValue(formData.get("assignmentId"), "Assignment is required.");
  const assignmentTitle = assertValue(
    formData.get("assignmentTitle"),
    "Assignment title is required.",
  );
  const content = assertValue(formData.get("content"), "Submission content is required.");
  const redirectPath = assertValue(formData.get("redirectPath"), "Redirect path is required.");
  const supabase = createServiceRoleSupabaseClient();

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id,course_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id,teacher_id")
    .eq("id", assignment.course_id)
    .maybeSingle();

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (!course || course.teacher_id !== viewer.currentUser.id) {
    throw new Error("You can only grade submissions in your own courses.");
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      feedback: buildAiFeedback(content, assignmentTitle),
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateProtectedApp();
  redirect(redirectPath);
}






