import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalFooter } from "@/components/LegalFooter";
import founderImg from "@/assets/founder.png";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "Founder — Nive AI" },
      { name: "description", content: "Meet the 13-year-old founder of Nive AI, building code infrastructure for the next billion builds." },
      { property: "og:title", content: "Founder — Nive AI" },
      { property: "og:description", content: "Meet the 13-year-old founder of Nive AI." },
    ],
    links: [{ rel: "canonical", href: "/founder" }],
  }),
  component: FounderPage,
});

function FounderPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight text-[#0a2540]">nive</Link>
        <Link to="/welcome" className="text-[14px] font-medium text-[#635bff] hover:text-[#0a2540]">← Back to home</Link>
      </header>

      <section className="mx-auto grid max-w-[1080px] gap-12 px-6 py-16 sm:px-10 md:grid-cols-2 md:items-center">
        <div className="relative">
          <div
            className="absolute inset-0 -z-10 rounded-[32px] blur-3xl opacity-40"
            style={{ background: "linear-gradient(135deg, #635bff, #00d4ff, #ff4d8d)" }}
          />
          <img
            src={founderImg}
            alt="Founder of Nive AI"
            className="mx-auto w-full max-w-[420px] drop-shadow-[0_20px_40px_rgba(10,37,64,0.25)]"
          />
        </div>

        <div>
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">Founder</p>
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.025em] text-[#0a2540] sm:text-[56px]">
            A 13-year-old on a mission to{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(95deg, #635bff 0%, #00d4ff 40%, #ff4d8d 100%)" }}
            >
              rewrite what's possible.
            </span>
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-[#425466]">
            I'm 13 years old, and I founded <span className="font-semibold text-[#0a2540]">Nive AI</span> with one ambition —
            to give every builder, no matter their age or background, the power to ship production-grade code for any platform on Earth.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-[#425466]">
            I believe the next billion engineers won't all be adults in Silicon Valley offices. They'll be kids in classrooms,
            founders in small towns, and dreamers everywhere. Nive AI is my contribution — code infrastructure built so that
            ambition, not experience, decides what you can build.
          </p>
          <blockquote className="mt-8 border-l-4 border-[#635bff] pl-5 text-[18px] italic leading-relaxed text-[#0a2540]">
            "Age is just a number. Ambition is the real engine."
          </blockquote>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/welcome"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-5 py-3 text-[15px] font-medium text-white shadow-[0_4px_14px_rgba(99,91,255,0.35)] transition-all hover:translate-y-[-1px] hover:bg-[#5048d6]"
            >
              Explore Nive AI <span aria-hidden>›</span>
            </Link>
            <Link
              to="/business/pricing"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2540]/10 bg-white px-5 py-3 text-[15px] font-medium text-[#0a2540] transition-colors hover:border-[#635bff]/30 hover:text-[#635bff]"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
