-- CV submissions from About page

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
create policy "cv_submissions_select_admin"
  on public.cv_submissions for select to authenticated
  using (public.is_admin());

drop policy if exists "cv_submissions_insert_authenticated" on public.cv_submissions;
create policy "cv_submissions_insert_authenticated"
  on public.cv_submissions for insert to authenticated
  with check (true);

drop policy if exists "cv_submissions_insert_anon" on public.cv_submissions;
create policy "cv_submissions_insert_anon"
  on public.cv_submissions for insert to anon
  with check (true);

drop policy if exists "cv_submissions_delete_admin" on public.cv_submissions;
create policy "cv_submissions_delete_admin"
  on public.cv_submissions for delete to authenticated
  using (public.is_admin());
