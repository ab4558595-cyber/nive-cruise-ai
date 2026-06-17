# Upgrade Marketing Agent + Synthetic Data

## 1. Marketing Agent — multi-mode generator

Convert `business.marketing.tsx` from a single "headline+body" tool into a tabbed workspace with five modes, each backed by its own server fn in `src/lib/marketing.functions.ts` (shared OpenRouter helper, shared usage accounting via `consumeBusinessUsage` so credits stay consistent).

**Modes**
1. **Quick copy** — current flow (headline + 5 variants + body + CTA). 1 credit.
2. **Full campaign pack** — one run produces: 5 ad headlines, 3 ad bodies (Google/Meta-sized), 5 email subject lines + 1 email body, 3 social posts (Twitter ≤270c, LinkedIn ≤900c, Instagram caption + 8 hashtags), 1 landing hero (h1, subhead, 3 bullets, CTA). 3 credits.
3. **SEO blog writer** — title, meta description (≤155c), slug, H2/H3 outline, 700–1000 word markdown body, FAQ block (3 Qs), suggested internal-link anchors. 3 credits.
4. **Marketing strategy** — 30-day go-to-market plan: positioning statement, 3 target segments, channel mix with weekly cadence, 5 content pillars, KPI table, week-by-week action list. 2 credits.
5. **Hero image + landing wireframe** — calls Lovable AI image model (`google/gemini-2.5-flash-image`) for one hero image (returned as base64 → blob URL, downloadable), plus a JSON wireframe (sections: hero, social proof, 3 feature blocks, pricing teaser, FAQ, footer-CTA) rendered as a stacked preview. 2 credits (1 text + image).

**Brand voice memory** (new table `brand_profiles`)
- Fields: `user_id` (PK), `brand_name`, `voice`, `audience`, `usp`, `keywords`, `forbidden_words`, `updated_at`.
- New "Brand voice" drawer on the marketing page to save/edit. Auto-injected into every prompt when present.
- New server fns `getBrandProfile` / `saveBrandProfile` (auth-gated).

**UI**
- Tabs across the top of `business.marketing.tsx`: Quick · Campaign · Blog · Strategy · Hero & wireframe · Brand voice.
- Each result panel gets its own renderer (markdown for blog/strategy, image preview for hero, structured cards for campaign pack).
- Copy/Download per block (already exists for Quick — extended to other modes; downloads `.md` for blog/strategy, `.png` for hero, `.json` for wireframe, `.txt` for campaign).
- Loading + error states reuse existing `Block` component.

## 2. Synthetic Data — bigger, richer, relational

Rewrite `business.synthetic-data.tsx` (UI) and create `src/lib/synthetic.functions.ts` for the new relational generator (kept client-side for single-table — fast and free; relational is server-side because it requires deterministic cross-table joins and counts as 1 credit per call).

**Schema builder upgrades**
- Up to **24 fields** (was 12).
- New field types: `uuid`, `username`, `company`, `job_title`, `country`, `state`, `zip`, `street`, `lat`, `lng`, `currency_inr`, `currency_usd`, `currency_eur`, `percent`, `rating_1_5`, `iso_datetime`, `url`, `ipv4`, `paragraph`, `tag` (custom enum), `int_range`, `float_range`.
- Locale selector: **India / US / EU / Global** — swaps first/last name pools, city/state lists, phone format, currency, postal code.
- Optional per-field config (modal): nullable %, custom enum values, min/max for numbers, date range.

**Volume + export**
- Rows: up to **5000** for single-table (already supported), default 100.
- Export buttons: **CSV**, **JSON**, **NDJSON**, **SQL INSERT** (asks for table name), **Markdown table** preview.
- Streaming download for >1000 rows (build CSV/SQL via `Blob` chunks).

**Relational mode (new toggle)**
- Preset blueprints: `SaaS users + workspaces + subscriptions`, `E-commerce customers + orders + line_items + products`, `Support tickets + agents + messages`, `Healthcare patients + appointments + providers`, `Finance accounts + transactions`.
- Generator produces 2–4 linked tables with valid FK ids and realistic distributions (e.g. 1 user → 0–8 orders, each order → 1–5 line items).
- Output: a zip-like multi-file download — emits one combined `.sql` (CREATE TABLE + INSERT) and per-table CSVs in a single `.zip` (use `jszip`).
- Counts as **2 credits** per run.

**Presets expansion**
- Add: SaaS users, Subscriptions, Tickets, Patients, Transactions, Products, Inventory, Employees — alongside existing Customers / Orders / Users (auth).

## 3. Limits + Pro multiplier

Edit `src/lib/businessUsage.functions.ts`:
- Raise base daily limits: `synthetic: 40` (was 20), `marketing: 30` (was 15).
- Add **plan multiplier**: `biz-growth` → ×2 (so 80 / 60), `biz-scale`/admin already unlimited (unchanged at 9999).
- `loadUsage` returns the multiplied effective limit; `UsageBadge` already displays `limit` correctly.
- Heavy modes consume more credits per run (campaign 3, blog 3, strategy 2, hero+wireframe 2, relational 2) — enforced by passing an optional `credits` param to `consumeBusinessUsage` (default 1). Adds `credits` to the upsert math and to the event log.

## 4. Database migration

Single migration:
```sql
CREATE TABLE public.brand_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name text, voice text, audience text, usp text,
  keywords text[] DEFAULT '{}', forbidden_words text[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_profiles TO authenticated;
GRANT ALL ON public.brand_profiles TO service_role;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own brand" ON public.brand_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## 5. Files touched

**New**
- `src/lib/marketing.functions.ts` — add `generateCampaign`, `generateBlog`, `generateStrategy`, `generateHeroWireframe`, `getBrandProfile`, `saveBrandProfile`.
- `src/lib/synthetic.functions.ts` — `generateRelationalDataset` server fn.
- `src/components/BrandVoiceDrawer.tsx`
- `src/components/MarketingTabs.tsx` (or inlined in the route)

**Edited**
- `src/routes/business.marketing.tsx` — tabbed UI, all 5 modes, brand voice drawer.
- `src/routes/business.synthetic-data.tsx` — new field types, locale picker, relational toggle, expanded presets, new exports (CSV/JSON/NDJSON/SQL/Markdown/zip).
- `src/lib/businessUsage.functions.ts` — raised limits, plan multiplier, optional `credits` arg on `consumeBusinessUsage`.
- `src/routes/business.index.tsx` — update feature bullets to mention new capabilities.

**Dependency**
- `bun add jszip` for relational zip export.

## 6. Verification
- Typecheck passes (build runs automatically).
- Manually generate one run per marketing mode and one relational dataset to confirm credit math and downloads work.
