
CREATE TABLE public.business_tool_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool TEXT NOT NULL CHECK (tool IN ('synthetic','marketing')),
  day DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc'::text))::date,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool, day)
);

GRANT SELECT, INSERT, UPDATE ON public.business_tool_usage TO authenticated;
GRANT ALL ON public.business_tool_usage TO service_role;

ALTER TABLE public.business_tool_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own usage read"
ON public.business_tool_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "own usage insert"
ON public.business_tool_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own usage update"
ON public.business_tool_usage
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_business_tool_usage_user_day ON public.business_tool_usage(user_id, day);
