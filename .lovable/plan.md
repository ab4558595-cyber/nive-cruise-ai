# Plan-gating audit + conversion boosters

## What I verified

I traced every plan-gated surface end-to-end:

| Surface | Where it's enforced | Status |
|---|---|---|
| Chat (Code product) — daily prompt cap & model selection | `supabase/functions/ai-code/index.ts` reads `user_plans`, applies `PLAN_CONFIG[planId]` | Partly correct |
| Multilingual / long-context features | Same edge function, system-prompt extras | Correct for code tiers |
| Synthetic data tool (Business) | `consumeBusinessUsage('synthetic')` in `src/lib/businessUsage.functions.ts` | **Gap — no plan check** |
| Marketing tool (Business) | `consumeBusinessUsage('marketing')` | **Gap — no plan check** |
| Pricing/checkout → webhook → `user_plans` | Fixed last turn | Correct |

## Gaps found

**G1 — Business plans get nothing extra.** The chat edge function has configs only for `trial / starter / pro`. A user on `biz-growth` or `biz-scale` falls back to the `trial` config (30 prompts/day, flash model). They paid ₹499/₹1499 and got worse limits than Starter.

**G2 — Business tools are open to everyone.** `consumeBusinessUsage` only checks the daily counter (20 synthetic / 15 marketing per day). A trial user, a Starter user, even a brand-new signup can use the full Business suite up to those caps. Buying `biz-growth` / `biz-scale` gives no real entitlement.

## Fix

**F1.** In `ai-code/index.ts` `PLAN_CONFIG`, add:
- `biz-growth`: 500 prompts/day, gemini-3.5-flash, multilingual, label "Growth"
- `biz-scale`: unlimited, gpt-5.5, multilingual + longContext, label "Scale"

**F2.** Add a `requireBusinessPlan(supabase, userId)` helper in `businessUsage.functions.ts`. It loads the user's active `user_plans` row and throws `403 plan_required` unless `plan_id` is `biz-growth` or `biz-scale` (admins always allowed). Call it at the top of `getBusinessUsage` and `consumeBusinessUsage`. On the Business tool pages, catch `plan_required` and render an inline "Upgrade to Growth or Scale" CTA linking to `/business/pricing` instead of the tool UI.

**F3.** Increase the per-day caps for `biz-scale` to effectively unlimited (e.g. 9999) since the plan says "unlimited synthetic data generation."

## Conversion boosters (the "attract customers" part)

Lightweight, no discount needed — these are the highest-ROI changes for a pricing page:

1. **"Most Popular" ribbon** on Pro (Code) and Growth (Business). Already partly themed via `plan.highlight` — wire the visual badge if missing.
2. **Social proof strip** at the top of `/pricing` and `/welcome`: "Trusted by indie hackers, students, and small teams across India" + a row of 3-4 short testimonials (kept honest, no fake company logos).
3. **Launch offer banner** on `/pricing`: "Launch pricing — first 100 Pro subscribers locked in at ₹299/mo for life." Static counter (we don't need a real one to start). Removable in one line when you outgrow it.
4. **"Why upgrade" comparison row** under the plan cards — three concrete value props per tier with icons (speed, unlimited prompts, multilingual, multi-file outputs).
5. **Trust footer on pricing**: "Secure checkout via Paddle · UPI, cards & wallets accepted · Cancel anytime · 14-day money-back."

I'll ask before adding (3) — claiming "first 100" requires you to honor it. If you'd rather skip, the other four still meaningfully lift conversion.

## Out of scope

- Refactoring the front-end plan-resolver into a shared hook (it works, just duplicated between `index.tsx` and the edge function — leaving for a later cleanup).
- Annual billing (none of the Paddle prices have an annual variant yet).

## Files touched

- `supabase/functions/ai-code/index.ts` — add 2 plan configs
- `src/lib/businessUsage.functions.ts` — add plan check
- `src/routes/business/*` (synthetic + marketing pages) — handle `plan_required` error
- `src/routes/pricing.tsx`, `src/routes/business.pricing.tsx` — badge, testimonials, trust strip, optional launch banner
- `src/routes/welcome.tsx` — social proof strip

## Quick question before I ship

Want me to include the "Launch pricing — first 100 Pro" banner (#3), or skip it and just do the safe stuff (#1, #2, #4, #5)?
