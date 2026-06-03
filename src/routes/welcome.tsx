import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Cpu, Globe, Smartphone, Terminal, Zap, Shield, Clock, Code2, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Nive AI — Production code for any platform" },
      { name: "description", content: "Nive AI writes production-quality code for web, mobile, embedded, and ML. Start with a 1-day free trial." },
      { property: "og:title", content: "Welcome to Nive AI" },
      { property: "og:description", content: "Production code for any platform. 1-day free trial for new accounts." },
      { property: "og:url", content: "/welcome" },
    ],
    links: [{ rel: "canonical", href: "/welcome" }],
  }),
  component: Welcome,
});

const FEATURES = [
  { icon: Code2, title: "Any language, any platform", body: "From Arduino sketches to React apps to Python ML — one assistant that actually ships." },
  { icon: Zap, title: "Live preview built in", body: "Web outputs render instantly in a side panel. Iterate without leaving the chat." },
  { icon: Globe, title: "Multi-file projects", body: "Real file trees with components, styles and scripts — not just a single snippet." },
  { icon: Shield, title: "Private by default", body: "Your prompts and code are scoped to your account with row-level security." },
];

const PLATFORMS = [
  { icon: Globe, label: "Web" },
  { icon: Smartphone, label: "Mobile" },
  { icon: Cpu, label: "Embedded" },
  { icon: Terminal, label: "Scripts" },
];

function Welcome() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-surface)" }} />
      <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-brand)" }} />

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/welcome" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">Nive AI</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          <Button asChild variant="ghost" size="sm"><Link to="/pricing">Pricing</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
          <Button asChild size="sm" className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
            <Link to="/auth">Start free trial</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-12 text-center sm:pt-20">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Clock className="h-3.5 w-3.5" /> 1-day free trial for new accounts
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Ship code for{" "}
          <span className="bg-gradient-to-r from-primary to-[oklch(0.6_0.22_320)] bg-clip-text text-transparent">any platform</span>
          , in any language.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Nive AI is a senior-engineer coding partner. Describe what you want — firmware, a SwiftUI screen, a Python scraper, a full React app — and get working, multi-file code with a live preview.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-6 text-primary-foreground" style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
            <Link to="/auth">Start 1-day free trial <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6">
            <Link to="/pricing">View pricing</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">No card required • Trial activates instantly on signup</p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {PLATFORMS.map((p) => (
            <div key={p.label} className="flex items-center gap-2">
              <p.icon className="h-4 w-4 text-primary" /> {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-glow)]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trial card */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-3xl border border-primary/40 bg-card/70 p-8 backdrop-blur-md shadow-[var(--shadow-elegant)]">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How the free trial works</h2>
          <p className="mt-2 text-sm text-muted-foreground">Simple, time-boxed, no surprises.</p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Sign up with email — the 1-day trial activates automatically.",
              "Use the full assistant with live preview for 24 hours.",
              "When it ends, upgrade to Starter (₹49) or Pro (₹149) to keep building.",
              "Trial is granted once per account — no perpetual free tier.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground/90">{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
              <Link to="/auth">Create account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nive AI — Crafted for engineers who ship.
      </footer>
    </div>
  );
}
