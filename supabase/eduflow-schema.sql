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
  check (role in ('admin', 'teacher', 'student'));

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

create index if not exists idx_courses_teacher_id on public.courses(teacher_id);
create index if not exists idx_enrollments_course_id on public.enrollments(course_id);
create index if not exists idx_enrollments_student_id on public.enrollments(student_id);
create index if not exists idx_assignments_course_id on public.assignments(course_id);
create index if not exists idx_submissions_assignment_id on public.submissions(assignment_id);
create index if not exists idx_submissions_student_id on public.submissions(student_id);
