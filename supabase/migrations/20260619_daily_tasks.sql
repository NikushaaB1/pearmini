-- Daily tasks (admin creates) + completions (models submit, admin/project face awards points)

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  social_link text,
  points_reward integer not null default 10 check (points_reward >= 0),
  task_date date not null default current_date,
  created_by text not null default 'ადმინი',
  created_at timestamptz not null default now()
);

create index if not exists daily_tasks_task_date_idx on public.daily_tasks (task_date desc);
create index if not exists daily_tasks_created_at_idx on public.daily_tasks (created_at desc);

create table if not exists public.daily_task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.daily_tasks(id) on delete cascade,
  model_id text not null references public.models(id) on delete cascade,
  social_account text,
  completed_at timestamptz not null default now(),
  points_awarded integer check (points_awarded is null or points_awarded >= 0),
  awarded_by text,
  unique (task_id, model_id)
);

create index if not exists daily_task_completions_task_id_idx on public.daily_task_completions (task_id);
create index if not exists daily_task_completions_model_id_idx on public.daily_task_completions (model_id);

alter table public.daily_tasks enable row level security;
alter table public.daily_task_completions enable row level security;

drop policy if exists "daily_tasks_select_authenticated" on public.daily_tasks;
create policy "daily_tasks_select_authenticated"
  on public.daily_tasks for select to authenticated using (true);

drop policy if exists "daily_tasks_insert_admin" on public.daily_tasks;
create policy "daily_tasks_insert_admin"
  on public.daily_tasks for insert to authenticated with check (public.is_admin());

drop policy if exists "daily_tasks_update_admin" on public.daily_tasks;
create policy "daily_tasks_update_admin"
  on public.daily_tasks for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "daily_tasks_delete_admin" on public.daily_tasks;
create policy "daily_tasks_delete_admin"
  on public.daily_tasks for delete to authenticated using (public.is_admin());

drop policy if exists "daily_completions_select_authenticated" on public.daily_task_completions;
create policy "daily_completions_select_authenticated"
  on public.daily_task_completions for select to authenticated using (true);

drop policy if exists "daily_completions_insert_own" on public.daily_task_completions;
create policy "daily_completions_insert_own"
  on public.daily_task_completions for insert to authenticated
  with check (public.owns_model(model_id));

drop policy if exists "daily_completions_update_authenticated" on public.daily_task_completions;
create policy "daily_completions_update_authenticated"
  on public.daily_task_completions for update to authenticated using (true) with check (true);

drop policy if exists "daily_completions_delete_admin" on public.daily_task_completions;
create policy "daily_completions_delete_admin"
  on public.daily_task_completions for delete to authenticated using (public.is_admin());
