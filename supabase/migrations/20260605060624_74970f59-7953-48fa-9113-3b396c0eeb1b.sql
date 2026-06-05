
-- 1. Revoke SELECT on approval_token from end users
REVOKE SELECT (approval_token) ON public.payment_requests FROM authenticated, anon;

-- 2. Drop client INSERT policy on business_credit_topups (server-only writes)
DROP POLICY IF EXISTS "own topups insert" ON public.business_credit_topups;

-- 3. Drop client INSERT/UPDATE policies on business_tool_usage (server-only writes)
DROP POLICY IF EXISTS "own usage insert" ON public.business_tool_usage;
DROP POLICY IF EXISTS "own usage update" ON public.business_tool_usage;

-- 4. Restrict has_role SECURITY DEFINER function execution to service_role only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
