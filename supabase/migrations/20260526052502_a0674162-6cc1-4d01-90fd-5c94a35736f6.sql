
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now()
);

create index usage_logs_user_day_idx on public.usage_logs (user_id, day);

alter table public.usage_logs enable row level security;

create policy "own usage read" on public.usage_logs
  for select using (auth.uid() = user_id);

create policy "admin read all usage" on public.usage_logs
  for select using (has_role(auth.uid(), 'admin'::app_role));

create policy "own usage insert" on public.usage_logs
  for insert with check (auth.uid() = user_id);
