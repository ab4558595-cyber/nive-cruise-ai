## Add 10 new features to the Marketing Suite

The Marketing Suite currently has 9 modes (marketing copy, campaign, blog, strategy, hero wireframe, competitor + SEO, email drip, ad pack, landing HTML). I'll add 10 more, each as a new tab with its own panel, server function, and credit cost.

### The 10 new features

1. **Social Calendar (30-day)** — generates a 30-day posting plan with platform, hook, caption, hashtags, best-time slot, and CTA per day. Exports CSV. *(3 credits)*

2. **YouTube / Reels Script** — pick length (30s / 60s / 3min); returns hook, beat-by-beat shot list, on-screen text, voiceover, B-roll suggestions, and a thumbnail concept. *(2 credits)*

3. **Press Release** — AP-style release with dateline, boilerplate, quote block, and media contact. Generates plain-text + HTML versions. *(2 credits)*

4. **Cold Outreach (sales email + LinkedIn)** — 3-variant cold email sequence + matching LinkedIn connection notes and follow-ups, tuned to a target persona + value prop. *(3 credits)*

5. **Brand Voice Guidelines** — derives tone, do/don't word lists, sample rewrites, and a one-page style guide from the saved brand profile or a sample paragraph. *(2 credits)*

6. **Customer Persona Builder** — generates 3 personas (demographics, jobs-to-be-done, pains, gains, channels, objections) from product description + audience hints. *(2 credits)*

7. **A/B Test Variants** — paste a headline, ad, subject line, or CTA → returns 8 ranked variants with rationale and a hypothesis to test. *(1 credit)*

8. **SEO Meta Pack** — paste a URL or topic → 10 title-tag options (≤60 chars), 10 meta descriptions (≤160), Open Graph block, Twitter card, JSON-LD snippet. *(2 credits)*

9. **Pricing Page Copy** — generates 3 tiers (name, tagline, monthly/annual, 5–7 feature bullets, CTA) + FAQ + comparison table. *(2 credits)*

10. **Case Study Draft** — turns customer-name + outcome bullets into a structured case study (challenge, solution, results with metrics, pull-quote, CTA). *(3 credits)*

### Technical details

- **Server functions** in `src/lib/marketing.functions.ts`: `generateSocialCalendar`, `generateVideoScript`, `generatePressRelease`, `generateColdOutreach`, `generateBrandVoice`, `generatePersonas`, `generateABVariants`, `generateSeoMeta`, `generatePricingCopy`, `generateCaseStudy`. Each uses Lovable AI Gateway (`google/gemini-3-flash-preview`) with `generateText` + `Output.object` for structured JSON, and calls `consumeBusinessUsage` with the listed credit cost.
- **UI** in `src/routes/business.marketing.tsx`: add 10 tabs (collapsed into a "More" dropdown if the tab row overflows), each with an input form + result card. Reuses existing `ResultShell`, copy-to-clipboard, and download patterns.
- **Exports**: Social Calendar → CSV download; Press Release → `.txt` + `.html`; Case Study → Markdown.
- **Cost protection**: every new function calls `requireSupabaseAuth` middleware and `consumeBusinessUsage` before the model call (same pattern as existing modes).
- **No DB migrations** required — all features are stateless generations. Results are not persisted unless the user explicitly hits "Save to brand profile" (where applicable).

### Files

- Edit `src/lib/marketing.functions.ts` (+10 server functions, ~600 lines)
- Edit `src/routes/business.marketing.tsx` (+10 tab panels)

Want me to adjust the list — swap any feature out or rebalance credit costs — before I build?
