import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Nive AI" },
      {
        name: "description",
        content:
          "The terms and conditions that govern your use of Nive AI's AI coding copilot and business suite.",
      },
      { property: "og:title", content: "Terms & Conditions — Nive AI" },
      {
        property: "og:description",
        content: "Terms and conditions for using Nive AI services.",
      },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="mx-auto flex max-w-[880px] items-center justify-between px-6 py-5">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight">nive</Link>
        <Link to="/welcome" className="inline-flex items-center gap-1.5 text-[14px] text-[#0a2540]/70 hover:text-[#635bff]">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>

      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-6 text-[15px] leading-relaxed text-[#3c4257]">
        <h1 className="mb-2 text-[36px] font-bold tracking-tight text-[#0a2540]">Terms & Conditions</h1>
        <p className="mb-10 text-[13px] text-[#697386]">Last updated: 15 June 2026</p>

        <Section title="1. Who we are">
          These Terms & Conditions ("Terms") govern your use of the websites, products, and services
          provided by <strong>Nive AI</strong> ("Nive AI", "we", "us", or "our"). By accessing or using our
          services you agree to be bound by these Terms.
        </Section>

        <Section title="2. The service">
          Nive AI provides (a) an AI coding copilot that generates source code and project files from
          natural-language prompts, and (b) a Business suite for synthetic data generation, AI marketing
          copy, and social-content drafting. All outputs are digital text/code delivered through the
          platform.
        </Section>

        <Section title="3. Eligibility & accounts">
          You must be of legal age in your jurisdiction (or have parental consent) and have authority to
          bind any organisation you represent. You are responsible for keeping your credentials
          confidential and for all activity under your account. You must provide accurate information
          and keep it up to date.
        </Section>

        <Section title="4. Acceptable use">
          You agree not to: (a) use the service unlawfully or in violation of any third-party rights;
          (b) generate or distribute content that is illegal, defamatory, hateful, sexually explicit
          involving minors, harassing, or designed to deceive (deepfakes, impersonation); (c) generate
          malware, phishing pages, exploits, or content that promotes self-harm; (d) attempt to reverse
          engineer, scrape, probe, or interfere with the security of the service; (e) resell or
          redistribute the service without our written consent; (f) bypass usage limits, rate limits,
          or technical restrictions.
        </Section>

        <Section title="5. Your prompts & outputs (AI specific)">
          You are responsible for the prompts you submit and for how you use any outputs. AI outputs
          may be inaccurate, incomplete, or unsuitable for a particular purpose and must be reviewed
          before use — especially before being relied on in production, legal, medical, financial, or
          other regulated contexts. You must have the rights to any inputs you upload, and you grant
          us a limited licence to host and process them solely to provide the service. We reserve the
          right to moderate, restrict, or refuse outputs, and to suspend accounts that repeatedly
          generate prohibited content.
        </Section>

        <Section title="6. Intellectual property">
          The service, including all software, models, prompts, documentation, and branding, is owned
          by Nive AI and protected by intellectual-property laws. We grant you a limited,
          non-exclusive, non-transferable right to use the service within the plan you have purchased.
          Subject to your compliance with these Terms and applicable law, code that you generate
          through the service is yours to use, modify, and distribute in your own projects.
        </Section>

        <Section title="7. Plans, payments & subscriptions">
          Paid plans are billed in advance on a recurring monthly basis at the prices shown on our
          pricing pages. Subscriptions renew automatically until cancelled. Our order process is
          conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is the Merchant of
          Record for all our orders. Paddle provides all customer service inquiries and handles
          returns. Detailed payment, billing, tax, cancellation, and refund mechanics are governed by
          the{" "}
          <a className="text-[#635bff] underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">
            Paddle Checkout Buyer Terms
          </a>
          . See our <Link to="/refunds" className="text-[#635bff] underline">Refund Policy</Link> for refund
          windows and how to request a refund.
        </Section>

        <Section title="8. Service availability">
          We work hard to keep the service available but do not guarantee uninterrupted or error-free
          operation. We may perform maintenance, change features, or modify usage limits.
        </Section>

        <Section title="9. Suspension & termination">
          We may suspend or terminate your access for: (a) material breach of these Terms; (b)
          non-payment; (c) security, fraud, or abuse risk; (d) repeated or serious policy violations;
          or (e) requirements of law. On termination your right to use the service ends; we may delete
          your data after a reasonable export window.
        </Section>

        <Section title="10. Disclaimers">
          To the fullest extent permitted by law, the service is provided "as is" and "as available"
          without warranties of any kind, express or implied, including merchantability, fitness for a
          particular purpose, and non-infringement.
        </Section>

        <Section title="11. Limitation of liability">
          To the fullest extent permitted by law, our aggregate liability arising out of or relating to
          the service is limited to the fees you paid to us in the 12 months preceding the claim. We
          are not liable for indirect, consequential, special, incidental, or punitive damages,
          including loss of profits, revenue, data, or goodwill. Nothing in these Terms excludes
          liability that cannot be excluded under applicable law.
        </Section>

        <Section title="12. Indemnity">
          You agree to indemnify and hold Nive AI harmless from claims arising out of your content,
          your prompts/outputs, your unlawful use of the service, or your breach of these Terms.
        </Section>

        <Section title="13. Changes to the Terms">
          We may update these Terms from time to time. Material changes will be communicated through
          the service or by email. Continued use of the service after changes take effect means you
          accept the updated Terms.
        </Section>

        <Section title="14. Governing law">
          These Terms are governed by the laws of India, without regard to conflict-of-law rules.
          Courts located in India will have exclusive jurisdiction over any dispute, except where
          mandatory consumer-protection laws provide otherwise.
        </Section>

        <Section title="15. Contact">
          Questions about these Terms? Email{" "}
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
