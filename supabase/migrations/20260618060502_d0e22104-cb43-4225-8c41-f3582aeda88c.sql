-- 1. Fix: payment_requests.approval_token must not be readable by end users
REVOKE SELECT (approval_token) ON public.payment_requests FROM authenticated;
REVOKE SELECT (approval_token) ON public.payment_requests FROM anon;

-- 2. Fix: clients must not insert business_tool_events (credit accounting bypass)
DROP POLICY IF EXISTS "own events insert" ON public.business_tool_events;
-- service_role inserts via consumeBusinessUsage; SELECT policy for own rows kept intact.

-- 3. Fix: SECURITY DEFINER pgmq wrappers must not be executable by signed-in users
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 4. Abuse log: per-IP per-route rolling counters (server-only)
CREATE TABLE public.abuse_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  route text NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ip, route, window_start)
);
CREATE INDEX abuse_log_ip_route_idx ON public.abuse_log (ip, route, window_start DESC);
GRANT ALL ON public.abuse_log TO service_role;
ALTER TABLE public.abuse_log ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: table is server-only.

-- 5. Webhook replay protection
CREATE TABLE public.processed_webhook_events (
  event_id text PRIMARY KEY,
  source text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.processed_webhook_events TO service_role;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: server-only via service_role.

-- 6. Saved synthetic-data schemas (user-scoped, optional anon read via share_token)
CREATE TABLE public.saved_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'tabular',  -- tabular | relational | timeseries
  schema_json jsonb NOT NULL,
  share_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saved_schemas_user_idx ON public.saved_schemas (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_schemas TO authenticated;
GRANT SELECT ON public.saved_schemas TO anon;  -- restricted by policy below
GRANT ALL ON public.saved_schemas TO service_role;
ALTER TABLE public.saved_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own schemas"
  ON public.saved_schemas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anon may read ONLY rows that have an active share_token (caller must filter by token).
CREATE POLICY "shared via token"
  ON public.saved_schemas
  FOR SELECT TO anon
  USING (share_token IS NOT NULL);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER saved_schemas_touch
  BEFORE UPDATE ON public.saved_schemas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
