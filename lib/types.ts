export type UserRole = "admin" | "teacher" | "student";

export interface AppUser {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Viewer {
  authUserId: string;
  role: UserRole;
  currentUser: AppUser;
  dashboardPath: string;
}

export interface CourseListItem {
  id: string;
  title: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  createdAt: string;
  studentCount: number;
  assignmentCount: number;
}

export interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  content: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
}

export interface AssignmentListItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  courseId: string;
  courseTitle: string;
  submissionCount: number;
  gradedCount: number;
  studentSubmission?: SubmissionItem | null;
}

export interface CourseDetail {
  course: CourseListItem;
  students: AppUser[];
  assignments: AssignmentListItem[];
}

export interface AssignmentDetail {
  assignment: AssignmentListItem;
  course: CourseListItem;
  submissions: SubmissionItem[];
  studentSubmission: SubmissionItem | null;
  isStudentEnrolled: boolean;
}

export interface EnrollmentListItem {
  id: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

