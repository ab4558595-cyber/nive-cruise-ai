import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen, Sparkles, Wand2, Database, CreditCard, Shield, Cpu, Rocket,
  Terminal, Users, KeyRound, Mail, HelpCircle, ChevronRight, Search,
  MessageSquare, Layers, Zap, FileCode, Globe, Lock, Gauge, LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Nive AI" },
      { name: "description", content: "Complete documentation for Nive AI: chat copilot, business suite (marketing + synthetic data), plans, payments, security, and API reference." },
      { property: "og:title", content: "Documentation — Nive AI" },
      { property: "og:description", content: "Complete documentation for Nive AI: chat copilot, business suite, plans, payments, security, and API reference." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/docs" }],
  }),
  component: DocsPage,
});

type Section = {
  id: string;
  title: string;
  icon: LucideIcon;
  content: React.ReactNode;
};

function H({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl md:text-3xl font-semibold tracking-tight mt-10 mb-4">
      {children}
    </h2>
  );
}
function H3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3 id={id} className="scroll-mt-24 text-lg md:text-xl font-semibold mt-6 mb-2 text-foreground">
      {children}
    </h3>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-mono">{children}</code>;
}
function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="rounded-lg bg-muted/60 border border-border p-4 overflow-x-auto text-xs md:text-sm font-mono leading-relaxed mb-4">
      <code>{children}</code>
    </pre>
  );
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground mb-4">{children}</ul>;
}
function Callout({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: React.ReactNode }) {
  const styles = {
    info: "border-primary/30 bg-primary/5 text-foreground",
    warn: "border-amber-500/40 bg-amber-500/5 text-foreground",
    ok: "border-emerald-500/40 bg-emerald-500/5 text-foreground",
  }[tone];
  return <div className={`rounded-lg border ${styles} p-4 my-4 text-sm`}>{children}</div>;
}

function DocsPage() {
  const [query, setQuery] = useState("");

  const sections: Section[] = useMemo(() => [
    {
      id: "overview",
      title: "Overview",
      icon: BookOpen,
      content: (
        <>
          <P>
            <strong>Nive AI</strong> is a two-part product: an <strong>elite coding copilot</strong> that
            generates production code with live preview, and a <strong>Business Suite</strong> that ships
            marketing content and synthetic data generation tools. Everything runs on a serverless
            edge stack with strong authentication and per-user usage tracking.
          </P>
          <H3>What you get</H3>
          <UL>
            <li><strong>Chat copilot</strong> — multi-file code generation, live web preview, presets for web/mobile/embedded/ML.</li>
            <li><strong>Marketing agent</strong> — 19 modes: copy, campaigns, blogs, SEO, hero wireframes, ads, email, personas, and more.</li>
            <li><strong>Synthetic data</strong> — 32+ field types, 4 locales, relational blueprints, AI schema generation, CSV/SQL import.</li>
            <li><strong>Plans &amp; billing</strong> — INR pricing via Razorpay, one-time 30-day access, webhook-driven activation.</li>
            <li><strong>Security</strong> — RLS on every table, rate limits, CSP/HSTS headers, webhook replay protection.</li>
          </UL>
          <Callout tone="ok">
            New here? Jump to <a href="#quickstart" className="underline">Quickstart</a> to sign up and try the copilot in under a minute.
          </Callout>
        </>
      ),
    },
    {
      id: "quickstart",
      title: "Quickstart",
      icon: Rocket,
      content: (
        <>
          <H3 id="qs-signup">1. Create an account</H3>
          <P>Head to <Link to="/auth" className="underline">/auth</Link> and sign up with email or Google. Email confirmation is enabled — check your inbox.</P>
          <H3 id="qs-first-prompt">2. Send your first prompt</H3>
          <P>Open the home page and pick a preset (Web, iOS, ESP32, Python) or type free-form. Nive AI returns multi-file code with a live preview when applicable.</P>
          <Pre>{`Prompt: Build a React counter with Tailwind, dark mode toggle, and localStorage persistence.`}</Pre>
          <H3 id="qs-business">3. Try the Business Suite</H3>
          <P>Go to <Link to="/business" className="underline">/business</Link>. All tools are unlocked for signed-in users during testing. Daily free credits reset at midnight UTC.</P>
          <Callout>
            The chat page supports keyboard shortcut <Code>⌘K</Code> to open the command palette, and voice input where the browser supports it.
          </Callout>
        </>
      ),
    },
    {
      id: "chat",
      title: "Chat Copilot",
      icon: MessageSquare,
      content: (
        <>
          <P>The copilot is optimized for real deliverables, not chit-chat. It streams multi-file responses, parses them into a file tree, and renders a live preview for web outputs.</P>
          <H3>Features</H3>
          <UL>
            <li><strong>Presets</strong> — one-tap system prompts for React, iOS/SwiftUI, ESP32/Arduino, Python/ML.</li>
            <li><strong>File tree</strong> — every file the model emits is parsed and browsable.</li>
            <li><strong>Live preview</strong> — HTML/React outputs run in a sandboxed iframe.</li>
            <li><strong>Conversations</strong> — persisted per user; rename, delete, and switch from the left sidebar.</li>
            <li><strong>Attachments</strong> — paste images and text files as context.</li>
            <li><strong>Voice input</strong> — browser SpeechRecognition where supported.</li>
          </UL>
          <H3>Shortcuts</H3>
          <UL>
            <li><Code>⌘K</Code> / <Code>Ctrl+K</Code> — command palette</li>
            <li><Code>Enter</Code> — send; <Code>Shift+Enter</Code> — newline</li>
            <li><Code>Esc</Code> — stop streaming</li>
          </UL>
        </>
      ),
    },
    {
      id: "marketing",
      title: "Marketing Agent",
      icon: Wand2,
      content: (
        <>
          <P>19 focused generators, each with structured JSON output and copy/download actions. All results are stateless unless you explicitly save to your brand profile.</P>
          <H3>Modes</H3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {[
              ["Quick Copy", "1"], ["Full Campaign Pack", "3"], ["SEO Blog Writer", "3"],
              ["Marketing Strategy", "2"], ["Hero Wireframe", "2"], ["Competitor + SEO", "3"],
              ["Email Drip", "3"], ["Ad Pack", "2"], ["Landing HTML", "3"],
              ["Social Calendar (30d)", "3"], ["Video / Reels Script", "2"], ["Press Release", "2"],
              ["Cold Outreach", "3"], ["Brand Voice Guidelines", "2"], ["Personas", "2"],
              ["A/B Variants", "1"], ["SEO Meta Pack", "2"], ["Pricing Copy", "2"], ["Case Study", "3"],
            ].map(([name, cost]) => (
              <div key={name} className="flex items-center justify-between rounded-md border border-border bg-card/30 px-3 py-2 text-sm">
                <span>{name}</span>
                <Badge variant="secondary" className="text-xs">{cost} cr</Badge>
              </div>
            ))}
          </div>
          <H3>Brand profile</H3>
          <P>Save tone, do/don't lists, and audience once — every mode reads it automatically for consistent voice.</P>
          <H3>Exports</H3>
          <UL>
            <li>Social Calendar → CSV</li>
            <li>Press Release → <Code>.txt</Code> + <Code>.html</Code></li>
            <li>Case Study → Markdown</li>
            <li>Landing HTML → single-file HTML</li>
          </UL>
        </>
      ),
    },
    {
      id: "synthetic",
      title: "Synthetic Data",
      icon: Database,
      content: (
        <>
          <P>Generate realistic tabular, relational, and time-series data for demos, tests, and training.</P>
          <H3>Capabilities</H3>
          <UL>
            <li><strong>32+ field types</strong> — identity, contact, geo, currency, dates, enums, IPs, URLs, paragraphs.</li>
            <li><strong>Locales</strong> — India, US, EU, Global (names, addresses, phone formats).</li>
            <li><strong>Row count</strong> — up to 5,000 per generation.</li>
            <li><strong>Relational blueprints</strong> — SaaS, E-commerce, CRM, Analytics, Support (multi-table ZIP export).</li>
            <li><strong>AI schema</strong> — describe the dataset in English, get a validated schema.</li>
            <li><strong>Time-series</strong> — user + event streams with funnels and session grouping.</li>
            <li><strong>Import</strong> — bring your own schema via CSV header or SQL DDL.</li>
            <li><strong>Saved schemas</strong> — reusable, private per user.</li>
          </UL>
          <H3>Exports</H3>
          <P>CSV, JSON, and SQL <Code>INSERT</Code> statements. Relational sets export as a ZIP with one file per table.</P>
        </>
      ),
    },
    {
      id: "plans",
      title: "Plans &amp; Billing",
      icon: CreditCard,
      content: (
        <>
          <P>Simple one-time 30-day plans in INR, processed by Razorpay. No auto-renew.</P>
          <H3>Free tier (daily, UTC reset)</H3>
          <UL>
            <li>Chat copilot — generous free usage</li>
            <li>Marketing — 30 credits/day</li>
            <li>Synthetic — 40 credits/day</li>
          </UL>
          <H3>Growth plan</H3>
          <UL>
            <li>2× daily limits on Business tools</li>
            <li>Priority AI model routing</li>
            <li>30-day access from purchase</li>
          </UL>
          <H3>How activation works</H3>
          <UL>
            <li>Checkout opens Razorpay in-page.</li>
            <li>On success, Razorpay redirects back and the client verifies signature server-side.</li>
            <li>A webhook independently activates the plan (belt + suspenders) with replay protection.</li>
            <li>Success page polls the DB for up to 30s so you never see "plan not active" after a real payment.</li>
          </UL>
          <Callout tone="warn">
            If a payment succeeded but your plan didn't activate within 60 seconds, email support with the Razorpay payment ID — activation is idempotent and safe to retry.
          </Callout>
        </>
      ),
    },
    {
      id: "security",
      title: "Security",
      icon: Shield,
      content: (
        <>
          <H3>Application</H3>
          <UL>
            <li>Strict CSP, HSTS, X-Frame-Options, Referrer-Policy on every response.</li>
            <li>Per-IP rate limits on public endpoints (demo, webhooks, auth-adjacent).</li>
            <li>Webhook signature verification + replay protection via <Code>processed_webhook_events</Code>.</li>
            <li>All secrets (Razorpay, AI keys) stored server-side only; never shipped to the client.</li>
          </UL>
          <H3>Data</H3>
          <UL>
            <li><strong>Row-Level Security</strong> enabled on every user table.</li>
            <li>Roles stored in a dedicated <Code>user_roles</Code> table with a <Code>SECURITY DEFINER</Code> <Code>has_role()</Code> function — no client-side role checks.</li>
            <li>Payment tokens excluded from client-readable columns.</li>
            <li>Internal email queue functions restricted to <Code>service_role</Code>.</li>
          </UL>
          <H3>Auth</H3>
          <UL>
            <li>Email + Google OAuth via Supabase.</li>
            <li>No anonymous sign-ups.</li>
            <li>OAuth <Code>redirect_uri</Code> pinned to same-origin.</li>
          </UL>
          <Callout tone="ok">
            Report a vulnerability: <a href="mailto:security@nive-ai.co.in" className="underline">security@nive-ai.co.in</a>. We respond within 48 hours.
          </Callout>
        </>
      ),
    },
    {
      id: "api",
      title: "Public API",
      icon: Terminal,
      content: (
        <>
          <P>Two public endpoints exist today. Everything else is internal to signed-in users.</P>
          <H3>POST <Code>/api/public/try-ai</Code></H3>
          <P>Free demo endpoint. Rate limited to 10 requests / hour / IP.</P>
          <Pre>{`curl -X POST https://nive-ai.co.in/api/public/try-ai \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Explain OAuth in 3 bullets."}'`}</Pre>
          <Pre>{`// 200 OK
{ "text": "..." }

// 429
{ "error": "You've hit the free demo limit..." }`}</Pre>
          <H3>POST <Code>/api/public/razorpay/webhook</Code></H3>
          <P>Razorpay-only. Verifies <Code>X-Razorpay-Signature</Code> HMAC-SHA256 against <Code>RAZORPAY_WEBHOOK_SECRET</Code> and activates plans on <Code>payment.captured</Code>. Not for public calls.</P>
        </>
      ),
    },
    {
      id: "stack",
      title: "Tech Stack",
      icon: Cpu,
      content: (
        <>
          <UL>
            <li><strong>Frontend</strong> — React 19, TanStack Router/Start v1, Vite 7, Tailwind v4.</li>
            <li><strong>Backend</strong> — TanStack server functions on Cloudflare Workers (edge).</li>
            <li><strong>Database + Auth</strong> — Managed Postgres with RLS.</li>
            <li><strong>AI</strong> — Lovable AI Gateway (default: <Code>google/gemini-3-flash-preview</Code>).</li>
            <li><strong>Payments</strong> — Razorpay (INR, one-time).</li>
            <li><strong>Email</strong> — Transactional templates via managed email infra.</li>
          </UL>
        </>
      ),
    },
    {
      id: "faq",
      title: "FAQ",
      icon: HelpCircle,
      content: (
        <>
          <H3>Do you train on my data?</H3>
          <P>No. Prompts and generations are not used for training. See <Link to="/privacy" className="underline">Privacy</Link>.</P>
          <H3>Can I get a refund?</H3>
          <P>See the <Link to="/refund" className="underline">Refund Policy</Link>. Payment issues where the plan didn't activate are always refunded or activated on request.</P>
          <H3>What happens after 30 days?</H3>
          <P>You drop back to the free tier automatically. No auto-renew, no surprise charges.</P>
          <H3>Can I self-host?</H3>
          <P>Not today. Reach out if you need an enterprise deployment.</P>
        </>
      ),
    },
  ], []);

  const filtered = query.trim()
    ? sections.filter((s) => {
        const q = query.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.id.includes(q);
      })
    : sections;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Nive AI
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">Docs</span>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/business"><Button variant="ghost" size="sm">Business</Button></Link>
            <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <Link to="/auth"><Button size="sm">Sign in</Button></Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 self-start">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs…"
              className="pl-8"
            />
          </div>
          <nav className="space-y-0.5">
            {filtered.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span dangerouslySetInnerHTML={{ __html: s.title }} />
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                </a>
              );
            })}
          </nav>
          <div className="mt-6 rounded-lg border border-border bg-card/40 p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 mb-1 text-foreground font-medium">
              <Mail className="h-3.5 w-3.5" /> Need help?
            </div>
            <a href="mailto:support@nive-ai.co.in" className="underline">support@nive-ai.co.in</a>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {/* Hero */}
          <section className="mb-10 pb-10 border-b border-border">
            <Badge variant="secondary" className="mb-3"><BookOpen className="h-3 w-3 mr-1" /> Documentation</Badge>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
              Everything you need to build with Nive AI
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              A single-page reference for the copilot, business tools, plans, security, and API.
              Skim the sidebar, or jump to <a href="#quickstart" className="text-foreground underline underline-offset-4">Quickstart</a>.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#chat"><Button size="sm" variant="secondary"><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Chat</Button></a>
              <a href="#marketing"><Button size="sm" variant="secondary"><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Marketing</Button></a>
              <a href="#synthetic"><Button size="sm" variant="secondary"><Database className="h-3.5 w-3.5 mr-1.5" /> Synthetic Data</Button></a>
              <a href="#plans"><Button size="sm" variant="secondary"><CreditCard className="h-3.5 w-3.5 mr-1.5" /> Billing</Button></a>
              <a href="#security"><Button size="sm" variant="secondary"><Shield className="h-3.5 w-3.5 mr-1.5" /> Security</Button></a>
              <a href="#api"><Button size="sm" variant="secondary"><Terminal className="h-3.5 w-3.5 mr-1.5" /> API</Button></a>
            </div>
          </section>

          {filtered.map((s) => {
            const Icon = s.icon;
            return (
              <section key={s.id} className="mb-12">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">{s.title.replace(/&amp;/g, "&")}</span>
                </div>
                <H id={s.id}>{s.title.replace(/&amp;/g, "&")}</H>
                <div className="prose-invert max-w-none">{s.content}</div>
              </section>
            );
          })}

          <footer className="mt-16 pt-8 border-t border-border text-sm text-muted-foreground flex flex-wrap gap-4 justify-between">
            <div>© {new Date().getFullYear()} Nive AI</div>
            <div className="flex gap-4">
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/refund" className="hover:text-foreground">Refund</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
