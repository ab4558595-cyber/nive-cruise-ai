import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowLeft } from "lucide-react";
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
                <PaddleCheckoutButton planId={plan.id} planName={plan.name} highlight={plan.highlight} />
              )}
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-[13px] text-[#697386]">
          After payment, your access is activated once the owner approves your request.
        </p>
      </main>
      <LegalFooter />
    </div>
  );
}
