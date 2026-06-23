-- Platform rules (read: all authenticated; write: admin only)
create table if not exists public.platform_rules (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 5000),
  sort_order int not null default 0,
  author text not null default 'ადმინისტრატორი',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_rules_sort_order_idx on public.platform_rules (sort_order asc, created_at asc);

alter table public.platform_rules enable row level security;

drop policy if exists "platform_rules_select_authenticated" on public.platform_rules;
create policy "platform_rules_select_authenticated"
  on public.platform_rules for select
  to authenticated
  using (true);

drop policy if exists "platform_rules_insert_admin" on public.platform_rules;
create policy "platform_rules_insert_admin"
  on public.platform_rules for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "platform_rules_update_admin" on public.platform_rules;
create policy "platform_rules_update_admin"
  on public.platform_rules for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "platform_rules_delete_admin" on public.platform_rules;
create policy "platform_rules_delete_admin"
  on public.platform_rules for delete
  to authenticated
  using (public.is_admin());

alter publication supabase_realtime add table public.platform_rules;
