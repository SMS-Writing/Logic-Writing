-- =====================================================================
-- 논리로 고쳐 쓰기 · 서버(Supabase) 설정
-- 사용법: 아래 [바꿀 곳] 두 군데를 고친 뒤, 이 파일 전체를
--         Supabase > SQL Editor > New query 에 붙여 넣고 Run.
--         여러 번 실행해도 안전합니다.
-- =====================================================================

-- [바꿀 곳 ①] 교수자 코드: 교수자 가입 때만 쓰는 비밀 코드
create table if not exists public.settings(key text primary key, value text not null);
insert into public.settings(key,value) values ('teacher_code','교수자코드를-바꾸세요')
  on conflict (key) do update set value = excluded.value;

-- [바꿀 곳 ②] 분반과 학생 참여 코드 (나중에 교수자 화면에서도 추가 가능)
create table if not exists public.classes(
  code text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
insert into public.classes(code,name) values
  ('WRITING-A','글쓰기 A분반'),
  ('WRITING-B','글쓰기 B분반')
  on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 이하 수정하지 마세요
-- ---------------------------------------------------------------------
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('student','teacher')),
  class_code text references public.classes(code),
  created_at timestamptz not null default now()
);

create table if not exists public.projects(
  id uuid primary key default gen_random_uuid(),
  owner uuid not null unique references public.profiles(id) on delete cascade,
  class_code text not null,
  data jsonb not null default '{}'::jsonb,
  shared boolean not null default false,
  status text not null default '진행 중',
  updated_at timestamptz not null default now()
);

create table if not exists public.comments(
  id uuid primary key default gen_random_uuid(),
  project uuid not null references public.projects(id) on delete cascade,
  author uuid not null references public.profiles(id) on delete cascade,
  auto boolean not null default false,
  p int not null,
  quote text not null,
  tag text not null,
  body text not null,
  resolved boolean not null default false,
  resp jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.replies(
  id uuid primary key default gen_random_uuid(),
  comment uuid not null references public.comments(id) on delete cascade,
  author uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback(
  id uuid primary key default gen_random_uuid(),
  project uuid not null references public.projects(id) on delete cascade,
  reviewer uuid not null references public.profiles(id) on delete cascade,
  good text, need text, arrange text, question text,
  resp jsonb,
  created_at timestamptz not null default now(),
  unique(project, reviewer)
);

create table if not exists public.reader(
  project uuid not null references public.projects(id) on delete cascade,
  reviewer uuid not null references public.profiles(id) on delete cascade,
  p int not null,
  text text not null default '',
  primary key(project, reviewer, p)
);

create index if not exists comments_project_idx on public.comments(project);
create index if not exists feedback_project_idx on public.feedback(project);
create index if not exists replies_comment_idx on public.replies(comment);

-- 도우미 함수 ----------------------------------------------------------
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

create or replace function public.my_class() returns text
language sql stable security definer set search_path = public as $$
  select class_code from public.profiles where id = auth.uid();
$$;

create or replace function public.can_read_project(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.projects pr
    where pr.id = pid
      and (pr.owner = auth.uid() or public.is_teacher() or (pr.shared and pr.class_code = public.my_class()))
  );
$$;

create or replace function public.owns_project(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.projects where id = pid and owner = auth.uid());
$$;

-- 가입 후 수업 참여 (참여 코드·교수자 코드 확인) ------------------------
create or replace function public.join_class(p_name text, p_code text, p_teacher_code text default null)
returns text language plpgsql security definer set search_path = public as $$
declare r text := 'student';
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception '이름을 입력하세요'; end if;
  if coalesce(p_teacher_code,'') <> '' then
    if p_teacher_code = (select value from public.settings where key = 'teacher_code') then
      r := 'teacher';
    else
      raise exception '교수자 코드가 올바르지 않습니다';
    end if;
  end if;
  if r = 'student' and not exists(select 1 from public.classes where code = p_code) then
    raise exception '수업 참여 코드가 올바르지 않습니다';
  end if;
  insert into public.profiles(id, name, role, class_code)
  values (auth.uid(), trim(p_name), r, case when r = 'student' then p_code else null end)
  on conflict (id) do update set name = excluded.name;
  return r;
end $$;

-- 권한 ------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.classes, public.profiles, public.projects,
  public.comments, public.replies, public.feedback, public.reader to authenticated;
revoke all on public.settings from anon, authenticated;
grant execute on function public.join_class(text, text, text) to authenticated;
grant execute on function public.is_teacher(), public.my_class(), public.can_read_project(uuid), public.owns_project(uuid) to authenticated;

alter table public.settings enable row level security;
alter table public.classes  enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.comments enable row level security;
alter table public.replies  enable row level security;
alter table public.feedback enable row level security;
alter table public.reader   enable row level security;

-- 분반: 교수자만 보고 만들 수 있음 (학생은 코드로만 참여)
drop policy if exists classes_sel on public.classes;
create policy classes_sel on public.classes for select to authenticated using (public.is_teacher());
drop policy if exists classes_ins on public.classes;
create policy classes_ins on public.classes for insert to authenticated with check (public.is_teacher());

-- 사람: 본인, 같은 분반, 교수자는 서로 이름을 볼 수 있음 (수정·추가는 join_class 함수로만)
drop policy if exists profiles_sel on public.profiles;
create policy profiles_sel on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_teacher() or role = 'teacher' or class_code = public.my_class());

-- 글: 본인 / 교수자 / 공개했을 때 같은 분반 학생
drop policy if exists projects_sel on public.projects;
create policy projects_sel on public.projects for select to authenticated
  using (owner = auth.uid() or public.is_teacher() or (shared and class_code = public.my_class()));
drop policy if exists projects_ins on public.projects;
create policy projects_ins on public.projects for insert to authenticated
  with check (owner = auth.uid() and class_code = public.my_class());
drop policy if exists projects_upd on public.projects;
create policy projects_upd on public.projects for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid() and class_code = public.my_class());

-- 메모
drop policy if exists comments_sel on public.comments;
create policy comments_sel on public.comments for select to authenticated using (public.can_read_project(project));
drop policy if exists comments_ins on public.comments;
create policy comments_ins on public.comments for insert to authenticated
  with check (author = auth.uid() and public.can_read_project(project));
drop policy if exists comments_upd on public.comments;
create policy comments_upd on public.comments for update to authenticated
  using (author = auth.uid() or public.owns_project(project) or public.is_teacher());
drop policy if exists comments_del on public.comments;
create policy comments_del on public.comments for delete to authenticated
  using (author = auth.uid() or public.is_teacher());

-- 답글
drop policy if exists replies_sel on public.replies;
create policy replies_sel on public.replies for select to authenticated
  using (exists(select 1 from public.comments c where c.id = comment));
drop policy if exists replies_ins on public.replies;
create policy replies_ins on public.replies for insert to authenticated
  with check (author = auth.uid() and exists(select 1 from public.comments c where c.id = comment));
drop policy if exists replies_del on public.replies;
create policy replies_del on public.replies for delete to authenticated using (author = auth.uid() or public.is_teacher());

-- 종합 피드백 (자기 글에는 쓸 수 없음, 답변은 글 주인이 씀)
drop policy if exists feedback_sel on public.feedback;
create policy feedback_sel on public.feedback for select to authenticated using (public.can_read_project(project));
drop policy if exists feedback_ins on public.feedback;
create policy feedback_ins on public.feedback for insert to authenticated
  with check (reviewer = auth.uid() and public.can_read_project(project) and not public.owns_project(project));
drop policy if exists feedback_upd on public.feedback;
create policy feedback_upd on public.feedback for update to authenticated
  using (reviewer = auth.uid() or public.owns_project(project));
drop policy if exists feedback_del on public.feedback;
create policy feedback_del on public.feedback for delete to authenticated using (reviewer = auth.uid() or public.is_teacher());

-- 독자 요지
drop policy if exists reader_sel on public.reader;
create policy reader_sel on public.reader for select to authenticated using (public.can_read_project(project));
drop policy if exists reader_ins on public.reader;
create policy reader_ins on public.reader for insert to authenticated
  with check (reviewer = auth.uid() and public.can_read_project(project));
drop policy if exists reader_upd on public.reader;
create policy reader_upd on public.reader for update to authenticated
  using (reviewer = auth.uid()) with check (reviewer = auth.uid());

-- ---------------------------------------------------------------------
-- 초고 동료 검토 (2026-11 추가)
-- ---------------------------------------------------------------------
create table if not exists public.draft_reviews(
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles(id) on delete cascade,
  reviewer uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  resp jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(author, reviewer)
);
create or replace function public.draft_review_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.reviewer then
    new.resp := old.resp;
  elsif auth.uid() = old.author then
    new.answers := old.answers; new.summary := old.summary;
  end if;
  new.author := old.author; new.reviewer := old.reviewer; new.updated_at := now();
  return new;
end $$;
drop trigger if exists draft_review_guard on public.draft_reviews;
create trigger draft_review_guard before update on public.draft_reviews
  for each row execute function public.draft_review_guard();
create or replace function public.review_counts() returns table(author uuid, n bigint)
language sql stable security definer set search_path = public as $$
  select p.id, count(r.id) from public.profiles p
  left join public.draft_reviews r on r.author = p.id and coalesce((r.summary->>'submitted')::boolean, false)
  where p.role = 'student' and p.class_code = public.my_class()
  group by p.id;
$$;
grant select, insert, update, delete on public.draft_reviews to authenticated;
grant execute on function public.review_counts() to authenticated;
alter table public.draft_reviews enable row level security;
drop policy if exists dr_sel on public.draft_reviews;
create policy dr_sel on public.draft_reviews for select to authenticated
  using (reviewer = auth.uid() or author = auth.uid() or public.is_teacher());
drop policy if exists dr_ins on public.draft_reviews;
create policy dr_ins on public.draft_reviews for insert to authenticated
  with check (reviewer = auth.uid() and author <> auth.uid()
    and exists(select 1 from public.profiles p where p.id = author and p.role = 'student' and p.class_code = public.my_class()));
drop policy if exists dr_upd on public.draft_reviews;
create policy dr_upd on public.draft_reviews for update to authenticated
  using (reviewer = auth.uid() or author = auth.uid());
drop policy if exists dr_del on public.draft_reviews;
create policy dr_del on public.draft_reviews for delete to authenticated
  using (reviewer = auth.uid() or public.is_teacher());
