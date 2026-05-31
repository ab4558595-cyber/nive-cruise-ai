-- Fix 1: Prevent users from reading the approval_token column on their own payment requests.
-- Revoke column-level SELECT on approval_token from authenticated and anon roles.
REVOKE SELECT (approval_token) ON public.payment_requests FROM authenticated;
REVOKE SELECT (approval_token) ON public.payment_requests FROM anon;
-- Re-grant SELECT on all other columns explicitly for authenticated (service_role keeps full access).
GRANT SELECT (id, user_id, user_email, plan_id, amount, transaction_ref, status, approved_at, created_at)
  ON public.payment_requests TO authenticated;

-- Fix 2: Block privilege escalation on user_roles.
-- Only service_role (used by server-side admin code) can insert/update/delete roles.
-- Authenticated users may continue reading their own roles via existing SELECT policy.
CREATE POLICY "no self insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "no self update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "no self delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated, anon
  USING (false);