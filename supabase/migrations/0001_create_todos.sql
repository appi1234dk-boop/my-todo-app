-- categories 테이블
create table public.categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  color text not null default '#6366f1'
);

-- 기본 카테고리 시드
insert into public.categories (name, color) values
  ('개인', '#6366f1'),
  ('업무', '#f59e0b'),
  ('공부', '#10b981');

-- todos 테이블 (카테고리 직접 참조 없음 — junction table 사용)
create table public.todos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 500),
  is_complete  boolean not null default false,
  due_date     date,
  position     float not null default extract(epoch from now()),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 다대다 junction table
create table public.todo_categories (
  todo_id     uuid not null references public.todos(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (todo_id, category_id)
);

create index todos_position_idx on public.todos (position);
create index todos_is_complete_idx on public.todos (is_complete);

-- RLS: 개인용 MVP — 인증 없이 전체 허용
alter table public.todos enable row level security;
alter table public.categories enable row level security;
alter table public.todo_categories enable row level security;

create policy "Allow all" on public.todos for all using (true) with check (true);
create policy "Allow all" on public.categories for all using (true) with check (true);
create policy "Allow all" on public.todo_categories for all using (true) with check (true);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger todos_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();
