/**
 * Built-in marketplace catalog: first-party Nive tools and integrations.
 * Community submissions live in the `marketplace_listings` table and are
 * merged with this list at render time.
 */
export type CatalogKind = "tool" | "agent" | "integration";

export type CatalogItem = {
  key: string;
  name: string;
  tagline: string;
  kind: CatalogKind;
  category: string;
  href?: string;
  official: true;
  tags: string[];
};

export const BUILTIN_CATALOG: CatalogItem[] = [
  { key: "code-studio", name: "Code Studio", tagline: "Multi-file code generation with live preview and a real file tree.", kind: "tool", category: "Build", href: "/code", official: true, tags: ["code", "react", "python"] },
  { key: "social-manager", name: "Social Manager", tagline: "Plan, write and schedule posts with hooks, captions and hashtag sets.", kind: "tool", category: "Content", href: "/social", official: true, tags: ["social", "content"] },
  { key: "marketing-suite", name: "Marketing Suite", tagline: "19 modes: campaigns, SEO blogs, ad packs, personas, press releases.", kind: "tool", category: "Growth", href: "/business/marketing", official: true, tags: ["marketing", "copy"] },
  { key: "synthetic-data", name: "Synthetic Data", tagline: "Privacy-safe datasets: 32+ field types, locales, relational blueprints.", kind: "tool", category: "Data", href: "/business/synthetic-data", official: true, tags: ["data", "testing"] },
  { key: "voice-agents", name: "Voice Agents", tagline: "Speak a brief and get back code, copy, a call script or clean notes.", kind: "tool", category: "Build", href: "/voice", official: true, tags: ["voice", "speech"] },
  { key: "design-studio", name: "Design Studio", tagline: "Palettes, type pairings, hero direction and paste-ready CSS tokens.", kind: "tool", category: "Design", href: "/design", official: true, tags: ["design", "brand"] },
  { key: "automations", name: "Automations", tagline: "Chain steps so each output feeds the next: brief → copy → report.", kind: "tool", category: "Workflow", href: "/automations", official: true, tags: ["workflow"] },
  { key: "custom-agents", name: "Custom Agents", tagline: "Freeze prompts, skills and brand context into a reusable agent.", kind: "agent", category: "Workflow", href: "/agents", official: true, tags: ["agents"] },
  { key: "knowledge", name: "Docs & Knowledge Agent", tagline: "Summaries, grounded Q&A, wikis, FAQs, onboarding and flashcards.", kind: "agent", category: "Knowledge", href: "/knowledge", official: true, tags: ["docs", "qa"] },
  { key: "seo-studio", name: "SEO & Analytics Studio", tagline: "Clusters, audits, briefs, technical checklists, JSON-LD and reports.", kind: "tool", category: "Growth", href: "/seo", official: true, tags: ["seo", "analytics"] },
  { key: "analyst", name: "Data Analyst", tagline: "Paste a CSV: insights, SQL, cleaning plans, chart specs, forecasts.", kind: "agent", category: "Data", href: "/analyst", official: true, tags: ["data", "sql"] },
  { key: "support-agent", name: "Support & Email Agent", tagline: "Ticket replies, macros, escalations, tone rewrites, KB articles.", kind: "agent", category: "Support", href: "/support", official: true, tags: ["support", "email"] },
  { key: "legal-agent", name: "Legal & Policy Agent", tagline: "Draft policies, review clauses, and turn contracts into plain English.", kind: "agent", category: "Operations", href: "/legal", official: true, tags: ["legal", "policy"] },
  { key: "product-agent", name: "Product & PRD Studio", tagline: "PRDs, user stories, roadmaps, RICE scoring and release notes.", kind: "agent", category: "Product", href: "/product", official: true, tags: ["product", "prd"] },
  { key: "translate-agent", name: "Translation & Localization", tagline: "Translate, localise, transcreate and QA copy across markets.", kind: "agent", category: "Content", href: "/translate", official: true, tags: ["i18n", "translation"] },
  { key: "hr-agent", name: "People & Hiring Agent", tagline: "Job posts, scorecards, interview kits, offers and onboarding plans.", kind: "agent", category: "Operations", href: "/hr", official: true, tags: ["hiring", "hr"] },

  // Integrations
  { key: "int-razorpay", name: "Razorpay Payments", tagline: "INR checkout for Nive plans with webhook-driven plan activation.", kind: "integration", category: "Payments", href: "/pricing", official: true, tags: ["payments", "inr"] },
  { key: "int-embed", name: "Iframe Embed", tagline: "Embed any Nive studio inside your own product or intranet page.", kind: "integration", category: "Platform", href: "/docs/embedding", official: true, tags: ["embed", "iframe"] },
  { key: "int-public-api", name: "Public API", tagline: "Call Nive endpoints from your own backend, cron jobs or webhooks.", kind: "integration", category: "Platform", href: "/docs/api", official: true, tags: ["api", "webhook"] },
  { key: "int-google-auth", name: "Google Sign-in", tagline: "One-tap Google authentication for your Nive workspace account.", kind: "integration", category: "Auth", href: "/auth", official: true, tags: ["auth", "google"] },
  { key: "int-apple-auth", name: "Apple Sign-in", tagline: "Sign in with Apple, including private-relay email addresses.", kind: "integration", category: "Auth", href: "/auth", official: true, tags: ["auth", "apple"] },
];

export const CATALOG_CATEGORIES = Array.from(
  new Set(BUILTIN_CATALOG.map((i) => i.category)),
).sort();
