-- Grant every new user a 1-day free trial automatically.
-- This replaces the perpetual "free" plan with a time-boxed trial for new users only.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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

  -- 1-day free trial for new users (skip if they're admin / already have a plan)
  insert into public.user_plans (user_id, plan_id, active, expires_at)
  values (new.id, 'trial', true, now() + interval '1 day')
  on conflict do nothing;

  return new;
end;
$function$;

-- Make sure the trigger exists on auth.users (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();