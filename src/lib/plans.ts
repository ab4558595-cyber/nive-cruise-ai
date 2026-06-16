// UPI ID for receiving payments
export const UPI_ID = "8766208760@yapl";
export const UPI_PAYEE_NAME = "Nive AI";
export const OWNER_EMAIL = "bansal.monikaji1982@gmail.com";

export type ProductKey = "code";

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
};

export const PLANS: Plan[] = [
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
];

export function plansForProduct(product: ProductKey): Plan[] {
  return PLANS.filter((p) => (p.product ?? "code") === product);
}

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
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
