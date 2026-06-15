import { createFileRoute, Link } from "@tanstack/react-router";
import { Ribbon } from "@/components/Ribbon";
import { TryAiDemo } from "@/components/TryAiDemo";
import { Bug, Recycle, Layers, Paperclip, ShieldCheck, Lock, Star, Users, Sparkles, Building2, BadgeCheck, RefreshCw, HeartHandshake, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Nive AI — Code infrastructure for the next billion builds" },
      { name: "description", content: "Nive AI writes production-quality code for web, mobile, embedded, and ML — from your first prototype to your billionth deployment." },
      { property: "og:title", content: "Nive AI — Code infrastructure for builders" },
      { property: "og:description", content: "From your first prototype to your billionth deployment. Nive AI writes production code for any platform." },
      { property: "og:url", content: "/welcome" },
    ],
    links: [{ rel: "canonical", href: "/welcome" }],
  }),
  component: Welcome,
});

function Welcome() {

  return (
    <div className="min-h-screen bg-white text-[#0a2540]" style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}>
      <div className="relative overflow-hidden bg-white">
        <Ribbon />

        {/* Nav */}
        <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 sm:px-10">
          <div className="flex items-center gap-10">
            <Link to="/welcome" className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[22px] font-bold tracking-tight text-[#0a2540]">nive</span>
            </Link>

            <nav className="hidden items-center gap-6 text-[15px] font-medium text-[#0a2540] md:flex">
              <NavItem label="Products" />
              <NavItem label="Solutions" />
              <NavItem label="Developers" />
              <NavItem label="Resources" />
              <Link to="/pricing" className="whitespace-nowrap transition-colors hover:text-[#635bff]">Pricing</Link>
              <Link
                to="/social"
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-[#635bff] to-[#ff4d8d] bg-clip-text text-transparent transition-opacity hover:opacity-80"
              >
                ✨ Social Manager
              </Link>
              <Link
                to="/business"
                className="whitespace-nowrap rounded-full bg-[#0a2540]/5 px-3 py-1 text-[#635bff] transition-colors hover:bg-[#635bff]/10"
              >
                For Business →
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
              to="/auth"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#635bff] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0a2540]"
            >
              Get started <span aria-hidden>›</span>
            </Link>
          </div>
        </header>


        {/* Hero content */}
        <section className="relative z-10 mx-auto max-w-[1280px] px-6 pb-28 pt-16 sm:px-10 sm:pt-24 lg:pb-40 lg:pt-32">
          <div className="max-w-[760px]">
            <p className="mb-6 text-[14px] font-medium text-[#0a2540]/70">
              Lines of code shipped with Nive AI:{" "}
              <span className="text-[#635bff]">1,657,113</span>
            </p>

            <h1
              className="text-[48px] font-bold leading-[1.02] tracking-[-0.025em] text-[#0a2540] sm:text-[72px] lg:text-[88px]"
              style={{ fontFamily: "'Inter', 'Sohne', system-ui, sans-serif" }}
            >
              Code infrastructure to{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(95deg, #635bff 0%, #00d4ff 40%, #ff4d8d 100%)" }}
              >
                grow your product.
              </span>
            </h1>

            <p className="mt-6 max-w-[620px] text-[17px] leading-relaxed text-[#425466] sm:text-[19px]">
              Ship apps, firmware, and AI systems — from your first prototype to your billionth deployment.
            </p>


            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-5 py-3 text-[15px] font-medium text-white shadow-[0_4px_14px_rgba(99,91,255,0.35)] transition-all hover:translate-y-[-1px] hover:bg-[#5048d6] hover:shadow-[0_8px_24px_rgba(99,91,255,0.45)]"
              >
                Start building <span aria-hidden>›</span>
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#635bff] transition-colors hover:text-[#0a2540]"
              >
                Contact sales <span aria-hidden>›</span>
              </Link>
            </div>

            {/* Mobile-only quick access to key product surfaces */}
            <div className="mt-6 flex flex-wrap gap-3 md:hidden">
              <Link
                to="/social"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#635bff]/20 bg-white px-4 py-2 text-[14px] font-medium text-[#635bff] shadow-sm transition-colors hover:bg-[#635bff]/5"
              >
                <Sparkles className="h-4 w-4" /> Social Manager
              </Link>
              <Link
                to="/business"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2540]/10 bg-white px-4 py-2 text-[14px] font-medium text-[#0a2540] shadow-sm transition-colors hover:border-[#635bff]/30 hover:text-[#635bff]"
              >
                <Building2 className="h-4 w-4" /> For Business →
              </Link>
            </div>


            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#425466]">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#22c55e]" /> SOC 2-ready infrastructure</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-[#635bff]" /> Encrypted in transit & at rest</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#0a2540]" /> 12,000+ builders</span>
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" /> 4.9/5 average rating</span>
            </div>
          </div>
        </section>

      </div>

      {/* Trust band */}
      <section className="border-y border-[#0a2540]/8 bg-[#f6f9fc]">
        <div className="mx-auto max-w-[1280px] px-6 py-10 sm:px-10">
          <p className="mb-5 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#425466]">
            Trusted by teams shipping production code
          </p>
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            <TrustStat value="1.6M+" label="Lines shipped" />
            <TrustStat value="12k+" label="Active builders" />
            <TrustStat value="99.95%" label="Uptime SLA" />
            <TrustStat value="< 200ms" label="Median response" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10">
        <div className="mb-10 max-w-[760px]">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">What builders say</p>
          <h2 className="text-[30px] font-bold tracking-[-0.02em] text-[#0a2540] sm:text-[40px]">Loved by engineers and founders</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Testimonial
            quote="Nive shipped a Sentry fix to production before our on-call engineer woke up. It just works."
            name="Priya S."
            role="CTO, Fintech startup"
          />
          <Testimonial
            quote="We modernized a 15-year-old Java service in a weekend. The test coverage report alone sold us."
            name="Marcus L."
            role="Staff Engineer, Logistics"
          />
          <Testimonial
            quote="The social manager + dev tools combo is wild — one platform for the whole launch."
            name="Aisha K."
            role="Indie founder"
          />
        </div>
      </section>

      {/* Free try AI demo (no signup) */}
      <TryAiDemo />

      {/* Guarantees */}
      <section className="mx-auto max-w-[1280px] px-6 pb-4 sm:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <GuaranteeCard
            icon={BadgeCheck}
            title="Free to start"
            body="No credit card required. Build your first project on the house."
          />
          <GuaranteeCard
            icon={RefreshCw}
            title="Cancel anytime"
            body="Month-to-month. Downgrade or cancel from your dashboard in one click."
          />
          <GuaranteeCard
            icon={HeartHandshake}
            title="Human support"
            body="Real engineers reply within hours, not days. Email and live chat included."
          />
        </div>
      </section>




      {/* Working features */}
      <section className="relative mx-auto max-w-[1280px] px-6 py-24 sm:px-10">
        <div className="mb-14 max-w-[760px]">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">What Nive actually does today</p>
          <h2 className="text-[34px] font-bold leading-tight tracking-[-0.02em] text-[#0a2540] sm:text-[44px]">
            Working features. Live. Right now.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#425466]">
            Nive generates production-grade code — not full deployed webapps — on any stack you use.
            Point it at your bugs, your legacy systems, or your own media, and it works alongside your team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Bug}
            title="The Autonomous Bug-Squasher"
            body="Point Nive at your error tracking log (like Sentry). It autonomously locates the bug, writes the fix, runs the regression tests, and opens a Pull Request — while your team sleeps."
          />
          <FeatureCard
            icon={Recycle}
            title="The Legacy Modernizer"
            body="Upload an ancient COBOL or Java codebase. Nive automatically refactors it into a modern, containerized TypeScript microservice architecture with 90%+ test coverage."
          />
          <FeatureCard
            icon={Layers}
            title="Any Code Stack"
            body="Nive generates code — not full webapps — across every stack: Arduino firmware, SwiftUI, React, Rust, Python ML, Go services. You stay in control of where it ships."
          />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-2xl border border-[#0a2540]/8 bg-[#f6f9fc] px-5 py-4 text-[14px] text-[#425466]">
          <Paperclip className="h-4 w-4 text-[#635bff]" />
          <span>
            New: attach your own <span className="font-semibold text-[#0a2540]">images, audio, video or files</span> in the
            composer and tell Nive what to do with them.
          </span>
          <Link to="/" className="ml-auto whitespace-nowrap font-medium text-[#635bff] hover:text-[#0a2540]">
            Try it now ›
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[960px] px-6 pb-24 sm:px-10">
        <div className="mb-8 text-center">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">Common questions</p>
          <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[#0a2540] sm:text-[36px]">Everything you want to know</h2>
        </div>
        <div className="divide-y divide-[#0a2540]/8 rounded-2xl border border-[#0a2540]/8 bg-white">
          <FaqItem
            q="Is my code and data private?"
            a="Yes. Your code and prompts are encrypted in transit and at rest. We never train shared models on your data, and you can delete your workspace at any time."
          />
          <FaqItem
            q="Do I need a credit card to start?"
            a="No. The free plan lets you try real generations without payment details. You only add billing when you want to scale up."
          />
          <FaqItem
            q="Can I use Nive AI for production work?"
            a="Yes. Teams ship production code daily with Nive — including PR-ready fixes, full services, and firmware. Every output is yours to use commercially."
          />
          <FaqItem
            q="What if it doesn't work for my stack?"
            a="If Nive can't help with your stack within your first 14 days, email support and we'll refund any paid usage — no questions asked."
          />
          <FaqItem
            q="How do I get help?"
            a="Email and in-app chat support is included on every plan. Most replies come back within a few hours from a real engineer."
          />
        </div>
      </section>
    </div>
  );
}

function GuaranteeCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#0a2540]/8 bg-white p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-[#0a2540]">{title}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-[#425466]">{body}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-[#0a2540] sm:text-[16px]">
        {q}
        <span className="ml-auto text-[#635bff] transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-[14px] leading-relaxed text-[#425466] sm:text-[15px]">{a}</p>
    </details>
  );
}


function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-[#0a2540]/8 bg-white p-7 shadow-[0_2px_14px_rgba(13,42,148,0.04)] transition-all hover:-translate-y-1 hover:border-[#635bff]/30 hover:shadow-[0_12px_36px_rgba(99,91,255,0.14)]">
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#635bff] to-[#00d4ff] text-white shadow-[0_4px_14px_rgba(99,91,255,0.35)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 text-[19px] font-semibold tracking-tight text-[#0a2540]">{title}</h3>
      <p className="text-[15px] leading-relaxed text-[#425466]">{body}</p>
    </div>
  );
}

function NavItem({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 transition-colors hover:text-[#635bff]"
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[26px] font-bold tracking-tight text-[#0a2540] sm:text-[32px]">{value}</div>
      <div className="mt-1 text-[13px] text-[#425466]">{label}</div>
    </div>
  );
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className="rounded-2xl border border-[#0a2540]/8 bg-white p-6 shadow-[0_2px_14px_rgba(13,42,148,0.04)]">
      <div className="mb-3 flex gap-0.5 text-[#f59e0b]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <blockquote className="text-[15px] leading-relaxed text-[#0a2540]">"{quote}"</blockquote>
      <figcaption className="mt-4 text-[13px] text-[#425466]">
        <span className="font-semibold text-[#0a2540]">{name}</span> — {role}
      </figcaption>
    </figure>
  );
}


