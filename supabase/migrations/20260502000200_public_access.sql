-- Switch to public access for anonymous demos
-- Remove user_id requirement since we removed auth

-- Drop old policies
drop policy if exists "Users can view own threads" on public.threads;
drop policy if exists "Users can create threads" on public.threads;
drop policy if exists "Users can delete own threads" on public.threads;
drop policy if exists "Users can view messages in own threads" on public.messages;
drop policy if exists "Users can insert messages in own threads" on public.messages;

-- Remove default of auth.uid() from user_id column
alter table public.threads alter column user_id drop default;
alter table public.threads alter column user_id set default null;

-- New public policies (no auth required)
create policy "Public can view threads"
  on public.threads for select
  using (true);

create policy "Public can create threads"
  on public.threads for insert
  with check (true);

create policy "Public can delete threads"
  on public.threads for delete
  using (true);

create policy "Public can view messages"
  on public.messages for select
  using (true);

create policy "Public can insert messages"
  on public.messages for insert
  with check (true);
