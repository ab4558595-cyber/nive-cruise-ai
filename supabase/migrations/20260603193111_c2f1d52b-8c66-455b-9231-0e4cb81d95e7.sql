
CREATE TABLE public.business_tool_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool text NOT NULL CHECK (tool IN ('synthetic','marketing')),
  credits integer NOT NULL DEFAULT 1 CHECK (credits > 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_tool_events_user_created ON public.business_tool_events (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.business_tool_events TO authenticated;
GRANT ALL ON public.business_tool_events TO service_role;

ALTER TABLE public.business_tool_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own events read" ON public.business_tool_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.business_tool_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


CREATE TABLE public.business_credit_topups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool text NOT NULL CHECK (tool IN ('synthetic','marketing')),
  credits integer NOT NULL CHECK (credits > 0 AND credits <= 500),
  amount_inr integer NOT NULL CHECK (amount_inr >= 0),
  pack text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_credit_topups_user_day ON public.business_credit_topups (user_id, tool, day);

GRANT SELECT, INSERT ON public.business_credit_topups TO authenticated;
GRANT ALL ON public.business_credit_topups TO service_role;

ALTER TABLE public.business_credit_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own topups read" ON public.business_credit_topups
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own topups insert" ON public.business_credit_topups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
