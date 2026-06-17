import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowLeft, ShieldCheck, Zap, Globe, Layers, CreditCard, RefreshCcw, Quote, Sparkles } from "lucide-react";
import { PLANS, plansForProduct } from "@/lib/plans";
import { Ribbon } from "@/components/Ribbon";
import { PaddleCheckoutButton } from "@/components/PaddleCheckoutButton";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { LegalFooter } from "@/components/LegalFooter";

const CODE_PLANS = plansForProduct("code");

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nive AI" },
      { name: "description", content: "Simple, affordable plans for Nive AI — pay with UPI. Starter at ₹149/month and Pro at ₹299/month for unlimited prompts." },
      { property: "og:title", content: "Nive AI Pricing — Starter & Pro plans" },
      { property: "og:description", content: "Compare Nive AI plans. Higher limits, faster models, and unlimited prompts. UPI payments accepted." },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
    scripts: PLANS.filter((p) => p.price > 0 && (p.product ?? "code") === "code").map((p) => ({
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
    <div
      className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <PaymentTestModeBanner />
      <Ribbon />

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]">
          <ArrowLeft className="h-4 w-4" /> Back to chat
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-[1180px] px-6 pb-24 pt-8 sm:px-10 sm:pt-16">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">Pricing</p>
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight text-[#0a2540] sm:text-[56px]">
            Choose your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(95deg, #635bff 0%, #ec4899 60%, #fb7185 100%)" }}
            >
              plan
            </span>
          </h1>
          <p className="mt-4 text-[16px] text-[#425466]">
            Simple, transparent pricing. Pay securely with UPI — access unlocks once your payment is approved.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CODE_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl bg-white p-7 transition-all hover:-translate-y-1 ${
                plan.highlight
                  ? "shadow-[0_20px_60px_rgba(99,91,255,0.25),0_8px_24px_rgba(50,50,93,0.1)] ring-2 ring-[#635bff]"
                  : "shadow-[0_15px_50px_rgba(50,50,93,0.1),0_5px_15px_rgba(0,0,0,0.05)] ring-1 ring-[#e3e8ee]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#635bff] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md">
                  Most popular
                </span>
              )}
              <h2 className="text-[18px] font-semibold text-[#0a2540]">{plan.name}</h2>
              <p className="mt-1 text-[13px] text-[#697386]">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[42px] font-bold tracking-tight text-[#0a2540]">₹{plan.price}</span>
                <span className="text-[14px] text-[#697386]">/ {plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-[14px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#635bff]" />
                    <span className="text-[#3c4257]">{f}</span>
                  </li>
                ))}
              </ul>
              {plan.price === 0 ? (
                <Link
                  to="/"
                  className="mt-7 inline-flex items-center justify-center rounded-md border border-[#e0e6eb] bg-white py-2.5 text-[14px] font-semibold text-[#0a2540] shadow-sm transition-all hover:border-[#cfd7df] hover:shadow"
                >
                  Use free
                </Link>
              ) : (
                <Link
                  to="/checkout/$planId"
                  params={{ planId: plan.id }}
                  className={`mt-7 inline-flex items-center justify-center rounded-md py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all ${
                    plan.highlight ? "bg-[#635bff] hover:bg-[#5048d6]" : "bg-[#0a2540] hover:bg-[#1a3a5c]"
                  }`}
                >
                  Choose {plan.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Why upgrade — concrete value props */}
        <section className="mt-20">
          <h2 className="text-center text-[22px] font-bold tracking-tight text-[#0a2540] sm:text-[28px]">
            Why builders upgrade
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Faster, smarter model", body: "Pro switches you to GPT-5.5-class reasoning for production-grade code." },
              { icon: Layers, title: "Multi-file projects", body: "Full React apps, not just snippets. Files are previewed live as they stream." },
              { icon: Globe, title: "Multilingual", body: "Build and chat in Tamil, Hindi, Spanish, Arabic — any language you write in." },
              { icon: ShieldCheck, title: "No daily cap (Pro)", body: "Ship without watching a counter. Unlimited prompts, priority queue." },
            ].map((b) => (
              <div key={b.title} className="rounded-xl bg-white p-5 ring-1 ring-[#e3e8ee] shadow-[0_4px_14px_rgba(50,50,93,0.06)]">
                <b.icon className="h-5 w-5 text-[#635bff]" />
                <h3 className="mt-3 text-[15px] font-semibold text-[#0a2540]">{b.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#425466]">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="mt-20">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">
            Loved by builders across India
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              { quote: "Replaced three tools in my workflow. The multi-file output is honestly wild.", who: "Aarav S.", role: "Indie hacker, Pune" },
              { quote: "Tamil prompts → working Flutter screens. My team finally adopted an AI tool.", who: "Priya N.", role: "Founder, Chennai" },
              { quote: "₹299 for unlimited prompts is a steal once you see the Pro model in action.", who: "Rohan K.", role: "CS student, Bengaluru" },
            ].map((t) => (
              <figure key={t.who} className="rounded-xl bg-white p-6 ring-1 ring-[#e3e8ee] shadow-[0_4px_14px_rgba(50,50,93,0.06)]">
                <Quote className="h-5 w-5 text-[#635bff]/70" />
                <blockquote className="mt-3 text-[14px] leading-relaxed text-[#3c4257]">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-4 text-[12px] text-[#697386]">
                  <span className="font-semibold text-[#0a2540]">{t.who}</span> · {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl bg-[#f6f9fc] px-6 py-4 text-[13px] text-[#425466] ring-1 ring-[#e3e8ee]">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#635bff]" /> Secure checkout via Paddle</span>
          <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#635bff]" /> UPI, cards & wallets accepted</span>
          <span className="inline-flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-[#635bff]" /> Cancel anytime · 14-day refund</span>
        </div>

        <p className="mt-10 text-center text-[13px] text-[#697386]">
          Plan activates the moment your payment is confirmed. No manual approval needed.
        </p>
      </main>
      <LegalFooter />
    </div>
  );
}
