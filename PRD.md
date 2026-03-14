# PRD

## Product Name
EduFlow

## Product Summary
EduFlow is a role-based learning management system built with Next.js and Supabase. It provides a secure admin panel, teacher workspace, and student workspace with authentication, middleware-based access control, course management, lesson delivery, grading, discussions, scheduling, quizzes, attendance, messaging, notifications, and course resource sharing.

## Core Roles
- Admin
- Teacher
- Student

## Goals
- Provide secure email/password authentication with Supabase Auth.
- Route each authenticated user to the correct dashboard based on role.
- Protect role-specific pages with middleware and server-side authorization.
- Allow admins to manage teachers, students, courses, enrollments, analytics, and attendance reporting.
- Allow teachers to manage coursework, scheduling, attendance, quizzes, files, messaging, and grading.
- Allow students to access learning content, events, quizzes, files, messages, and grades.

## Feature List

### Authentication
- Login page at `/login`
- Supabase Auth email/password login
- Cookie-based session storage
- Logout support
- Role lookup from `public.users`
- Post-login dashboard redirect by role

### Authorization
- Middleware route protection for `/admin/*`, `/teacher/*`, and `/student/*`
- Redirect unauthorized users to their own dashboard
- Server-side role checks for protected data/actions

### Admin Module
- Admin dashboard
- Teachers module
- Students module
- Courses module
- Course builder inside admin course management
- Template selection during course creation
- Course templates for Math, Science, and Custom setups
- Drag-and-drop curriculum module ordering
- Course module CRUD for lessons, videos, quizzes, and resources
- Curriculum tagging for course modules
- Enrollments module
- Search in each admin listing
- CRUD for teachers
- CRUD for students
- Create/update/delete for courses
- Create/update/delete/reorder for course modules
- Enrollment management with course assignment, teacher assignment, and multi-student enrollment
- Pending/loading state for admin action forms
- Duplicate-email prevention for teacher/student creation
- Create-form reset after successful teacher/student creation
- Analytics overview page
- Attendance reporting page
- Internal messaging access

### Teacher Module
- Teacher dashboard
- View assigned courses
- Course detail view with roster, lesson modules, discussions, resources, and course grading
- View course curriculum modules
- Add lesson tasks for lesson modules
- Add due dates to lesson tasks
- Use a working date picker for lesson task due dates
- Mark lessons as completed
- Grade students per course
- Add comments per student for a course
- Use a course-wise discussion forum shared with students
- Course calendar and scheduling for assignments, events, and exams
- Attendance management by class session
- Quiz builder with multiple choice, short answer, and true/false questions
- File upload management for course resources and assignment attachments
- Internal messaging with admins and students

### Student Module
- Student dashboard
- View enrolled courses
- View lesson tasks and due dates inside courses
- View lesson task due dates in `dd-mm-yyyy` format
- View course grades and teacher comments
- Use a course-wise discussion forum shared with teachers
- View upcoming calendar events and exams
- Participate in quizzes and review quiz scores
- Download shared course resources
- Upload files as assignment submissions
- Internal messaging inbox

### Shared Systems
- Calendar and scheduling for course events
- Internal messaging between admin, teacher, and student roles
- Notification system in the dashboard header
- Attendance tracking and reporting
- Quiz creation, delivery, submission, and auto-scoring
- File sharing and resource repository backed by Supabase Storage

### Notifications
- Notifications for assignment creation
- Notifications for assignment grading
- Notifications for course enrollment
- Notifications for new internal messages
- Notifications displayed in the dashboard header

### Data and Schema
- Supabase schema migration for auth-linked `users` records
- Course module lesson-task support, due dates, and lesson completion tracking
- Course-level student grading and comments
- Course-level teacher/student discussion forum
- Calendar event scheduling tables
- Messages and notifications tables
- Attendance tables
- Quizzes, questions, quiz submissions, and quiz answers tables
- Files table and Supabase Storage bucket integration
- Demo account seed script for admin, teacher, and student users

## Primary Routes

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

## Non-Functional Requirements
- Use TypeScript throughout the app
- Use Tailwind CSS for UI styling
- Keep server actions and auth rules enforced on the server
- Avoid trust in client-provided role or user identity
- Keep admin workflows responsive with disabled submit states during mutations
- Keep new modules integrated into the existing dashboard shell and navigation
- Use Supabase Storage for file uploads and persisted file metadata