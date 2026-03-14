# PRD

## Product Name
EduFlow

## Product Summary
EduFlow is a role-based learning management system built with Next.js and Supabase. It provides a secure admin panel, teacher workspace, and student workspace with authentication, middleware-based access control, and course-management flows.

## Core Roles
- Admin
- Teacher
- Student

## Goals
- Provide secure email/password authentication with Supabase Auth.
- Route each authenticated user to the correct dashboard based on role.
- Protect role-specific pages with middleware and server-side authorization.
- Allow admins to manage teachers, students, courses, and enrollments.
- Allow teachers to manage coursework and grading.
- Allow students to access learning content and grades.

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
- Enrollments module
- Search in each admin listing
- CRUD for teachers
- CRUD for students
- Create/update/delete for courses
- Enrollment management with course assignment, teacher assignment, and multi-student enrollment
- Pending/loading state for admin action forms
- Duplicate-email prevention for teacher/student creation
- Create-form reset after successful teacher/student creation

### Teacher Module
- Teacher dashboard
- View assigned courses
- Course detail view with roster and assignments
- Create assignments
- View submissions
- Grade submissions
- Generate AI-style feedback suggestions

### Student Module
- Student dashboard
- View enrolled courses
- View assignments
- Submit assignments
- View grades and feedback

### Data and Schema
- Supabase schema migration for auth-linked `users` records
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
- `/admin/enrollments`

### Teacher
- `/teacher/dashboard`
- `/teacher/courses`
- `/teacher/courses/[courseId]`
- `/teacher/assignments`
- `/teacher/assignments/[assignmentId]`

### Student
- `/student/dashboard`
- `/student/courses`
- `/student/courses/[courseId]`
- `/student/assignments`
- `/student/assignments/[assignmentId]`

## Non-Functional Requirements
- Use TypeScript throughout the app
- Use Tailwind CSS for UI styling
- Keep server actions and auth rules enforced on the server
- Avoid trust in client-provided role or user identity
- Keep admin workflows responsive with disabled submit states during mutations
