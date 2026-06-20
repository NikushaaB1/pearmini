-- Allow anonymous read of shine spotlight config for public landing page
drop policy if exists "settings_select_shine_spotlight_anon" on public.settings;
create policy "settings_select_shine_spotlight_anon"
  on public.settings for select to anon
  using (key = 'shine_spotlight');
