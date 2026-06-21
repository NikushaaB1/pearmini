-- Daily tasks timer: duration + deadline + penalty tracking

alter table public.daily_tasks
  add column if not exists duration_minutes integer not null default 120
    check (duration_minutes > 0 and duration_minutes <= 10080);

alter table public.daily_tasks
  add column if not exists expires_at timestamptz;

-- Backfill expires_at for existing rows
update public.daily_tasks
set expires_at = created_at + (duration_minutes * interval '1 minute')
where expires_at is null;

alter table public.daily_tasks
  alter column expires_at set not null;

create index if not exists daily_tasks_expires_at_idx on public.daily_tasks (expires_at);

create table if not exists public.daily_task_penalties (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.daily_tasks(id) on delete cascade,
  model_id text not null references public.models(id) on delete cascade,
  points_deducted integer not null check (points_deducted > 0),
  penalized_at timestamptz not null default now(),
  unique (task_id, model_id)
);

create index if not exists daily_task_penalties_task_id_idx on public.daily_task_penalties (task_id);
create index if not exists daily_task_penalties_model_id_idx on public.daily_task_penalties (model_id);

alter table public.daily_task_penalties enable row level security;

drop policy if exists "daily_penalties_select_authenticated" on public.daily_task_penalties;
create policy "daily_penalties_select_authenticated"
  on public.daily_task_penalties for select to authenticated using (true);

drop policy if exists "daily_penalties_insert_own" on public.daily_task_penalties;
create policy "daily_penalties_insert_own"
  on public.daily_task_penalties for insert to authenticated
  with check (public.owns_model(model_id));
