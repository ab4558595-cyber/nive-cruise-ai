export type DocEntry = { slug: string; title: string; description: string };
export type DocGroup = { group: string; items: DocEntry[] };

/** Sidebar order === prev/next order. Slug "" is the docs home. */
export const DOC_NAV: DocGroup[] = [
  {
    group: "Getting started",
    items: [
      { slug: "overview", title: "Overview", description: "What Nive AI is, how the ecosystem fits together, and which tool to reach for." },
      { slug: "quickstart", title: "Quickstart", description: "Create an account and ship your first output in under two minutes." },
      { slug: "accounts", title: "Accounts & auth", description: "Sign-up, Google OAuth, sessions, password reset and account deletion." },
      { slug: "credits", title: "Credits & limits", description: "How daily credits work, what each mode costs, and how limits reset." },
    ],
  },
  {
    group: "Build",
    items: [
      { slug: "code-studio", title: "Code Studio", description: "Multi-file code generation, presets, file tree, live preview and shortcuts." },
      { slug: "social", title: "Social Manager", description: "Plan, write and schedule posts with hooks, captions and hashtag sets." },
      { slug: "marketing", title: "Marketing Suite", description: "All 19 marketing modes, brand voice memory and export formats." },
      { slug: "synthetic-data", title: "Synthetic Data", description: "Field types, locales, relational blueprints, imports and exports." },
    ],
  },
  {
    group: "Studios",
    items: [
      { slug: "voice", title: "Voice Agents", description: "Speak a brief, get code, copy, a call script or structured notes." },
      { slug: "design", title: "Design Studio", description: "Palettes, type pairings, hero direction, section maps and CSS tokens." },
      { slug: "automations", title: "Automations", description: "Chain steps so each one reads the previous output." },
      { slug: "agents", title: "Custom Agents", description: "Reusable agents with instructions, brand context and skills." },
      { slug: "knowledge", title: "Docs & Knowledge Agent", description: "Summaries, grounded Q&A, wikis, FAQs, onboarding and flashcards." },
      { slug: "seo", title: "SEO & Analytics Studio", description: "Clusters, audits, briefs, technical checklists, JSON-LD and reports." },
      { slug: "analyst", title: "Data Analyst", description: "Insights, SQL, cleaning plans, chart specs, stats and forecasts." },
      { slug: "support", title: "Support & Email Agent", description: "Replies, macros, escalations, tone rewrites and help-centre articles." },
    ],
  },
  {
    group: "Platform",
    items: [
      { slug: "billing", title: "Plans & billing", description: "INR plans, Razorpay checkout, activation, webhooks and troubleshooting." },
      { slug: "security", title: "Security", description: "RLS, roles, rate limits, headers, webhook replay protection, disclosure." },
      { slug: "embedding", title: "Embedding Nive", description: "Iframe embedding, CSP frame-ancestors and storage-partitioning notes." },
      { slug: "api", title: "Public API", description: "Public endpoints, request/response shapes, rate limits and errors." },
      { slug: "architecture", title: "Architecture", description: "Edge runtime, server functions, data model and AI routing." },
      { slug: "troubleshooting", title: "Troubleshooting", description: "Common errors and the fastest path to a fix." },
      { slug: "faq", title: "FAQ", description: "Data usage, refunds, plan expiry, self-hosting and support." },
    ],
  },
];

export const DOC_FLAT: DocEntry[] = DOC_NAV.flatMap((g) => g.items);

export function docNeighbours(slug: string) {
  const i = DOC_FLAT.findIndex((d) => d.slug === slug);
  return { prev: i > 0 ? DOC_FLAT[i - 1] : null, next: i >= 0 && i < DOC_FLAT.length - 1 ? DOC_FLAT[i + 1] : null };
}

export function docEntry(slug: string): DocEntry {
  return DOC_FLAT.find((d) => d.slug === slug) ?? { slug, title: "Documentation", description: "Nive AI documentation." };
}

export function docHead(slug: string) {
  const e = docEntry(slug);
  const title = `${e.title} — Nive AI Docs`;
  return {
    meta: [
      { title },
      { name: "description", content: e.description },
      { property: "og:title", content: title },
      { property: "og:description", content: e.description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `/docs/${slug}` }],
  };
}
