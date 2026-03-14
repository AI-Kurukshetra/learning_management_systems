create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists auth_user_id uuid,
  add column if not exists email text;

update public.users
set email =
  lower(regexp_replace(coalesce(name, 'user'), '[^a-zA-Z0-9]+', '.', 'g')) ||
  '+' || left(id::text, 8) || '@placeholder.local'
where email is null or btrim(email) = '';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_role_check'
  ) then
    alter table public.users drop constraint users_role_check;
  end if;
end $$;

alter table public.users
  alter column email set not null;

alter table public.users
  add constraint users_role_check
  check (role in ('admin', 'teacher', 'student', 'parent'));

create unique index if not exists idx_users_auth_user_id_unique
  on public.users(auth_user_id)
  where auth_user_id is not null;

create unique index if not exists idx_users_email_unique
  on public.users(email);

create index if not exists idx_users_role on public.users(role);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  teacher_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  unique (course_id, student_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null,
  due_date timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  grade integer,
  feedback text,
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  content text not null default '',
  curriculum_tag text,
  module_type text not null,
  position integer not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_modules_module_type_check check (module_type in ('lesson', 'video', 'assignment', 'quiz', 'resource')),
  constraint course_modules_curriculum_tag_check check (curriculum_tag is null or curriculum_tag in ('Math', 'Science', 'History', 'Programming', 'Language')),
  constraint course_modules_position_check check (position >= 0)
);

alter table public.course_modules
  add column if not exists is_completed boolean not null default false,
  add column if not exists completed_at timestamptz;

create table if not exists public.course_module_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  due_date timestamptz,
  is_completed boolean not null default false,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint course_module_tasks_position_check check (position >= 0)
);

alter table public.course_module_tasks
  add column if not exists due_date timestamptz;

create table if not exists public.course_grades (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  grade integer,
  comments text,
  updated_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create table if not exists public.course_messages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_teacher_id on public.courses(teacher_id);
create index if not exists idx_enrollments_course_id on public.enrollments(course_id);
create index if not exists idx_enrollments_student_id on public.enrollments(student_id);
create index if not exists idx_assignments_course_id on public.assignments(course_id);
create index if not exists idx_submissions_assignment_id on public.submissions(assignment_id);
create index if not exists idx_submissions_student_id on public.submissions(student_id);
create index if not exists idx_course_modules_course_id_position on public.course_modules(course_id, position);
create index if not exists idx_course_modules_module_type on public.course_modules(module_type);
create index if not exists idx_course_modules_curriculum_tag on public.course_modules(curriculum_tag);
create index if not exists idx_course_module_tasks_module_id_position on public.course_module_tasks(module_id, position);
create index if not exists idx_course_grades_course_student on public.course_grades(course_id, student_id);
create index if not exists idx_course_messages_course_created_at on public.course_messages(course_id, created_at);
create index if not exists idx_course_messages_sender_id on public.course_messages(sender_id);

create or replace function public.set_course_module_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.set_course_grade_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_course_modules_updated_at on public.course_modules;
create trigger trg_course_modules_updated_at
before update on public.course_modules
for each row
execute function public.set_course_module_updated_at();

drop trigger if exists trg_course_grades_updated_at on public.course_grades;
create trigger trg_course_grades_updated_at
before update on public.course_grades
for each row
execute function public.set_course_grade_updated_at();
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  event_type text not null,
  title text not null,
  description text not null default '',
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint calendar_events_type_check check (event_type in ('assignment', 'event', 'exam'))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  subject text not null default '',
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('assignment_created', 'assignment_graded', 'new_message', 'course_enrollment'))
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  session_date date not null,
  status text not null,
  marked_by uuid references public.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint attendance_status_check check (status in ('present', 'absent', 'late')),
  unique (course_id, student_id, session_date)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_type text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint questions_type_check check (question_type in ('multiple_choice', 'short_answer', 'true_false')),
  constraint questions_position_check check (position >= 0)
);

create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  submitted_at timestamptz not null default now(),
  unique (quiz_id, student_id)
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  uploader_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  category text not null,
  storage_path text not null default '',
  created_at timestamptz not null default now(),
  constraint files_category_check check (category in ('resource', 'assignment_attachment', 'submission'))
);

alter table public.files
  add column if not exists storage_path text not null default '';

create index if not exists idx_calendar_events_course_date on public.calendar_events(course_id, scheduled_at);
create index if not exists idx_messages_sender_recipient on public.messages(sender_id, recipient_id, created_at);
create index if not exists idx_messages_recipient_is_read on public.messages(recipient_id, is_read);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at);
create index if not exists idx_attendance_course_date on public.attendance(course_id, session_date);
create index if not exists idx_attendance_student_id on public.attendance(student_id);
create index if not exists idx_quizzes_course_id on public.quizzes(course_id);
create index if not exists idx_questions_quiz_position on public.questions(quiz_id, position);
create index if not exists idx_quiz_submissions_quiz_id on public.quiz_submissions(quiz_id);
create index if not exists idx_files_course_category on public.files(course_id, category);
create index if not exists idx_files_assignment_id on public.files(assignment_id);
create index if not exists idx_files_uploader_id on public.files(uploader_id);

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
on conflict (id) do nothing;

