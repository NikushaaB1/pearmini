-- Optional text note on daily task completions (alongside photo uploads)

alter table public.daily_task_completions
  add column if not exists submission_note text;
