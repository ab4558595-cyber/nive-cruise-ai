## Remove the old `/pricing` (coding-assistant) page

The old AI-coding pricing page at `src/routes/pricing.tsx` is obsolete — the Business Suite has its own `/business/pricing`. Delete the file and repoint every remaining link to `/business/pricing`.

### Changes

1. **Delete** `src/routes/pricing.tsx` (the router plugin will auto-regenerate `routeTree.gen.ts`).
2. **Repoint links** from `/pricing` → `/business/pricing` in:
   - `src/routes/checkout.$planId.tsx` (line 55 — "Back to pricing" on unknown-plan screen)
   - `src/routes/checkout.$planId.tsx` (line 106 — header "Back to pricing")
   - `src/routes/founder.tsx` (line 71 — "See pricing" CTA)
   - `src/components/LivePreview.tsx` (line 368 — "See plans" upsell button)

No DB, no other route, no nav changes needed (business nav already uses `/business/pricing`). Sitemap is already clean.
