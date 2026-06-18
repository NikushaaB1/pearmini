-- Admin-provided social link on daily tasks (replaces requires_social_account flag)

alter table public.daily_tasks
  add column if not exists social_link text;

-- Optional: drop legacy flag if it exists
alter table public.daily_tasks
  drop column if exists requires_social_account;
