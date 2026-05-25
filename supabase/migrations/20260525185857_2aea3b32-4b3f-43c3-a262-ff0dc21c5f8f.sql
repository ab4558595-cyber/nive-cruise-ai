
-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Auto-create profile + grant admin to owner email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  if new.email = 'bansal.monikaji1982@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Payment requests
create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  plan_id text not null,
  amount numeric(10,2) not null,
  transaction_ref text not null,
  status text not null default 'pending',
  approval_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
alter table public.payment_requests enable row level security;
create policy "own requests read" on public.payment_requests for select using (auth.uid() = user_id);
create policy "own requests insert" on public.payment_requests for insert with check (auth.uid() = user_id);
create policy "admin read all" on public.payment_requests for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin update all" on public.payment_requests for update using (public.has_role(auth.uid(), 'admin'));

-- User plans (active subscriptions)
create table public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id text not null,
  active boolean not null default true,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.user_plans enable row level security;
create policy "own plan read" on public.user_plans for select using (auth.uid() = user_id);
create policy "admin manage plans" on public.user_plans for all using (public.has_role(auth.uid(), 'admin'));
