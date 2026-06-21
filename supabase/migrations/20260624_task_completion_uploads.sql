-- დავალების შესრულების ატვირთული ფაილები (სქრინები/ფოტოები)

alter table public.daily_task_completions
  add column if not exists submission_urls jsonb not null default '[]'::jsonb;
