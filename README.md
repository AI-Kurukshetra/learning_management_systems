# EduFlow

EduFlow is a role-based Learning Management System built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Supabase. The project now includes admin, teacher, and student workspaces with course management, lesson delivery, discussions, scheduling, messaging, attendance, quizzes, notifications, and file sharing.

## Core stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Server Actions

## Implemented modules

### Admin
- Dashboard
- Teachers management
- Students management
- Courses management
- Course builder with templates and module ordering
- Enrollments management
- Analytics overview
- Attendance reports
- Internal messaging

### Teacher
- Dashboard
- Courses and lesson workflow
- Course forum
- Course grading
- Calendar and scheduling
- Attendance management
- Quiz builder
- File uploads and resource management
- Internal messaging

### Student
- Dashboard
- Courses and lesson workflow
- Course forum
- Course grades/comments
- Calendar view
- Quiz participation with auto-scoring
- Resource downloads and submission uploads
- Internal messaging

## Shared systems

- Role-based authentication and middleware access control
- Notification bell in the dashboard header
- Internal messaging between admin, teacher, and student roles
- Attendance tracking with present, absent, and late states
- Quiz creation, question management, submission, and scoring
- Supabase Storage-backed file uploads with `course-files` bucket
- Course resources and submission file handling

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database setup

Run [supabase/eduflow-schema.sql](./supabase/eduflow-schema.sql) in the Supabase SQL Editor.

That migration now provisions:
- auth-linked `users`
- courses and enrollments
- assignments and submissions
- course modules, lesson tasks, course grades, and course forum messages
- calendar events
- messages
- notifications
- attendance
- quizzes, questions, and quiz submissions
- files
- Supabase Storage bucket registration for `course-files`

## Demo users

After the schema is applied, run:

```powershell
node scripts\seed-demo-users.mjs
```

Demo credentials:
- `admin@eduflow.dev` / `Admin@12345`
- `teacher@eduflow.dev` / `Teacher@12345`
- `student@eduflow.dev` / `Student@12345`

## Important routes

### Public
- `/`
- `/login`

### Admin
- `/admin/dashboard`
- `/admin/teachers`
- `/admin/students`
- `/admin/courses`
- `/admin/courses/[courseId]`
- `/admin/enrollments`
- `/admin/analytics`
- `/admin/attendance`
- `/admin/messages`

### Teacher
- `/teacher/dashboard`
- `/teacher/courses`
- `/teacher/courses/[courseId]`
- `/teacher/calendar`
- `/teacher/attendance`
- `/teacher/quizzes`
- `/teacher/files`
- `/teacher/messages`

### Student
- `/student/dashboard`
- `/student/courses`
- `/student/courses/[courseId]`
- `/student/calendar`
- `/student/quizzes`
- `/student/resources`
- `/student/messages`

## New backend action files

- [lib/calendar-actions.ts](./lib/calendar-actions.ts)
- [lib/messaging-actions.ts](./lib/messaging-actions.ts)
- [lib/attendance-actions.ts](./lib/attendance-actions.ts)
- [lib/quiz-actions.ts](./lib/quiz-actions.ts)
- [lib/notification-actions.ts](./lib/notification-actions.ts)
- [lib/file-actions.ts](./lib/file-actions.ts)
- [lib/lms-common.ts](./lib/lms-common.ts)

## New shared UI components

- [components/CalendarView.tsx](./components/CalendarView.tsx)
- [components/MessagingPanel.tsx](./components/MessagingPanel.tsx)
- [components/AttendanceTable.tsx](./components/AttendanceTable.tsx)
- [components/QuizBuilder.tsx](./components/QuizBuilder.tsx)
- [components/NotificationBell.tsx](./components/NotificationBell.tsx)
- [components/FileUploader.tsx](./components/FileUploader.tsx)
- [components/FileList.tsx](./components/FileList.tsx)
- [components/ResourceRepository.tsx](./components/ResourceRepository.tsx)

## Local development

```bash
npm install
npm run dev
```

## Verification

The current codebase has been verified with:

```bash
npm run build
```

## Notes

- The app uses server-side role checks for all sensitive actions.
- The notification bell stays empty until the schema migration runs and notification-producing actions are triggered.
- File uploads depend on Supabase Storage being available for the configured project.