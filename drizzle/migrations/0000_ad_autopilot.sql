CREATE TABLE public.ad_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','meta')),
  account_id text,
  account_name text,
  refresh_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT ALL ON public.ad_connections TO service_role;
ALTER TABLE public.ad_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ad_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ad_oauth_states TO service_role;
ALTER TABLE public.ad_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ad_campaign_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal text NOT NULL,
  landing_url text NOT NULL,
  currency text NOT NULL,
  total_budget numeric NOT NULL,
  days integer NOT NULL,
  plan jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','launching','launched','failed','paused')),
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_campaign_runs TO authenticated;
GRANT ALL ON public.ad_campaign_runs TO service_role;
ALTER TABLE public.ad_campaign_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own campaign runs readable" ON public.ad_campaign_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);