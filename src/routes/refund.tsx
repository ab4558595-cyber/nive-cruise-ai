import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Nive AI" },
      {
        name: "description",
        content:
          "Nive AI's refund policy — 30-day money-back guarantee on all paid plans.",
      },
      { property: "og:title", content: "Refund Policy — Nive AI" },
      {
        property: "og:description",
        content: "30-day money-back guarantee on all Nive AI paid plans.",
      },
    ],
    links: [{ rel: "canonical", href: "/refund" }],
  }),
  component: Refund,
});

function Refund() {
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
        <p className="mb-10 text-[13px] text-[#697386]">Last updated: 17 June 2026</p>

        <Section title="1. Money-back guarantee">
          We offer a <strong>30-day money-back guarantee</strong> on all paid plans. If you are not satisfied
          with your purchase for any reason, you can request a full refund within 30 days of your order date.
        </Section>

        <Section title="2. How to request a refund">
          To request a refund:
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Email us at <a className="text-[#635bff] underline" href="mailto:bansal.monikaji1982@gmail.com">bansal.monikaji1982@gmail.com</a> with your order details (payment reference, date, plan).</li>
            <li>We review and initiate the refund within 3 business days. Refunds typically reach your account in 5–10 working days, depending on your bank.</li>
          </ul>
        </Section>

        <Section title="3. What is refundable">
          <ul className="list-disc space-y-2 pl-5">
            <li>Full plan payments made within the last 30 days.</li>
          </ul>
        </Section>

        <Section title="4. What is not refundable">
          <ul className="list-disc space-y-2 pl-5">
            <li>Payments older than 30 days.</li>
            <li>Payments where the account has been terminated for a material breach of our <Link to="/terms" className="text-[#635bff] underline">Terms & Conditions</Link>.</li>
            <li>Payments that have already been reversed or charged back through your bank or card issuer.</li>
          </ul>
        </Section>

        <Section title="5. Refund timing">
          Once approved, refunds are typically processed within <strong>5–10 business days</strong>. The exact
          timing depends on your original payment method and your bank's processing times.
        </Section>

        <Section title="6. Cancellation">
          You can cancel your subscription at any time from your account settings. Cancelling stops future
          billing; your access continues until the end of the current billing period. Cancellation does not
          automatically trigger a refund — please follow the refund process above if you are within the 30-day
          window.
        </Section>

        <Section title="7. Questions">
          If you have any questions about this policy, email us at{" "}
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
