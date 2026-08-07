// UPI ID for receiving payments
export const UPI_ID = "8766208760@yapl";
export const UPI_PAYEE_NAME = "Nive AI";
export const OWNER_EMAIL = "bansal.monikaji1982@gmail.com";

export type ProductKey = "code" | "business" | "credits";

export type Plan = {
  id: string;
  product?: ProductKey;
  name: string;
  price: number; // INR
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  /** Credits granted when the payment is captured. */
  credits?: number;
  /** One-off credit pack (never expires) vs 30-day plan. */
  kind?: "plan" | "pack";
};

export const CREDIT_PLANS: Plan[] = [
  {
    id: "credits-starter",
    product: "credits",
    kind: "plan",
    name: "Starter",
    price: 199,
    period: "30 days",
    credits: 1500,
    tagline: "Solo builders automating a few jobs a week",
    features: [
      "1,500 credits every 30 days",
      "All 16 Nive studios + Code Studio",
      "Autopilot agent runs (multi-step)",
      "Synthetic datasets & exports",
      "Marketplace agents",
      "Email support",
    ],
  },
  {
    id: "credits-pro",
    product: "credits",
    kind: "plan",
    name: "Pro",
    price: 499,
    period: "30 days",
    credits: 4500,
    tagline: "Daily automation for teams and freelancers",
    features: [
      "4,500 credits every 30 days",
      "Everything in Starter",
      "Priority model queue",
      "Brand voice memory + custom agents",
      "Longer autopilot runs",
      "Priority email support",
    ],
    highlight: true,
    badge: "Most popular",
  },
  {
    id: "credits-scale",
    product: "credits",
    kind: "plan",
    name: "Scale",
    price: 1499,
    period: "30 days",
    credits: 16000,
    tagline: "Agencies and data teams running Nive all day",
    features: [
      "16,000 credits every 30 days",
      "Everything in Pro",
      "Unlimited saved agents & workflows",
      "Bulk synthetic generation",
      "Multi-brand workspaces",
      "Dedicated onboarding",
    ],
  },
];

export const CREDIT_PACKS: Plan[] = [
  {
    id: "pack-600",
    product: "credits",
    kind: "pack",
    name: "600 credits",
    price: 99,
    period: "never expires",
    credits: 600,
    tagline: "Small top-up",
    features: [],
  },
  {
    id: "pack-2000",
    product: "credits",
    kind: "pack",
    name: "2,000 credits",
    price: 299,
    period: "never expires",
    credits: 2000,
    tagline: "Best value top-up",
    features: [],
    highlight: true,
  },
  {
    id: "pack-8000",
    product: "credits",
    kind: "pack",
    name: "8,000 credits",
    price: 999,
    period: "never expires",
    credits: 8000,
    tagline: "Bulk top-up",
    features: [],
  },
];

/** Legacy plans kept resolvable so old checkout links and stored plans still work. */
export const LEGACY_PLANS: Plan[] = [

  {
    id: "starter",
    product: "code",
    name: "Starter",
    price: 149,
    period: "30 days",
    tagline: "For hobbyists and tinkerers",
    features: [
      "200 prompts / day",
      "Faster Gemini 3.5 Flash model",
      "Reply in ANY language (Tamil, Hindi, Spanish…)",
      "All platforms (web, mobile, embedded, ML)",
      "Live preview + Code/Preview toggle",
      "Email support",
    ],
    highlight: true,
  },
  {
    id: "pro",
    product: "code",
    name: "Pro",
    price: 299,
    period: "30 days",
    tagline: "For serious builders",
    features: [
      "Unlimited prompts",
      "Gemini 3.1 Pro reasoning model",
      "Long-context (1M tokens) for big codebases",
      "Multi-file project outputs",
      "Multilingual + priority queue",
      "Highest-quality production-grade code",
    ],
  },
  // ===== Nive AI for Business =====
  {
    id: "biz-growth",
    product: "business",
    name: "Growth",
    price: 499,
    period: "30 days",
    tagline: "For small teams and marketers",
    features: [
      "50,000 synthetic rows / month",
      "Unlimited marketing copy generation",
      "5 brand voices + tone presets",
      "Ad, email & social variants",
      "CSV / JSON / Parquet export",
      "Priority email support",
    ],
    highlight: true,
  },
  {
    id: "biz-scale",
    product: "business",
    name: "Scale",
    price: 1499,
    period: "30 days",
    tagline: "For data teams and agencies",
    features: [
      "Unlimited synthetic data generation",
      "Schema-aware structured datasets",
      "Bias & privacy guardrails (PII scrubbing)",
      "Full marketing campaign generator",
      "Multi-brand workspaces",
      "API access + webhook integrations",
      "Dedicated onboarding",
    ],
  },
];

export const PLANS: Plan[] = [...CREDIT_PLANS, ...CREDIT_PACKS, ...LEGACY_PLANS];

export function plansForProduct(product: ProductKey): Plan[] {
  return PLANS.filter((p) => (p.product ?? "code") === product);
}

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Credits granted for a purchased plan/pack id (0 for legacy plans). */
export function creditsForPlan(id: string): number {
  return getPlan(id)?.credits ?? 0;
}



export function buildUpiUri(amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export function qrImageUrl(data: string, size = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
