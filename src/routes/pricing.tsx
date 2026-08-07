import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, ArrowLeft, Zap, Bot, Database, Sparkles, Infinity as InfinityIcon } from "lucide-react";
import { CREDIT_PLANS, CREDIT_PACKS } from "@/lib/plans";
import { CREDIT_COSTS } from "@/lib/credit-costs";
import { getCreditWallet } from "@/lib/credits.functions";
import { supabase } from "@/integrations/supabase/client";
import { LegalFooter } from "@/components/LegalFooter";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Credits & Pricing — Nive AI" },
      {
        name: "description",
        content:
          "One credit wallet powers every Nive AI tool — code, marketing, synthetic data, autopilot agents. Plans from ₹199 or top-up packs that never expire. Pay with UPI.",
      },
      { property: "og:title", content: "Nive AI Pricing — one wallet, every tool" },
      {
        property: "og:description",
        content:
          "Buy credits once and spend them across all 16 Nive studios and autonomous agent runs. Plans from ₹199/30 days.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
    scripts: [...CREDIT_PLANS, ...CREDIT_PACKS].map((p) => ({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: `Nive AI — ${p.name}`,
        description: `${p.credits} Nive credits. ${p.tagline}`,
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

const COST_ROWS: Array<{ label: string; cost: number; icon: typeof Zap }> = [
  { label: "Marketing / copy generation", cost: CREDIT_COSTS.marketing, icon: Sparkles },
  { label: "Studio task (SEO, legal, support, analyst…)", cost: CREDIT_COSTS.studio_mode, icon: Bot },
  { label: "Synthetic dataset run", cost: CREDIT_COSTS.synthetic, icon: Database },
  { label: "Design concept + brand kit", cost: CREDIT_COSTS.design_concept, icon: Sparkles },
  { label: "Workflow step (automations)", cost: CREDIT_COSTS.automation_step, icon: Zap },
  { label: "Autopilot run (plan → research → draft → critique → deliver)", cost: CREDIT_COSTS.autopilot, icon: InfinityIcon },
];

function Pricing() {
  const fetchWallet = useServerFn(getCreditWallet);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      try {
        const w = await fetchWallet();
        if (!cancelled) setBalance(w.balance);
      } catch {
        /* not signed in / no wallet yet */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#070b16] text-white"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <div className="pointer-events-none absolute -left-40 top-[-10%] h-[420px] w-[420px] rounded-full bg-[#635bff]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-[30%] h-[380px] w-[380px] rounded-full bg-[#ec4899]/20 blur-[130px]" />

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="text-[22px] font-bold tracking-tight text-white">
          nive
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> All tools
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-[1180px] px-6 pb-24 pt-6 sm:px-10 sm:pt-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">
            Credits
          </p>
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
            One wallet.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(95deg,#8b7dff 0%,#ec4899 60%,#fb7185 100%)" }}
            >
              Every tool.
            </span>
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/70">
            Buy credits once and spend them anywhere in Nive — Code Studio, marketing, synthetic
            datasets, custom agents and autonomous autopilot runs. No per-tool limits, no daily
            resets. Pay securely with UPI or card.
          </p>
          {balance !== null && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-semibold ring-1 ring-white/15">
              <Zap className="h-3.5 w-3.5 text-[#a78bfa]" />
              You have {balance.toLocaleString()} credits
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CREDIT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-7 backdrop-blur transition-all hover:-translate-y-1 ${
                plan.highlight
                  ? "bg-white/[0.08] ring-2 ring-[#8b7dff] shadow-[0_24px_70px_rgba(99,91,255,0.35)]"
                  : "bg-white/[0.04] ring-1 ring-white/10"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#635bff] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md">
                  {plan.badge}
                </span>
              )}
              <h2 className="text-[18px] font-semibold">{plan.name}</h2>
              <p className="mt-1 text-[13px] text-white/60">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[42px] font-bold tracking-tight">₹{plan.price}</span>
                <span className="text-[14px] text-white/50">/ {plan.period}</span>
              </div>
              <p className="mt-1 text-[13px] font-semibold text-[#a78bfa]">
                {plan.credits?.toLocaleString()} credits
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-[14px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8b7dff]" />
                    <span className="text-white/75">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/checkout/$planId"
                params={{ planId: plan.id }}
                className={`mt-7 inline-flex items-center justify-center rounded-md py-2.5 text-[14px] font-semibold text-white transition-all ${
                  plan.highlight
                    ? "bg-[#635bff] hover:bg-[#5048d6] shadow-[0_2px_10px_rgba(99,91,255,0.45)]"
                    : "bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
                }`}
              >
                Get {plan.name} — ₹{plan.price}
              </Link>
            </div>
          ))}
        </div>

        {/* Top-up packs */}
        <section className="mt-16">
          <h2 className="text-[22px] font-bold tracking-tight sm:text-[26px]">
            Or top up as you go
          </h2>
          <p className="mt-2 text-[14px] text-white/60">
            One-off packs. No subscription, and these credits never expire.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {CREDIT_PACKS.map((p) => (
              <Link
                key={p.id}
                to="/checkout/$planId"
                params={{ planId: p.id }}
                className={`group flex items-center justify-between rounded-xl p-5 transition-all hover:-translate-y-0.5 ${
                  p.highlight
                    ? "bg-white/[0.08] ring-1 ring-[#8b7dff]/60"
                    : "bg-white/[0.04] ring-1 ring-white/10"
                }`}
              >
                <div>
                  <div className="text-[16px] font-semibold">{p.name}</div>
                  <div className="text-[12.5px] text-white/55">{p.tagline}</div>
                </div>
                <span className="text-[20px] font-bold">₹{p.price}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* What credits buy */}
        <section className="mt-16 rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/10">
          <h2 className="text-[22px] font-bold tracking-tight sm:text-[26px]">
            What a credit buys
          </h2>
          <p className="mt-2 text-[14px] text-white/60">
            Credits are spent per completed job, not per message. Failed runs are never charged.
          </p>
          <div className="mt-6 divide-y divide-white/10">
            {COST_ROWS.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4 py-3">
                <span className="flex items-center gap-3 text-[14px] text-white/80">
                  <r.icon className="h-4 w-4 shrink-0 text-[#8b7dff]" />
                  {r.label}
                </span>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-semibold">
                  {r.cost} {r.cost === 1 ? "credit" : "credits"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-[13px] text-white/50">
          Credits land in your wallet the moment your payment is confirmed. New accounts start with
          200 free credits.
        </p>
      </main>
      <LegalFooter />
    </div>
  );
}
