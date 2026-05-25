// UPI ID for receiving payments
export const UPI_ID = "8766208760@ybl";
export const UPI_PAYEE_NAME = "Cruise AI";
export const OWNER_EMAIL = "bansal.monikaji1982@gmail.com";

export type Plan = {
  id: string;
  name: string;
  price: number; // INR
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    tagline: "Try Cruise AI with limits",
    features: ["20 prompts / day", "Standard model", "Community support"],
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    period: "30 days",
    tagline: "For hobbyists and tinkerers",
    features: ["Unlimited prompts", "Priority queue", "All languages & platforms", "Email support"],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    period: "30 days",
    tagline: "For serious builders",
    features: ["Everything in Starter", "Pro reasoning model", "Long-context (1M tokens)", "Faster responses"],
  },
];

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
