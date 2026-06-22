-- Social feed posts (Dashboard — Facebook-style)

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_uid uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  model_id text references public.models(id) on delete set null,
  content text not null default '' check (char_length(content) <= 5000),
  image_url text,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_at_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_author_uid_idx on public.feed_posts (author_uid);

create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_uid uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists feed_post_comments_post_id_idx on public.feed_post_comments (post_id);

alter table public.feed_posts enable row level security;
alter table public.feed_post_comments enable row level security;

drop policy if exists "feed_posts_select_authenticated" on public.feed_posts;
create policy "feed_posts_select_authenticated"
  on public.feed_posts for select to authenticated using (true);

drop policy if exists "feed_posts_insert_authenticated" on public.feed_posts;
create policy "feed_posts_insert_authenticated"
  on public.feed_posts for insert to authenticated with check (author_uid = auth.uid());

drop policy if exists "feed_posts_update_authenticated" on public.feed_posts;
create policy "feed_posts_update_authenticated"
  on public.feed_posts for update to authenticated using (true) with check (true);

drop policy if exists "feed_posts_delete_own_or_admin" on public.feed_posts;
create policy "feed_posts_delete_own_or_admin"
  on public.feed_posts for delete to authenticated
  using (author_uid = auth.uid() or public.is_admin());

drop policy if exists "feed_comments_select_authenticated" on public.feed_post_comments;
create policy "feed_comments_select_authenticated"
  on public.feed_post_comments for select to authenticated using (true);

drop policy if exists "feed_comments_insert_authenticated" on public.feed_post_comments;
create policy "feed_comments_insert_authenticated"
  on public.feed_post_comments for insert to authenticated with check (author_uid = auth.uid());

drop policy if exists "feed_comments_delete_own_or_admin" on public.feed_post_comments;
create policy "feed_comments_delete_own_or_admin"
  on public.feed_post_comments for delete to authenticated
  using (author_uid = auth.uid() or public.is_admin());
