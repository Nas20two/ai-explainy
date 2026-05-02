-- Dev Companion V2 Tables for AI Explainy
-- Run in Supabase SQL Editor

-- Chat threads
create table if not exists public.threads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  title text not null default 'New Chat',
  type text check (type in ('general', 'repo_analysis')) default 'general',
  metadata jsonb default '{}'::jsonb
);

-- Messages within threads
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  thread_id uuid references public.threads(id) on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null default '',
  metadata jsonb default '{}'::jsonb
);

-- Indexes
create index if not exists idx_threads_user_id on public.threads(user_id);
create index if not exists idx_threads_updated_at on public.threads(updated_at desc);
create index if not exists idx_messages_thread_id on public.messages(thread_id);

-- Auto-update thread.updated_at on new message
create or replace function public.update_thread_timestamp()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.threads
  set updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.update_thread_timestamp();

-- Row Level Security
alter table public.threads enable row level security;
alter table public.messages enable row level security;

-- RLS Policies
create policy "Users can view own threads"
  on public.threads for select
  using (auth.uid() = user_id);

create policy "Users can create threads"
  on public.threads for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own threads"
  on public.threads for delete
  using (auth.uid() = user_id);

create policy "Users can view messages in own threads"
  on public.messages for select
  using (
    exists (
      select 1 from public.threads
      where threads.id = messages.thread_id
      and threads.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own threads"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.threads
      where threads.id = messages.thread_id
      and threads.user_id = auth.uid()
    )
  );
