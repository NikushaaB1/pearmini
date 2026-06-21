-- PEAR Elite — Supabase schema
-- გაუშვი Supabase Dashboard → SQL Editor-ში

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'model' check (role in ('model', 'admin', 'head_admin')),
  model_id text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_model_id_idx on public.profiles (model_id);

-- Models
create table if not exists public.models (
  id text primary key,
  name text not null,
  email text,
  tagline text default 'ელიტური მოდელი',
  avatar text,
  phone_number text,
  kisa_id text,
  payment_method jsonb default null,
  updated_at timestamptz not null default now()
);

-- Model points (leaderboard)
create table if not exists public.model_points (
  model_id text primary key references public.models(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 5000),
  image_url text,
  pinned boolean not null default false,
  author text not null default 'ადმინისტრატორი',
  created_at timestamptz not null default now()
);

create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists announcements_pinned_idx on public.announcements (pinned);

-- Activity log
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null check (char_length(action) between 1 and 500),
  user_name text not null default 'სისტემა',
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 2000),
  sender_uid uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_role text not null check (sender_role in ('model', 'admin', 'head_admin')),
  sender_avatar text,
  sender_model_id text,
  sender_email text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at);

-- Helper functions for RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'head_admin')
  );
$$;

create or replace function public.is_head_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'head_admin'
  );
$$;

create or replace function public.owns_model(target_model_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and model_id = target_model_id
  );
$$;

-- Full account deletion (auth.users + profiles + linked model)
create or replace function public.delete_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
  target_model_id text;
begin
  if not public.is_head_admin() then
    raise exception 'მხოლოდ უფროს ადმინს შეუძლია ანგარიშის წაშლა';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'საკუთარი ანგარიშის წაშლა შეუძლებელია';
  end if;

  select role, model_id
  into target_role, target_model_id
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'ანგარიში ვერ მოიძებნა';
  end if;

  if target_role = 'head_admin' then
    raise exception 'უფროს ადმინის ანგარიში ვერ წაიშლება';
  end if;

  if target_model_id is not null then
    delete from public.model_points where model_id = target_model_id;
    delete from public.models where id = target_model_id;
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_account(uuid) from public;
grant execute on function public.delete_account(uuid) to authenticated;

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  user_model_id text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'model');
  if lower(new.email) = 'admin@pear.elite' then
    user_role := 'head_admin';
  end if;

  if user_role in ('admin', 'head_admin') then
    user_model_id := null;
  else
    user_model_id := nullif(new.raw_user_meta_data->>'model_id', '');
  end if;

  insert into public.profiles (id, email, display_name, role, model_id)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    user_role,
    user_model_id
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.models enable row level security;
alter table public.model_points enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_log enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_head_admin" on public.profiles;
create policy "profiles_delete_head_admin"
  on public.profiles for delete
  to authenticated
  using (
    public.is_head_admin()
    and id != auth.uid()
    and role = 'admin'
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Models policies
drop policy if exists "models_select_authenticated" on public.models;
create policy "models_select_authenticated"
  on public.models for select
  to authenticated
  using (true);

drop policy if exists "models_insert_admin" on public.models;
create policy "models_insert_admin"
  on public.models for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "models_update_admin_or_owner" on public.models;
create policy "models_update_admin_or_owner"
  on public.models for update
  to authenticated
  using (public.is_admin() or public.owns_model(id))
  with check (public.is_admin() or public.owns_model(id));

drop policy if exists "models_delete_admin" on public.models;
create policy "models_delete_admin"
  on public.models for delete
  to authenticated
  using (public.is_admin());

-- Points policies
drop policy if exists "points_select_authenticated" on public.model_points;
create policy "points_select_authenticated"
  on public.model_points for select
  to authenticated
  using (true);

drop policy if exists "points_insert_authenticated" on public.model_points;
create policy "points_insert_authenticated"
  on public.model_points for insert
  to authenticated
  with check (true);

drop policy if exists "points_update_authenticated" on public.model_points;
create policy "points_update_authenticated"
  on public.model_points for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "points_delete_admin" on public.model_points;
create policy "points_delete_admin"
  on public.model_points for delete
  to authenticated
  using (public.is_admin());

-- Announcements policies
drop policy if exists "announcements_select_authenticated" on public.announcements;
create policy "announcements_select_authenticated"
  on public.announcements for select
  to authenticated
  using (true);

drop policy if exists "announcements_insert_admin" on public.announcements;
create policy "announcements_insert_admin"
  on public.announcements for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "announcements_update_admin" on public.announcements;
create policy "announcements_update_admin"
  on public.announcements for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "announcements_delete_admin" on public.announcements;
create policy "announcements_delete_admin"
  on public.announcements for delete
  to authenticated
  using (public.is_admin());

-- Activity log policies
drop policy if exists "activity_select_authenticated" on public.activity_log;
create policy "activity_select_authenticated"
  on public.activity_log for select
  to authenticated
  using (true);

drop policy if exists "activity_insert_authenticated" on public.activity_log;
create policy "activity_insert_authenticated"
  on public.activity_log for insert
  to authenticated
  with check (true);

drop policy if exists "activity_delete_admin" on public.activity_log;
create policy "activity_delete_admin"
  on public.activity_log for delete
  to authenticated
  using (public.is_admin());

-- Chat policies
drop policy if exists "chat_select_authenticated" on public.chat_messages;
create policy "chat_select_authenticated"
  on public.chat_messages for select
  to authenticated
  using (true);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own"
  on public.chat_messages for insert
  to authenticated
  with check (sender_uid = auth.uid());

drop policy if exists "chat_delete_own_or_admin" on public.chat_messages;
create policy "chat_delete_own_or_admin"
  on public.chat_messages for delete
  to authenticated
  using (sender_uid = auth.uid() or public.is_admin());

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('pear-images', 'pear-images', true)
on conflict (id) do update set public = true;

drop policy if exists "images_select_authenticated" on storage.objects;
create policy "images_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pear-images');

drop policy if exists "images_insert_authenticated" on storage.objects;
create policy "images_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pear-images');

drop policy if exists "images_update_authenticated" on storage.objects;
create policy "images_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'pear-images');

drop policy if exists "images_delete_authenticated" on storage.objects;
create policy "images_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pear-images');

-- Seed default announcement
insert into public.announcements (title, content, pinned, author)
select
  'კეთილი იყოს მობრძანება PEAR™ Elite-ში',
  'შენი ელიტური სამუშაო სისტემა აქტიურია. ატვირთე საუკეთესო ნამუშევრები და ავიდე ლიდერბორდში.',
  true,
  'ადმინისტრატორი'
where not exists (select 1 from public.announcements limit 1);

insert into public.activity_log (action, user_name)
select 'სისტემა გაეშვა', 'ადმინისტრატორი'
where not exists (select 1 from public.activity_log limit 1);

-- Realtime (უკვე დაკონფიგურირებული Supabase-ში)
-- alter publication supabase_realtime add table public.models;
-- alter publication supabase_realtime add table public.chat_messages;
-- alter publication supabase_realtime add table public.profiles;
-- alter publication supabase_realtime add table public.model_points;
-- alter publication supabase_realtime add table public.announcements;
-- alter publication supabase_realtime add table public.activity_log;

-- Ideas table
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 2000),
  sender_uid uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_avatar text,
  likes jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ideas_created_at_idx on public.ideas (created_at desc);
alter table public.ideas enable row level security;
drop policy if exists "ideas_select_authenticated" on public.ideas;
create policy "ideas_select_authenticated" on public.ideas for select to authenticated using (true);
drop policy if exists "ideas_insert_own" on public.ideas;
create policy "ideas_insert_own" on public.ideas for insert to authenticated with check (sender_uid = auth.uid());
drop policy if exists "ideas_update_authenticated" on public.ideas;
create policy "ideas_update_authenticated" on public.ideas for update to authenticated using (true) with check (true);
drop policy if exists "ideas_delete_own_or_admin" on public.ideas;
create policy "ideas_delete_own_or_admin" on public.ideas for delete to authenticated using (sender_uid = auth.uid() or public.is_admin());
-- alter publication supabase_realtime add table public.ideas;

-- Designs table
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  image_url text not null,
  model_id text not null references public.models(id) on delete cascade,
  sender_name text not null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists designs_created_at_idx on public.designs (created_at desc);
alter table public.designs enable row level security;
drop policy if exists "designs_select_authenticated" on public.designs;
create policy "designs_select_authenticated" on public.designs for select to authenticated using (true);
drop policy if exists "designs_insert_own" on public.designs;
create policy "designs_insert_own" on public.designs for insert to authenticated with check (public.owns_model(model_id));
drop policy if exists "designs_delete_own_or_admin" on public.designs;
create policy "designs_delete_own_or_admin" on public.designs for delete to authenticated using (public.owns_model(model_id) or public.is_admin());
-- alter publication supabase_realtime add table public.designs;

-- Challenges table
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) <= 5000),
  points_reward integer not null default 100 check (points_reward >= 0),
  status text not null default 'active' check (status in ('active', 'completed')),
  winner_id text references public.models(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists challenges_created_at_idx on public.challenges (created_at desc);
alter table public.challenges enable row level security;
drop policy if exists "challenges_select_authenticated" on public.challenges;
create policy "challenges_select_authenticated" on public.challenges for select to authenticated using (true);
drop policy if exists "challenges_insert_admin" on public.challenges;
create policy "challenges_insert_admin" on public.challenges for insert to authenticated with check (public.is_admin());
drop policy if exists "challenges_update_admin" on public.challenges;
create policy "challenges_update_admin" on public.challenges for update to authenticated using (true) with check (public.is_admin());
drop policy if exists "challenges_delete_admin" on public.challenges;
create policy "challenges_delete_admin" on public.challenges for delete to authenticated using (public.is_admin());
-- alter publication supabase_realtime add table public.challenges;

-- Settings table (for Virtual Billboard and other config)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "settings_select_authenticated" on public.settings;
create policy "settings_select_authenticated" on public.settings for select to authenticated using (true);
drop policy if exists "settings_write_admin" on public.settings;
create policy "settings_write_admin" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- alter publication supabase_realtime add table public.settings;
-- Default bg_music: see migration 20260623_bg_music_settings.sql
-- value: { "url": "https://youtu.be/...", "volume": 0.5, "enabled": true }

-- Poll votes table (Models Poll items + Ideas Poll)
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  poll_type text not null check (poll_type in ('item', 'idea_poll')),
  voter_uids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, poll_type)
);
create index if not exists poll_votes_poll_type_idx on public.poll_votes (poll_type);
create index if not exists poll_votes_item_id_idx on public.poll_votes (item_id);
alter table public.poll_votes enable row level security;
drop policy if exists "poll_votes_select_authenticated" on public.poll_votes;
create policy "poll_votes_select_authenticated" on public.poll_votes for select to authenticated using (true);
drop policy if exists "poll_votes_insert_authenticated" on public.poll_votes;
create policy "poll_votes_insert_authenticated" on public.poll_votes for insert to authenticated with check (true);
drop policy if exists "poll_votes_update_authenticated" on public.poll_votes;
create policy "poll_votes_update_authenticated" on public.poll_votes for update to authenticated using (true) with check (true);
drop policy if exists "poll_votes_delete_admin" on public.poll_votes;
create policy "poll_votes_delete_admin" on public.poll_votes for delete to authenticated using (public.is_admin());
-- alter publication supabase_realtime add table public.poll_votes;

-- Daily tasks
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  social_link text,
  points_reward integer not null default 10 check (points_reward >= 0),
  task_date date not null default current_date,
  duration_minutes integer not null default 120 check (duration_minutes > 0 and duration_minutes <= 10080),
  expires_at timestamptz not null default (now() + interval '120 minutes'),
  created_by text not null default 'ადმინი',
  created_at timestamptz not null default now()
);
create index if not exists daily_tasks_task_date_idx on public.daily_tasks (task_date desc);
create index if not exists daily_tasks_created_at_idx on public.daily_tasks (created_at desc);
alter table public.daily_tasks enable row level security;
drop policy if exists "daily_tasks_select_authenticated" on public.daily_tasks;
create policy "daily_tasks_select_authenticated" on public.daily_tasks for select to authenticated using (true);
drop policy if exists "daily_tasks_insert_admin" on public.daily_tasks;
create policy "daily_tasks_insert_admin" on public.daily_tasks for insert to authenticated with check (public.is_admin());
drop policy if exists "daily_tasks_update_admin" on public.daily_tasks;
create policy "daily_tasks_update_admin" on public.daily_tasks for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "daily_tasks_delete_admin" on public.daily_tasks;
create policy "daily_tasks_delete_admin" on public.daily_tasks for delete to authenticated using (public.is_admin());

create table if not exists public.daily_task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.daily_tasks(id) on delete cascade,
  model_id text not null references public.models(id) on delete cascade,
  social_account text,
  completed_at timestamptz not null default now(),
  points_awarded integer check (points_awarded is null or points_awarded >= 0),
  awarded_by text,
  submission_urls jsonb not null default '[]'::jsonb,
  submission_note text,
  unique (task_id, model_id)
);
create index if not exists daily_task_completions_task_id_idx on public.daily_task_completions (task_id);
create index if not exists daily_task_completions_model_id_idx on public.daily_task_completions (model_id);
alter table public.daily_task_completions enable row level security;
drop policy if exists "daily_completions_select_authenticated" on public.daily_task_completions;
create policy "daily_completions_select_authenticated" on public.daily_task_completions for select to authenticated using (true);
drop policy if exists "daily_completions_insert_own" on public.daily_task_completions;
create policy "daily_completions_insert_own" on public.daily_task_completions for insert to authenticated with check (public.owns_model(model_id));
drop policy if exists "daily_completions_update_authenticated" on public.daily_task_completions;
create policy "daily_completions_update_authenticated" on public.daily_task_completions for update to authenticated using (true) with check (true);
drop policy if exists "daily_completions_delete_admin" on public.daily_task_completions;
create policy "daily_completions_delete_admin" on public.daily_task_completions for delete to authenticated using (public.is_admin());

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
create policy "daily_penalties_select_authenticated" on public.daily_task_penalties for select to authenticated using (true);
drop policy if exists "daily_penalties_insert_own" on public.daily_task_penalties;
create policy "daily_penalties_insert_own" on public.daily_task_penalties for insert to authenticated with check (public.owns_model(model_id));

-- CV submissions
create table if not exists public.cv_submissions (
  id text primary key,
  name text,
  email text,
  message text,
  file_name text,
  file_url text,
  model_id text references public.models(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists cv_submissions_created_at_idx on public.cv_submissions (created_at desc);
alter table public.cv_submissions enable row level security;
drop policy if exists "cv_submissions_select_admin" on public.cv_submissions;
create policy "cv_submissions_select_admin" on public.cv_submissions for select to authenticated using (public.is_admin());
drop policy if exists "cv_submissions_insert_authenticated" on public.cv_submissions;
create policy "cv_submissions_insert_authenticated" on public.cv_submissions for insert to authenticated with check (true);
drop policy if exists "cv_submissions_insert_anon" on public.cv_submissions;
create policy "cv_submissions_insert_anon" on public.cv_submissions for insert to anon with check (true);
drop policy if exists "cv_submissions_delete_admin" on public.cv_submissions;
create policy "cv_submissions_delete_admin" on public.cv_submissions for delete to authenticated using (public.is_admin());

