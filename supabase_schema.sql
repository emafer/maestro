-- ============================================================
--  MAESTRO – Schema Supabase
--  Incolla questo nell'editor SQL di Supabase (SQL Editor → New query)
-- ============================================================

-- 1. SCUOLE
create table public.schools (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  address     text,
  contact     text,
  color       text default '#E8A838',
  created_at  timestamptz default now()
);
alter table public.schools enable row level security;
create policy "Owner only" on public.schools
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. ALUNNI
create table public.students (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  school_id     uuid references public.schools(id) on delete set null,
  name          text not null,
  instrument    text not null,
  duration      int  not null default 30,
  email         text,
  phone         text,
  notes         text,
  next_to_bring text,
  created_at    timestamptz default now()
);
alter table public.students enable row level security;
create policy "Owner only" on public.students
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. LEZIONI
create table public.lessons (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  datetime      timestamptz not null,
  duration      int,
  topic         text,
  notes         text,
  next_to_bring text,
  created_at    timestamptz default now()
);
alter table public.lessons enable row level security;
create policy "Owner only" on public.lessons
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
--  INDICI per performance
-- ============================================================
create index on public.students(user_id);
create index on public.lessons(user_id);
create index on public.lessons(student_id);
create index on public.lessons(datetime);
