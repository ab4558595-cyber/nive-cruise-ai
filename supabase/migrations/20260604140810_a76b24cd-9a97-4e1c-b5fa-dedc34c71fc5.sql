
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

  -- 14-day free trial for new users
  insert into public.user_plans (user_id, plan_id, active, expires_at)
  values (new.id, 'trial', true, now() + interval '14 days')
  on conflict do nothing;

  return new;
end;
$function$;
