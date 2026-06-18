# Security hardening + big Business suite expansion

## 1. Security — fix all findings + harden surface

### 1a. Fix scanner findings (one migration)
- **`payment_requests.approval_token`** is currently readable by the owning user. Revoke column SELECT on `approval_token` from `authenticated` + `anon` (column-level `REVOKE`), and replace the `own requests read` policy with one that's still row-scoped to `auth.uid()`. Server code that needs the token already uses `service_role`.
- **`business_tool_events`** has a client INSERT policy → users can fabricate credit usage. Drop the `own events insert` policy. Only `service_role` (used by `consumeBusinessUsage`) writes; clients still SELECT their own rows for history.
- **SECURITY DEFINER pgmq wrappers** (`enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`) are callable by `authenticated` → `REVOKE EXECUTE … FROM authenticated, anon`. Keep `service_role` for the queue worker. (Email infra still works — cron job uses service role.)
- Re-verify `has_role` stays executable by `authenticated` (it has to be, for RLS policies).

### 1b. Webhook + API hardening (`src/routes/api/public/razorpay/webhook.ts`, `try-ai.ts`, `approve-payment.tsx`)
- Razorpay webhook already verifies HMAC — add timing-safe compare + **replay protection** via a new `processed_webhook_events` table (UNIQUE on `event_id`); insert before processing, ignore duplicates.
- `try-ai.ts`: add IP-based rate limit (10 req / hour / IP) using new `abuse_log` table; Zod-validate body (`max(2000)` chars, no control chars).
- `approve-payment.tsx`: confirm timing-safe token compare, add per-token attempt counter (lock after 5 fails).

### 1c. Security headers + abuse log
- New `src/middleware/security-headers.ts` registered as `requestMiddleware` in `src/start.ts`:
  - `Content-Security-Policy` (strict; allow self, supabase, openrouter, razorpay)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
- New `abuse_log` table (ip, route, hits, window_start) used by a shared `rateLimit(ip, route, max, windowSec)` helper in `src/lib/rate-limit.server.ts`. Applied to `try-ai`, `generateMarketing`, `generateSynthetic`, `purchaseBusinessTopup`.

### 1d. Auth/session polish
- Re-confirm `password_hibp_enabled` via `configure_auth`.
- Set min password length 10, OTP expiry 5 min.

## 2. Marketing Agent — 4 new modes (added to existing tabs)

In `src/lib/marketing.functions.ts` + `src/routes/business.marketing.tsx`:

| Mode | Credits | Output |
|---|---|---|
| **Competitor + SEO research** | 3 | Paste competitor URL + your niche → positioning teardown (3 strengths / 3 weaknesses), 5 keyword gaps, 20 long-tail keyword ideas with intent + difficulty estimate |
| **Email drip (5-step)** | 3 | Onboarding / re-engagement / launch templates; each step has subject, preview text, body (markdown), send-day offset, primary CTA |
| **Ad pack with platform specs** | 3 | Google (3×30/2×90), Meta (5 headlines×40 + 5 bodies×125), LinkedIn (intro≤150, headline≤70), X (≤280) — each variant validated against limit, A/B-pair tagged |
| **Landing page → HTML export** | 3 | Hero/features/FAQ/CTA — renders as preview AND downloads a single self-contained `index.html` with inline Tailwind-CDN classes |

All new modes use brand voice memory; competitor mode fetches the URL via `fetch` server-side (15s timeout, max 200 KB) and feeds the cleaned text into the prompt.

## 3. Synthetic Data — 4 new capabilities

In `src/routes/business.synthetic-data.tsx` + new `src/lib/synthetic-advanced.functions.ts`:

| Feature | Where | Cost |
|---|---|---|
| **Import schema (CSV header / SQL DDL)** | New "Import" button → modal accepts paste; client-side parses `CREATE TABLE (...)` and CSV first-row; maps to existing field types using rules + a tiny inference table (`email`→email, `_at`→datetime, `price/amount`→currency, etc.). | free / client |
| **AI-described schema** | "Describe your dataset" textarea → server fn calls Gemini, returns `{ fields: [...] }` JSON matching our schema. | 2 credits |
| **Time-series + event streams** | New mode: pick entity (users), date range, event types (signup/login/purchase…), DAU pattern (linear/exp/seasonal). Generates timestamped event log with funnel drop-off + session ids. Up to 50 000 events. | 2 credits |
| **Saved schemas + re-run** | New `saved_schemas` table (user_id, name, schema_json, kind, created_at). Sidebar list with re-run button and shareable read-only link `/business/synthetic-data/shared/:token`. | 1 credit per re-run |

## 4. Database migrations (one file)

```sql
-- finding fixes
REVOKE SELECT (approval_token) ON public.payment_requests FROM authenticated, anon;
DROP POLICY "own events insert" ON public.business_tool_events;
REVOKE EXECUTE ON FUNCTION public.enqueue_email, public.read_email_batch,
  public.delete_email, public.move_to_dlq FROM authenticated, anon;

-- abuse + replay
CREATE TABLE public.abuse_log (...);          -- ip, route, hits, window_start
CREATE TABLE public.processed_webhook_events (event_id text PK, source text, processed_at);
CREATE TABLE public.saved_schemas (...);      -- user_id, name, kind, schema_json, share_token

-- grants + RLS for the 3 new tables (server-only writes for abuse_log + webhook table,
-- user-scoped CRUD for saved_schemas; anon SELECT for shared schema via token).
```

## 5. Files

**New**
- `supabase/migrations/<ts>_security_and_business_v2.sql`
- `src/lib/rate-limit.server.ts`
- `src/middleware/security-headers.ts`
- `src/lib/synthetic-advanced.functions.ts`
- `src/components/SchemaImportDialog.tsx`
- `src/components/SavedSchemasPanel.tsx`
- `src/routes/business.synthetic-data.shared.$token.tsx`

**Edited**
- `src/start.ts` — register security-headers middleware
- `src/lib/marketing.functions.ts` — 4 new server fns
- `src/routes/business.marketing.tsx` — 4 new tabs
- `src/routes/business.synthetic-data.tsx` — import button, AI describe, time-series mode, saved-schemas sidebar
- `src/routes/api/public/razorpay/webhook.ts` — replay table, timing-safe compare
- `src/routes/api/public/try-ai.ts` — Zod + rate limit
- `src/routes/api/public/approve-payment.tsx` — attempt counter
- `src/lib/businessUsage.functions.ts` — call rate-limit helper

## 6. Verification
- Re-run security scan + linter; all errors gone.
- Manual sanity: one run per new marketing mode + new synthetic mode.
- Typecheck via auto build.

## 7. Notes / trade-offs
- Strict CSP may need tweaking for Razorpay's iframe — included `https://checkout.razorpay.com` + `https://api.razorpay.com`.
- AI-described schema may occasionally return invalid JSON → graceful fallback message; user retries free.
- Competitor URL fetch is a single GET; SPAs that need JS won't render — clearly stated in UI.
