-- Chat messages: optional image attachment
alter table public.chat_messages
  add column if not exists image_url text;

alter table public.chat_messages
  drop constraint if exists chat_messages_text_check;

alter table public.chat_messages
  add constraint chat_messages_text_check
  check (char_length(text) <= 2000);

alter table public.chat_messages
  drop constraint if exists chat_messages_content_check;

alter table public.chat_messages
  add constraint chat_messages_content_check
  check (char_length(trim(text)) >= 1 or image_url is not null);

comment on column public.chat_messages.image_url is 'Optional chat photo URL (Supabase Storage)';
