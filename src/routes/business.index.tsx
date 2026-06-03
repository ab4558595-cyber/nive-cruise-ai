import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Megaphone, Shield, Zap } from "lucide-react";
import { Ribbon } from "@/components/Ribbon";

export const Route = createFileRoute("/business/")({
  head: () => ({
    meta: [
      { title: "Nive AI for Business — Synthetic data & AI marketing" },
      { name: "description", content: "Nive AI for Business: generate privacy-safe synthetic datasets and on-brand marketing copy in seconds. Built for data teams, marketers, and agencies." },
      { property: "og:title", content: "Nive AI for Business — Synthetic data & AI marketing" },
      { property: "og:description", content: "Generate synthetic datasets and AI-powered marketing copy. One platform, two superpowers." },
      { property: "og:url", content: "/business" },
    ],
    links: [{ rel: "canonical", href: "/business" }],
  }),
  component: Business,
});

function Business() {
  return (
    <div
      className="min-h-screen bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <div className="relative overflow-hidden bg-white">
        <Ribbon />

        {/* Nav — Business product */}
        <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 sm:px-10">
          <div className="flex items-center gap-10">
            <Link to="/business" className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[22px] font-bold tracking-tight text-[#0a2540]">
                nive<span className="ml-1 text-[#635bff]">/business</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-6 text-[15px] font-medium text-[#0a2540] md:flex">
              <Link to="/business/synthetic-data" className="transition-colors hover:text-[#635bff]">Synthetic Data</Link>
              <Link to="/business/marketing" className="transition-colors hover:text-[#635bff]">AI Marketing</Link>
              <Link to="/business/pricing" className="transition-colors hover:text-[#635bff]">Pricing</Link>
              <Link to="/welcome" className="text-[#0a2540]/70 transition-colors hover:text-[#635bff]">
                ← Nive for Builders
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/auth"
              className="hidden whitespace-nowrap rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#ff5a36] shadow-sm transition-shadow hover:shadow-md sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/business/pricing"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#635bff] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0a2540]"
            >
              Get started <span aria-hidden>›</span>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-[1280px] px-6 pb-24 pt-16 sm:px-10 sm:pt-24 lg:pb-32 lg:pt-28">
          <div className="max-w-[820px]">
            <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#635bff]">
              Nive AI · Business Suite
            </p>
            <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-[#0a2540] sm:text-[64px] lg:text-[72px]">
              AI services that{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(95deg, #635bff 0%, #00d4ff 40%, #ff4d8d 100%)" }}
              >
                grow your business.
              </span>{" "}
              Synthetic data & marketing copy, on demand.
            </h1>
            <p className="mt-6 max-w-[640px] text-[17px] leading-relaxed text-[#425466]">
              Spin up privacy-safe synthetic datasets for testing and ML, then generate on-brand
              marketing copy for ads, email, and social — all from one workspace.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/business/pricing"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-5 py-3 text-[15px] font-medium text-white shadow-[0_4px_14px_rgba(99,91,255,0.35)] transition-all hover:translate-y-[-1px] hover:bg-[#5048d6] hover:shadow-[0_8px_24px_rgba(99,91,255,0.45)]"
              >
                See pricing <span aria-hidden>›</span>
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#635bff] transition-colors hover:text-[#0a2540]"
              >
                Start free pilot <span aria-hidden>›</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Two-product strip */}
      <section className="relative z-10 border-t border-[#0a2540]/8 bg-[#f6f9fc]">
        <div className="mx-auto grid max-w-[1280px] gap-6 px-6 py-20 sm:px-10 md:grid-cols-2 lg:py-28">
          <FeatureCard
            id="synthetic"
            href="/business/synthetic-data"
            ctaLabel="Open Synthetic Data generator"
            icon={<Database className="h-5 w-5" />}
            eyebrow="AI Synthetic Data Generation"
            title="Realistic data, zero privacy risk."
            body="Generate schema-aware tabular datasets that mirror the statistical shape of your real data — without exposing a single real record. Use it for testing, demos, ML training, and compliance-friendly sharing."
            bullets={[
              "Tabular, time-series, and JSON schemas",
              "PII scrubbing & differential-privacy modes",
              "Export to CSV, JSON, or Parquet",
              "Bias and distribution reports",
            ]}
          />
          <FeatureCard
            id="marketing"
            href="/business/marketing"
            ctaLabel="Open Marketing generator"
            icon={<Megaphone className="h-5 w-5" />}
            eyebrow="AI Marketing Generation"
            title="Campaigns that sound like your brand."
            body="Lock in your tone of voice once, then produce ad headlines, landing copy, email sequences, and social posts in seconds — tuned per channel and audience."
            bullets={[
              "Brand voice & tone presets",
              "Ad / email / social variants",
              "Multilingual output",
              "Campaign briefs → full asset packs",
            ]}
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative z-10 border-t border-[#0a2540]/8 bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-6 px-6 py-16 sm:px-10 md:grid-cols-3">
          <MiniCard icon={<Shield className="h-4 w-4" />} title="Privacy-first" body="Your real data never leaves your control. Synthetic outputs are statistically faithful but record-level anonymous." />
          <MiniCard icon={<Zap className="h-4 w-4" />} title="Built for speed" body="Generate 10k rows or 100 ad variants in seconds, not days. APIs and webhooks for production pipelines." />
          <MiniCard icon={<Megaphone className="h-4 w-4" />} title="One brand, every channel" body="Define your brand voice once. Reuse it across ads, email, social, and product copy." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  id,
  href,
  ctaLabel,
  icon,
  eyebrow,
  title,
  body,
  bullets,
}: {
  id: string;
  href: "/business/synthetic-data" | "/business/marketing";
  ctaLabel: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
}) {
  return (
    <div
      id={id}
      className="flex flex-col rounded-2xl bg-white p-8 shadow-[0_15px_50px_rgba(50,50,93,0.08),0_5px_15px_rgba(0,0,0,0.04)] ring-1 ring-[#e3e8ee] transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(99,91,255,0.15)]"
    >
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#635bff]/10 text-[#635bff]">
        {icon}
      </div>
      <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">{eyebrow}</p>
      <h3 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-[#0a2540]">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-[#425466]">{body}</p>
      <ul className="mt-5 flex-1 space-y-2 text-[14px] text-[#3c4257]">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#635bff]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Link
        to={href}
        className="mt-6 inline-flex items-center gap-1.5 self-start rounded-full bg-[#635bff] px-4 py-2 text-[13.5px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6]"
      >
        {ctaLabel} <span aria-hidden>›</span>
      </Link>
    </div>
  );
}

function MiniCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-[#f6f9fc] p-6 ring-1 ring-[#e3e8ee]">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#635bff] ring-1 ring-[#e3e8ee]">
        {icon}
      </div>
      <h4 className="mt-3 text-[16px] font-semibold text-[#0a2540]">{title}</h4>
      <p className="mt-1 text-[14px] leading-relaxed text-[#425466]">{body}</p>
    </div>
  );
}
