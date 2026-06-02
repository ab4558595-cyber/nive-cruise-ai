# Sitemap status monitoring with email alerts

A daily background job that polls Google Search Console for sitemap status on `nive-ai.co.in` and `www.nive-ai.co.in`, stores snapshots, and emails you the moment anything changes.

## What gets built

**1. Database table** `sitemap_status_snapshots`
Stores one row per check per site. Columns: `id`, `site_url`, `sitemap_url`, `is_pending`, `is_sitemaps_index`, `last_submitted`, `last_downloaded`, `warnings`, `errors`, `indexed_pages` (when GSC exposes it), `raw_payload` (jsonb), `checked_at`. RLS: admin-only read; service role inserts.

**2. Cron endpoint** `/api/public/hooks/check-sitemap-status`
Server route (TanStack) that:
- Calls GSC `GET /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}` for both sites via the connector gateway.
- Loads the previous snapshot per site, diffs the status fields.
- If anything changed (errors went up/down, warnings appeared, last_downloaded changed, sitemap missing), sends an email to `bansal.monikaji1982@gmail.com` summarizing the diff.
- Inserts a new snapshot row regardless.
- Returns `{ ok, changes: [...] }` for debugging.

**3. pg_cron schedule** — daily at 06:00 UTC, hits the endpoint with the project's anon key.

**4. Admin page** `/admin/seo` (gated by existing admin role) — table of recent snapshots, current sitemap status badge, "Run check now" button.

## Email delivery — needs a one-time setup

Sending email from your app requires a verified sender domain. Two paths:

- **Lovable Emails (recommended)** — uses `notify.nive-ai.co.in`. Requires adding two NS records at GoDaddy (one-time, then auto). Free, fully integrated, queue + retry built in.
- **Resend connector** — if you'd prefer Resend, I'll wire it through the gateway instead. You'd need a Resend account and verified domain there.

I'll proceed with **Lovable Emails** unless you say otherwise — it'll prompt you for the DNS setup mid-flow.

## Technical notes

- GSC sitemap endpoint returns `lastSubmitted`, `lastDownloaded`, `warnings`, `errors`, `isPending`, `isSitemapsIndex`, and a `contents` array with per-content-type indexed/submitted counts. We snapshot all of it.
- Diff logic compares the last two rows per `site_url` and triggers an alert if any monitored field differs (with a clear before→after summary in the email body).
- Cron auth: `apikey` header with `SUPABASE_ANON_KEY` — no new shared secret.
- The endpoint is idempotent and safe to call manually for testing.

## Out of scope (your earlier answers)

Skipping indexed page count, search query swings, and crawl errors — only sitemap status as requested.

After you approve, the first thing I'll do is open the email domain setup dialog. Once DNS is in, the monitor goes live and you'll get the first daily snapshot the next morning.