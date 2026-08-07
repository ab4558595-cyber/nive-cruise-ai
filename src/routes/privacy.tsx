import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Nive AI" },
      {
        name: "description",
        content:
          "How Nive AI collects, uses, and shares your personal data, including your rights and our retention practices.",
      },
      { property: "og:title", content: "Privacy Notice — Nive AI" },
      {
        property: "og:description",
        content: "Nive AI's privacy notice — data we collect, how we use it, and your rights.",
      },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="mx-auto flex max-w-[880px] items-center justify-between px-6 py-5">
        <Link to="/" className="text-[22px] font-bold tracking-tight">nive</Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] text-[#0a2540]/70 hover:text-[#635bff]">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>

      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-6 text-[15px] leading-relaxed text-[#3c4257]">
        <h1 className="mb-2 text-[36px] font-bold tracking-tight text-[#0a2540]">Privacy Notice</h1>
        <p className="mb-10 text-[13px] text-[#697386]">Last updated: 15 June 2026</p>

        <Section title="1. Who we are">
          <strong>Nive AI</strong> ("we", "us", "our") is the data controller for the personal data
          described in this notice. You can reach us at{" "}
          <a className="text-[#635bff] underline" href="mailto:bansal.monikaji1982@gmail.com">
            bansal.monikaji1982@gmail.com
          </a>
          .
        </Section>

        <Section title="2. Data we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Account data:</strong> name, email, hashed password (for email sign-up), authentication provider IDs (Google).</li>
            <li><strong>Profile data:</strong> any optional profile information you provide.</li>
            <li><strong>Content data:</strong> prompts, files you upload, generated outputs, conversation history.</li>
            <li><strong>Usage & telemetry:</strong> features used, prompt counts, model selections, error logs.</li>
            <li><strong>Device & technical data:</strong> IP address, browser type, device type, OS, referrer URL.</li>
            <li><strong>Support data:</strong> messages you send to support and our responses.</li>
            <li><strong>Payment data:</strong> if you contact us to purchase a plan, we receive a payment reference and minimal metadata — we do <em>not</em> store full card numbers, CVVs, or UPI PINs.</li>
          </ul>
        </Section>

        <Section title="3. Why we use your data & legal basis">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Provide the service</strong> (account, AI generation, history) — performance of our contract with you.</li>
            <li><strong>Process payments and manage subscriptions</strong> — performance of contract.</li>
            <li><strong>Security, fraud and abuse prevention</strong> — legitimate interests / legal obligation.</li>
            <li><strong>Improve our product</strong> (aggregate analytics, debugging, model quality) — legitimate interests.</li>
            <li><strong>Customer support</strong> — performance of contract / legitimate interests.</li>
            <li><strong>Marketing communications</strong> — consent (you can unsubscribe at any time).</li>
            <li><strong>Compliance with law</strong> — legal obligation.</li>
          </ul>
        </Section>

        <Section title="4. Who we share data with">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Cloud hosting & infrastructure providers</strong> — to host the service and store data.</li>
            <li><strong>Cloud hosting & infrastructure providers</strong> — to host the service and store data.</li>
            <li><strong>AI model providers</strong> — your prompts may be sent to upstream large-language-model providers (e.g. Google AI, OpenRouter) to generate responses.</li>
            <li><strong>Analytics providers</strong> — Google Analytics for aggregate usage statistics.</li>
            <li><strong>Email delivery providers</strong> — for transactional and support emails.</li>
            <li><strong>Professional advisers</strong> — legal, accounting, and tax advisers under confidentiality.</li>
            <li><strong>Authorities</strong> — where required by law, court order, or to protect rights, safety, or property.</li>
          </ul>
        </Section>

        <Section title="5. International transfers">
          Our service providers may process data outside your country of residence, including in the
          European Economic Area, the United Kingdom, the United States, and India. Where applicable,
          we rely on Standard Contractual Clauses, adequacy decisions, or equivalent safeguards.
        </Section>

        <Section title="6. Retention">
          We retain personal data only as long as needed to provide the service, comply with legal
          obligations, resolve disputes, and enforce our agreements. Account and content data is kept
          for the life of your account and deleted (or anonymised) within a reasonable period after
          account closure. Billing records are retained for the period required by tax and accounting
          law.
        </Section>

        <Section title="7. Your rights">
          Subject to applicable law you have the right to: access, rectify, erase, restrict, port, or
          object to processing of your personal data, and to withdraw consent at any time. You can
          also lodge a complaint with your local data-protection authority. To exercise any right,
          email{" "}
          <a className="text-[#635bff] underline" href="mailto:bansal.monikaji1982@gmail.com">
            bansal.monikaji1982@gmail.com
          </a>
          . We will respond within one month.
        </Section>

        <Section title="8. Security">
          We use appropriate technical and organisational measures including encryption in transit,
          access controls, hashed passwords, audit logging, and least-privilege service-role keys for
          backend operations. No system is perfectly secure; if we become aware of a breach affecting
          your data we will notify you and the relevant authorities as required by law.
        </Section>

        <Section title="9. Cookies">
          We use essential cookies to keep you signed in and to remember preferences, and analytics
          cookies (Google Analytics) to measure aggregate usage. You can manage cookies through your
          browser settings. We do not use advertising cookies.
        </Section>

        <Section title="10. Children">
          The service is not directed at children under 13 (or the equivalent minimum age in your
          jurisdiction). If you believe a child has provided us personal data, contact us and we will
          delete it.
        </Section>

        <Section title="11. Changes to this notice">
          We may update this notice from time to time. Material changes will be communicated through
          the service or by email.
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
