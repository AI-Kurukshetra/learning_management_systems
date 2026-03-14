export type UserRole = "admin" | "teacher" | "student";
export type CourseModuleType = "lesson" | "video" | "assignment" | "quiz" | "resource";
export type CurriculumTag = "Math" | "Science" | "History" | "Programming" | "Language";
export type CalendarEventType = "assignment" | "event" | "exam";
export type AttendanceStatus = "present" | "absent" | "late";
export type QuizQuestionType = "multiple_choice" | "short_answer" | "true_false";
export type NotificationType = "assignment_created" | "assignment_graded" | "new_message" | "course_enrollment";
export type FileCategory = "resource" | "assignment_attachment" | "submission";

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
  moduleCount?: number;
}

export interface CourseModuleTaskItem {
  id: string;
  moduleId: string;
  title: string;
  dueDate: string | null;
  isCompleted: boolean;
  position: number;
  createdAt: string;
}

export interface CourseModuleItem {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  curriculumTag: CurriculumTag | null;
  moduleType: CourseModuleType;
  position: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: CourseModuleTaskItem[];
}

export interface CourseStudentGradeItem {
  id: string;
  courseId: string;
  studentId: string;
  grade: number | null;
  comments: string | null;
  updatedAt: string;
}

export interface CourseForumMessageItem {
  id: string;
  courseId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
}

export interface CalendarEventItem {
  id: string;
  courseId: string;
  courseTitle: string;
  eventType: CalendarEventType;
  title: string;
  description: string;
  scheduledAt: string;
  createdById: string | null;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageThreadItem {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AttendanceRecordItem {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  sessionDate: string;
  status: AttendanceStatus;
  markedById: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AttendanceSummaryItem {
  courseId: string;
  courseTitle: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface QuizQuestionItem {
  id: string;
  quizId: string;
  questionType: QuizQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  position: number;
}

export interface QuizSubmissionItem {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string>;
  score: number;
  submittedAt: string;
}

export interface QuizItem {
  id: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  title: string;
  description: string;
  dueAt: string | null;
  createdAt: string;
  questionCount: number;
  questions: QuizQuestionItem[];
  submission: QuizSubmissionItem | null;
}

export interface FileItem {
  id: string;
  courseId: string | null;
  courseTitle: string;
  assignmentId: string | null;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole;
  fileName: string;
  fileUrl: string;
  fileType: string;
  category: FileCategory;
  storagePath: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  teacherCount: number;
  studentCount: number;
  courseCount: number;
  enrollmentCount: number;
  eventCount: number;
  quizCount: number;
  fileCount: number;
  attendanceCount: number;
  unreadNotificationCount: number;
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
  modules: CourseModuleItem[];
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