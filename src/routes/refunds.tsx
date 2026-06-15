import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Nive AI" },
      {
        name: "description",
        content:
          "Nive AI's 30-day money-back guarantee and how to request a refund through our payment provider, Paddle.",
      },
      { property: "og:title", content: "Refund Policy — Nive AI" },
      {
        property: "og:description",
        content: "30-day money-back guarantee on all Nive AI paid plans. Refunds processed by Paddle.",
      },
    ],
    links: [{ rel: "canonical", href: "/refunds" }],
  }),
  component: Refunds,
});

function Refunds() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="mx-auto flex max-w-[880px] items-center justify-between px-6 py-5">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight">nive</Link>
        <Link to="/welcome" className="inline-flex items-center gap-1.5 text-[14px] text-[#0a2540]/70 hover:text-[#635bff]">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>

      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-6 text-[15px] leading-relaxed text-[#3c4257]">
        <h1 className="mb-2 text-[36px] font-bold tracking-tight text-[#0a2540]">Refund Policy</h1>
        <p className="mb-10 text-[13px] text-[#697386]">Last updated: 15 June 2026</p>

        <Section title="30-day money-back guarantee">
          We want you to be happy with <strong>Nive AI</strong>. If you're not satisfied with your
          purchase, you can request a full refund within <strong>30 days</strong> of your order date
          for any paid Nive AI plan (Starter, Pro, Business — Growth, Business — Scale).
        </Section>

        <Section title="How to request a refund">
          Refunds are processed by our payment provider, <strong>Paddle</strong>, which is the
          Merchant of Record for all our orders. To request a refund:
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Go to{" "}
              <a className="text-[#635bff] underline" href="https://paddle.net" target="_blank" rel="noopener noreferrer">
                paddle.net
              </a>{" "}
              and enter the email address you used at checkout — Paddle will email you a link to your
              receipts where you can request a refund.
            </li>
            <li>
              Or email us at{" "}
              <a className="text-[#635bff] underline" href="mailto:bansal.monikaji1982@gmail.com">
                bansal.monikaji1982@gmail.com
              </a>{" "}
              with your order details and we'll arrange the refund with Paddle on your behalf.
            </li>
          </ol>
        </Section>

        <Section title="Subscriptions & renewals">
          You can cancel a subscription at any time from Paddle's customer portal (paddle.net). When
          you cancel, your plan remains active until the end of the current billing period and is not
          renewed afterwards. Charges for the current period remain subject to the 30-day window
          above.
        </Section>

        <Section title="Processing time">
          Approved refunds are credited back to your original payment method by Paddle. The funds
          usually appear within 5–10 business days, depending on your bank or card issuer.
        </Section>

        <Section title="Exceptions">
          We may decline refund requests in cases of clear abuse (for example, repeated buy-and-refund
          patterns) or where prohibited by law.
        </Section>

        <Section title="Need help?">
          If you have any questions about refunds, email{" "}
          <a className="text-[#635bff] underline" href="mailto:bansal.monikaji1982@gmail.com">
            bansal.monikaji1982@gmail.com
          </a>
          .
        </Section>
      </main>

      <LegalFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[20px] font-semibold text-[#0a2540]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
