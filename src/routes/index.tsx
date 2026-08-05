import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Code2, Share2, Briefcase, Database, Megaphone, BarChart3, BookOpen, Tag,
  Mic, Palette, Workflow, Bot, ArrowRight, Sparkles, LogIn, Shield,
  BookMarked, Search, LineChart, LifeBuoy, Blocks, Scale, ClipboardList, Languages, Users,
} from "lucide-react";

import { Ribbon } from "@/components/Ribbon";
import { BetaBanner } from "@/components/BetaBanner";
import niveLogo from "@/assets/nive-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nive AI — One ecosystem for code, content & business AI" },
      { name: "description", content: "Nive AI is an ecosystem of AI tools: a coding copilot with live preview, a social media manager, synthetic data generation, and a 19-mode marketing suite." },
      { property: "og:title", content: "Nive AI — One ecosystem for code, content & business AI" },
      { property: "og:description", content: "Pick a workspace: Code Studio, Social Manager, Synthetic Data, Marketing Suite and more — all inside one Nive AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

type Tool = {
  title: string;
  desc: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  accent: string;
  soon?: boolean;
};

const PRIMARY: Tool[] = [
  {
    title: "Code Studio",
    desc: "Chat with Nive to generate production-quality multi-file code — React, SwiftUI, Python, ESP32 firmware — with live preview and file tree.",
    href: "/code",
    icon: Code2,
    tag: "Builders",
    accent: "#635bff",
  },
  {
    title: "Social Manager",
    desc: "Plan, write and schedule posts across platforms. Hooks, captions, hashtags and a calendar that keeps your feed alive.",
    href: "/social",
    icon: Share2,
    tag: "Content",
    accent: "#ff4d8d",
  },
  {
    title: "Business Suite",
    desc: "The commercial side of Nive: synthetic data, AI marketing, usage analytics and team plans in one workspace.",
    href: "/business",
    icon: Briefcase,
    tag: "Teams",
    accent: "#00b3d4",
  },
];

const TOOLS: Tool[] = [
  { title: "Synthetic Data", desc: "Schema-aware, privacy-safe datasets — 32+ field types, 4 locales, relational blueprints, CSV/JSON/SQL export.", href: "/business/synthetic-data", icon: Database, accent: "#635bff" },
  { title: "Marketing Suite", desc: "19 modes: campaigns, SEO blogs, ad packs, personas, press releases, case studies, A/B variants and more.", href: "/business/marketing", icon: Megaphone, accent: "#ff5a36" },
  { title: "Usage & Credits", desc: "Track daily credit burn per tool, see limits, and top up when a launch week gets busy.", href: "/business/usage", icon: BarChart3, accent: "#00b3d4" },
  { title: "Documentation", desc: "Quickstarts, tool-by-tool guides, security notes, public API reference and FAQ.", href: "/docs", icon: BookOpen, accent: "#0a2540" },
  { title: "Plans & Pricing", desc: "Free tier for exploring, paid plans for daily work. One account unlocks every Nive tool.", href: "/pricing", icon: Tag, accent: "#635bff" },
  { title: "Voice Agents", desc: "Speak your brief and get back code, copy, a call script or clean notes — hands-free building.", href: "/voice", icon: Mic, accent: "#7a5cff", tag: "New" },
  { title: "Design Studio", desc: "Generate UI concepts, palettes, type pairings, hero art direction and ready-to-paste CSS tokens.", href: "/design", icon: Palette, accent: "#ff4d8d", tag: "New" },
  { title: "Automations", desc: "Chain Nive steps into workflows: brief → copy → schedule → report, each step feeding the next.", href: "/automations", icon: Workflow, accent: "#00b3d4", tag: "New" },
  { title: "Custom Agents", desc: "Save prompts, skills and brand context as a reusable agent your whole team can run.", href: "/agents", icon: Bot, accent: "#0a2540" },
  { title: "Docs & Knowledge", desc: "Turn specs, contracts and transcripts into summaries, grounded Q&A, wikis, FAQs and onboarding guides.", href: "/knowledge", icon: BookMarked, accent: "#0a7c66", tag: "New" },
  { title: "SEO & Analytics", desc: "Keyword clusters, on-page audits, content briefs, technical checklists, JSON-LD and stakeholder reports.", href: "/seo", icon: Search, accent: "#ff8a00", tag: "New" },
  { title: "Data Analyst", desc: "Paste a CSV and get insights, PostgreSQL, cleaning plans, chart specs, stats review and forecasts.", href: "/analyst", icon: LineChart, accent: "#2563eb", tag: "New" },
  { title: "Support & Email", desc: "Ticket replies, macro libraries, escalation handoffs, tone rewrites and help-centre articles.", href: "/support", icon: LifeBuoy, accent: "#7c3aed", tag: "New" },
  { title: "Marketplace", desc: "Browse every Nive tool, agent and integration — install what you use, publish your own agent recipes.", href: "/marketplace", icon: Blocks, accent: "#635bff", tag: "New" },
  { title: "Legal & Policy", desc: "Draft policies and terms, review clauses with a risk table, rewrite legalese in plain English.", href: "/legal", icon: Scale, accent: "#0a2540", tag: "New" },
  { title: "Product & PRD", desc: "PRDs, user stories with acceptance criteria, roadmaps, RICE scoring and release notes.", href: "/product", icon: ClipboardList, accent: "#2563eb", tag: "New" },
  { title: "Translation & i18n", desc: "Translate, localise and transcreate copy, then export ready-to-import locale files.", href: "/translate", icon: Languages, accent: "#0a7c66", tag: "New" },
  { title: "People & Hiring", desc: "Job posts, scorecards, interview kits, résumé screens, offers and onboarding plans.", href: "/hr", icon: Users, accent: "#7c3aed", tag: "New" },

];

function Home() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div
      className="min-h-screen bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <BetaBanner />
      <div className="relative overflow-hidden">
        <Ribbon />

        <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 sm:px-10">
          <Link to="/" className="flex items-center" aria-label="Nive AI home">
            <img src={niveLogo.url} alt="Nive AI" className="h-14 w-auto sm:h-16" />
          </Link>
          <nav className="hidden items-center gap-6 text-[15px] font-medium md:flex">
            <Link to="/code" className="transition-colors hover:text-[#635bff]">Code</Link>
            <Link to="/social" className="transition-colors hover:text-[#635bff]">Social</Link>
            <Link to="/business" className="transition-colors hover:text-[#635bff]">Business</Link>
            <Link to="/marketplace" className="transition-colors hover:text-[#635bff]">Marketplace</Link>
            <Link to="/docs" className="transition-colors hover:text-[#635bff]">Docs</Link>
            <Link to="/pricing" className="transition-colors hover:text-[#635bff]">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2.5">
            {signedIn ? (
              <Link
                to="/account"
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#0a2540] shadow-sm transition-shadow hover:shadow-md sm:inline-flex"
              >
                <Shield className="h-4 w-4" /> Account
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#0a2540] shadow-sm transition-shadow hover:shadow-md sm:inline-flex"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}

            <Link
              to="/code"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#635bff] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0a2540]"
            >
              Open Code Studio <span aria-hidden>›</span>
            </Link>
          </div>
        </header>

        <section className="relative z-10 mx-auto max-w-[1280px] px-6 pb-16 pt-14 sm:px-10 sm:pt-20">
          <p className="mb-5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#635bff]">
            <Sparkles className="h-4 w-4" /> The Nive AI ecosystem
          </p>
          <h1 className="max-w-[900px] text-[42px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[60px] lg:text-[68px]">
            Every AI tool your work needs,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(95deg, #635bff 0%, #00d4ff 45%, #ff4d8d 100%)" }}
            >
              in one place.
            </span>
          </h1>
          <p className="mt-6 max-w-[640px] text-[17px] leading-relaxed text-[#425466]">
            Start where you need to: ship code with a copilot that previews itself, run your social
            calendar, generate privacy-safe datasets, or spin up a full marketing campaign. One
            account, one credit pool, one ecosystem.
          </p>
        </section>
      </div>

      {/* Primary workspaces */}
      <section className="mx-auto max-w-[1280px] px-6 pb-6 sm:px-10">
        <div className="grid gap-5 lg:grid-cols-3">
          {PRIMARY.map((t) => (
            <Link
              key={t.title}
              to={t.href!}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#0a2540]/10 bg-white p-7 shadow-[0_1px_3px_rgba(10,37,64,0.06)] transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-[0_18px_40px_rgba(10,37,64,0.12)]"
            >
              <span
                className="absolute inset-x-0 top-0 h-1 opacity-70 transition-opacity group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, ${t.accent}, transparent)` }}
              />
              <span
                className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: t.accent }}
              >
                <t.icon className="h-5 w-5" />
              </span>
              {t.tag && (
                <span className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8792a2]">
                  {t.tag}
                </span>
              )}
              <h2 className="text-[22px] font-semibold tracking-[-0.01em]">{t.title}</h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[#425466]">{t.desc}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#635bff]">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* All tools */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-0.01em] sm:text-[34px]">All tools</h2>
            <p className="mt-2 text-[15px] text-[#425466]">
              Nine tools, one account, one credit pool — every tile below is live today.
            </p>
          </div>
          <Link to="/docs" className="text-[15px] font-medium text-[#635bff] hover:text-[#0a2540]">
            Read the docs ›
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.title}
              to={t.href!}
              className="group relative overflow-hidden rounded-xl border border-[#0a2540]/10 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_14px_32px_rgba(10,37,64,0.12)]"
            >
              <span
                className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, ${t.accent}, transparent)` }}
              />
              <div className="flex items-start justify-between gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${t.accent}14`, color: t.accent }}
                >
                  <t.icon className="h-5 w-5" />
                </span>
                {t.tag && (
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ backgroundColor: `${t.accent}14`, color: t.accent }}
                  >
                    {t.tag}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-[17px] font-semibold">{t.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#425466]">{t.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#635bff]">
                Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it flows */}
      <section className="border-y border-[#0a2540]/8 bg-[#0a2540] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10">
          <h2 className="text-[26px] font-semibold tracking-[-0.01em] sm:text-[32px]">
            One brief, all the way through
          </h2>
          <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-white/70">
            Speak a brief into Voice Agents, shape the look in Design Studio, run the campaign in
            Automations, then hand the whole thing to a Custom Agent your team can re-run.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Speak it", d: "Dictate the brief hands-free — Nive cleans up the transcript.", href: "/voice" },
              { n: "02", t: "Design it", d: "Palette, type, sections and CSS tokens in one pass.", href: "/design" },
              { n: "03", t: "Run it", d: "Chain steps so each one reads the last one's output.", href: "/automations" },
              { n: "04", t: "Reuse it", d: "Freeze the prompt and brand context into an agent.", href: "/agents" },
            ].map((s) => (
              <Link
                key={s.n}
                to={s.href}
                className="group rounded-xl border border-white/12 bg-white/5 p-5 transition-colors hover:border-white/35 hover:bg-white/10"
              >
                <span className="text-[12px] font-semibold tracking-[0.16em] text-[#00d4ff]">{s.n}</span>
                <p className="mt-2 text-[17px] font-semibold">{s.t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">{s.d}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#00d4ff]">
                  Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Footer strip */}
      <section className="border-t border-[#0a2540]/8 bg-[#f6f9fc]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-12 sm:px-10">
          <div className="flex items-center gap-3 text-[15px] text-[#425466]">
            <Shield className="h-5 w-5 text-[#635bff]" />
            Your data stays yours — synthetic outputs contain no real records.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/code"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#5048d6]"
            >
              Start building <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2540]/12 bg-white px-5 py-2.5 text-[15px] font-medium text-[#0a2540] transition-colors hover:border-[#0a2540]/25"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
