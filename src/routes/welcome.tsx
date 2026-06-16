import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, Sparkles, Layers, Globe, ShoppingBag, MessageSquare, BarChart3, Users } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";
import { Ribbon } from "@/components/Ribbon";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Nive AI — Build apps with a single prompt" },
      { name: "description", content: "Nive AI turns your idea into a working web app. Describe what you want and watch it come to life — no code required." },
      { property: "og:title", content: "Nive AI — Build apps with a single prompt" },
      { property: "og:description", content: "Describe your app. Nive builds it. From landing pages to dashboards, full-stack apps shipped in minutes." },
      { property: "og:url", content: "/welcome" },
    ],
    links: [{ rel: "canonical", href: "/welcome" }],
  }),
  component: Welcome,
});

const EXAMPLES = [
  { icon: Globe,        label: "Landing page for my SaaS" },
  { icon: ShoppingBag,  label: "Online store with checkout" },
  { icon: BarChart3,    label: "Analytics dashboard" },
  { icon: MessageSquare,label: "AI chat assistant" },
  { icon: Users,        label: "Community / social app" },
  { icon: Layers,       label: "Internal admin tool" },
];

function Welcome() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = prompt.trim();
    if (text) {
      try { sessionStorage.setItem("nive-pending-prompt", text); } catch {}
    }
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[600px] overflow-hidden">
        <div className="absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#635bff]/25 blur-[140px]" />
        <div className="absolute left-1/3 top-[-100px] h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-[#00d4ff]/15 blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/welcome" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#635bff] to-[#ff4d8d]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[20px] font-semibold tracking-tight">nive</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[14px] text-white/70 md:flex">
          <Link to="/pricing" className="transition-colors hover:text-white">Pricing</Link>
          <Link to="/founder" className="transition-colors hover:text-white">Founder</Link>
          <Link to="/auth" className="transition-colors hover:text-white">Sign in</Link>
        </nav>
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0b] transition-all hover:bg-white/90"
        >
          Get started
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-[920px] px-6 pb-20 pt-16 text-center sm:px-10 sm:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          Build full apps from a single prompt
        </div>

        <h1 className="text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[68px]">
          What do you want to{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(95deg, #a78bfa 0%, #60a5fa 50%, #f472b6 100%)" }}
          >
            build today?
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/60 sm:text-[18px]">
          Describe your idea. Nive ships a working app with a clean UI — landing pages, dashboards, stores, and more.
        </p>

        {/* Prompt composer */}
        <form
          onSubmit={handleSubmit}
          className="relative mx-auto mt-10 max-w-[720px] rounded-2xl border border-white/10 bg-[#141416]/80 p-3 shadow-[0_30px_80px_-20px_rgba(99,91,255,0.45)] backdrop-blur"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            placeholder="Build me a recipe sharing app with user profiles and search…"
            className="block w-full resize-none rounded-xl bg-transparent px-3 py-3 text-[15px] text-white placeholder:text-white/40 focus:outline-none"
            rows={3}
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-[12px] text-white/40">⏎ to start · Shift+⏎ for new line</span>
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#0a0a0b] transition-all hover:scale-105 active:scale-95"
              aria-label="Build"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Example chips */}
        <div className="mx-auto mt-8 flex max-w-[720px] flex-wrap justify-center gap-2">
          {EXAMPLES.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setPrompt(label)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] text-white/75 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5 text-white/50" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-[1100px] px-6 pb-24 sm:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step n="1" title="Describe it" body="Tell Nive what you want to build in plain English. Any kind of web app." />
          <Step n="2" title="See it built" body="Watch the UI, pages, and logic come together in seconds, with a live preview." />
          <Step n="3" title="Ship it" body="Iterate, refine, and publish to a public URL. Your app, your domain." />
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
      <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[13px] font-semibold text-white">
        {n}
      </div>
      <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-white/60">{body}</p>
    </div>
  );
}
