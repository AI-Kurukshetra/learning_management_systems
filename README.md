# EduFlow

EduFlow is a responsive Learning Management System built inside the existing Next.js 14 App Router project. It demonstrates a complete LMS workflow for both teachers and students using TypeScript, Tailwind CSS, Supabase, and Server Actions.

## What the LMS does

### Teacher workflow
- Create courses from the dashboard or courses page.
- Enroll students by name from an individual course page.
- Publish assignments with title, description, and due date.
- Review submissions on each assignment page.
- Grade submissions with numeric scores and written feedback.
- Use the optional `Generate AI feedback` action to insert a suggested feedback draft.

### Student workflow
- Open the student dashboard to view enrolled courses.
- Review assignments across all courses.
- Submit or resubmit written answers.
- Track grades and feedback from the assignment page or gradebook.

## Supabase SQL

Run [supabase/eduflow-schema.sql](./supabase/eduflow-schema.sql) in the Supabase SQL editor before opening the dashboard.

The app expects these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Folder structure

```text
app
  dashboard/page.tsx
  courses/page.tsx
  courses/[courseId]/page.tsx
  assignments/page.tsx
  assignments/[assignmentId]/page.tsx
  gradebook/page.tsx
  layout.tsx
  page.tsx
components
  AppShell.tsx
  Sidebar.tsx
  Header.tsx
  CourseCard.tsx
  AssignmentCard.tsx
  CreateCourseModal.tsx
  CreateAssignmentModal.tsx
  StudentList.tsx
  SubmissionForm.tsx
  GradeTable.tsx
lib
  supabase.ts
  dbActions.ts
  types.ts
supabase
  eduflow-schema.sql
```

## How it works

1. Visit `/` and choose `Teacher workspace` or `Student workspace`.
2. The first dashboard load auto-seeds a demo teacher and a few students if the `users` table is empty.
3. Teachers can create a course, open it, enroll students, and publish assignments.
4. Students open the assignment detail page to submit written responses.
5. Teachers grade from the assignment detail page and can generate suggested feedback.

## Deployment on Vercel

1. Push this project to GitHub, GitLab, or Bitbucket.
2. Import the repository into Vercel.
3. Add the Supabase environment variables in the Vercel project settings.
4. Deploy the project.
5. After deploy, run the SQL schema in the target Supabase project if you have not done it already.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and switch between `teacher` and `student` views from the dashboard header.

