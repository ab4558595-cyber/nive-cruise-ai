CREATE TABLE public.credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_granted integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_wallets TO authenticated;
GRANT ALL ON public.credit_wallets TO service_role;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.credit_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  tool text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  balance_after integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_ledger_user_created ON public.credit_ledger(user_id, created_at DESC);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger read" ON public.credit_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.grant_credits(_user_id uuid, _amount integer, _reason text, _tool text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_balance integer;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'grant amount must be positive'; END IF;
  INSERT INTO public.credit_wallets (user_id, balance, lifetime_granted)
  VALUES (_user_id, _amount, _amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.credit_wallets.balance + _amount,
        lifetime_granted = public.credit_wallets.lifetime_granted + _amount,
        updated_at = now()
  RETURNING balance INTO new_balance;

  INSERT INTO public.credit_ledger (user_id, delta, reason, tool, metadata, balance_after)
  VALUES (_user_id, _amount, _reason, _tool, COALESCE(_metadata, '{}'::jsonb), new_balance);
  RETURN new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _amount integer, _reason text, _tool text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_balance integer;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'spend amount must be positive'; END IF;
  INSERT INTO public.credit_wallets (user_id, balance) VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credit_wallets
     SET balance = balance - _amount,
         lifetime_spent = lifetime_spent + _amount,
         updated_at = now()
   WHERE user_id = _user_id AND balance >= _amount
  RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  INSERT INTO public.credit_ledger (user_id, delta, reason, tool, metadata, balance_after)
  VALUES (_user_id, -_amount, _reason, _tool, COALESCE(_metadata, '{}'::jsonb), new_balance);
  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_credits(uuid, integer, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer, text, text, jsonb) TO service_role;

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

  insert into public.user_plans (user_id, plan_id, active, expires_at)
  values (new.id, 'trial', true, now() + interval '14 days')
  on conflict do nothing;

  perform public.grant_credits(new.id, 200, 'signup_bonus', null, '{}'::jsonb);

  return new;
end;
$function$;