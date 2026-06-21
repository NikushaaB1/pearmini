-- Background music (YouTube / MP3) — stored in settings table

insert into public.settings (key, value, updated_at)
values (
  'bg_music',
  jsonb_build_object(
    'url', 'https://youtu.be/CDG_y0nR3Qg',
    'volume', 0.5,
    'enabled', true
  ),
  now()
)
on conflict (key) do nothing;
