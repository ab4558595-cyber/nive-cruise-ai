import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nive AI" },
      { name: "description", content: "Simple, affordable plans for Nive AI — pay with UPI. Free trial, Starter at ₹49/month, and Pro at ₹149/month for unlimited prompts." },
      { property: "og:title", content: "Nive AI Pricing — Free, Starter & Pro plans" },
      { property: "og:description", content: "Compare Nive AI plans. Start free, upgrade for higher limits, faster models, and unlimited prompts. UPI payments accepted." },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
    scripts: PLANS.filter((p) => p.price > 0).map((p) => ({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: `Nive AI ${p.name}`,
        description: p.tagline,
        brand: { "@type": "Brand", name: "Nive AI" },
        offers: {
          "@type": "Offer",
          price: p.price.toString(),
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
      }),
    })),
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <div className="relative min-h-screen px-4 py-10 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-surface)" }} />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-brand)" }} />

      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to chat
        </Link>

        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Choose your <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.2_320)] bg-clip-text text-transparent">plan</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Pay securely with UPI. Access unlocks after the owner verifies your payment.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-card/60 p-6 backdrop-blur-md transition-all hover:-translate-y-1 ${
                plan.highlight ? "border-primary/60 shadow-[var(--shadow-glow)]" : "border-border/60"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">₹{plan.price}</span>
                <span className="text-sm text-muted-foreground">/ {plan.period}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              {plan.price === 0 ? (
                <Button asChild variant="outline" className="mt-6">
                  <Link to="/">Use free</Link>
                </Button>
              ) : (
                <Button asChild className="mt-6 text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
                  <Link to="/checkout/$planId" params={{ planId: plan.id }}>Choose {plan.name}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          After payment, your access is activated once the owner approves your request.
        </p>
      </div>
    </div>
  );
}
