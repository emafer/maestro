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
  first_name    text not null,
  last_name     text not null,
  instrument    text not null,
  duration      int  not null default 30,
  email         text,
  father_name   text,
  father_phone  text,
  mother_name   text,
  mother_phone  text,
  notes         text,
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

-- 4. PROFILI / IMPOSTAZIONI
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  default_instrument  text,
  wa_template         text default 'Ciao {{GENITORE}}, ti ricordo la prossima lezione di {{STRUMENTO}} per {{ALUNNO}} il giorno {{DATA}} alle ore {{ORA}}. A presto!',
  updated_at          timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Owner only" on public.profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger per creare il profilo automaticamente al signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
