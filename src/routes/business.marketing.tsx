import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Download, Loader2, Megaphone, Sparkles, Copy, Check, FileText, Compass,
  Image as ImageIcon, Layout, Palette, X, Plus, Trash2, Search, Mail, Target, Globe,
} from "lucide-react";
import { Ribbon } from "@/components/Ribbon";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { useUsage, UsageBadge } from "@/components/UsageBadge";
import {
  generateMarketing, generateCampaign, generateBlog, generateStrategy, generateHeroWireframe,
  getBrandProfile, saveBrandProfile,
  generateCompetitor, generateEmailDrip, generateAdPack, generateLandingHtml,
  type MarketingResult, type CampaignResult, type BlogResult, type StrategyResult,
  type HeroWireframeResult, type BrandProfile,
  type CompetitorResult, type EmailDripResult, type AdPackResult, type LandingHtmlResult,
} from "@/lib/marketing.functions";

export const Route = createFileRoute("/business/marketing")({
  head: () => ({
    meta: [
      { title: "AI Marketing Suite — Nive AI for Business" },
      { name: "description", content: "9 modes: quick copy, campaigns, SEO blog, 30-day strategy, hero+wireframe, competitor research, email drip, ad pack, landing-page HTML." },
      { property: "og:title", content: "AI Marketing Suite — Nive AI" },
      { property: "og:description", content: "Nine marketing modes powered by AI, tuned to your brand voice." },
    ],
    links: [{ rel: "canonical", href: "/business/marketing" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <MarketingPage />
    </BusinessAuthGate>
  ),
});

type Mode = "quick" | "campaign" | "blog" | "strategy" | "hero" | "competitor" | "drip" | "adpack" | "landing";

const TABS: { id: Mode; label: string; icon: any; credits: number }[] = [
  { id: "quick", label: "Quick copy", icon: Sparkles, credits: 1 },
  { id: "campaign", label: "Campaign pack", icon: Megaphone, credits: 3 },
  { id: "blog", label: "SEO blog", icon: FileText, credits: 3 },
  { id: "strategy", label: "30-day strategy", icon: Compass, credits: 2 },
  { id: "hero", label: "Hero + wireframe", icon: Layout, credits: 2 },
  { id: "competitor", label: "Competitor + SEO", icon: Search, credits: 3 },
  { id: "drip", label: "Email drip (5)", icon: Mail, credits: 3 },
  { id: "adpack", label: "Ad pack", icon: Target, credits: 3 },
  { id: "landing", label: "Landing HTML", icon: Globe, credits: 3 },
];

const TONES = ["professional","friendly","bold","playful","luxurious","minimal","urgent"] as const;
const CHANNELS = [
  { id: "ad", label: "Paid ad" }, { id: "email", label: "Email" },
  { id: "social", label: "Social post" }, { id: "landing", label: "Landing hero" },
] as const;

function MarketingPage() {
  const { usage, setUsage } = useUsage("marketing");
  const [mode, setMode] = useState<Mode>("quick");
  const [brandOpen, setBrandOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}>
      <Ribbon />

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/business" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive<span className="ml-1 text-[#635bff]">/business</span>
        </Link>
        <div className="flex items-center gap-3">
          <UsageBadge usage={usage} onTopupSuccess={(u) => setUsage(u)} />
          <button onClick={() => setBrandOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0a2540] hover:border-[#635bff] hover:text-[#635bff]">
            <Palette className="h-3.5 w-3.5" /> Brand voice
          </button>
          <Link to="/business" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 hover:text-[#635bff]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1240px] px-6 pb-24 pt-6 sm:px-10 sm:pt-10">
        <div className="mb-6 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">
            <Megaphone className="h-3.5 w-3.5" /> AI Marketing Suite
          </div>
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#0a2540] sm:text-[44px]">
            From one prompt to a full marketing system.
          </h1>
          <p className="mt-3 text-[15px] text-[#425466]">
            Quick copy, campaign packs (ads + email + social + landing), SEO blog posts, 30-day
            growth strategies, and AI hero images with landing wireframes — all tuned to your saved brand voice.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl bg-[#f6f9fc] p-1.5 ring-1 ring-[#e3e8ee]">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setMode(t.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold transition-all ${
                  mode === t.id ? "bg-white text-[#635bff] shadow-sm" : "text-[#697386] hover:text-[#0a2540]"
                }`}>
                <Icon className="h-3.5 w-3.5" /> {t.label}
                <span className="ml-1 rounded-sm bg-[#635bff]/10 px-1 text-[10px] text-[#635bff]">{t.credits}c</span>
              </button>
            );
          })}
        </div>

        {mode === "quick" && <QuickPanel usage={usage} setUsage={setUsage} />}
        {mode === "campaign" && <CampaignPanel usage={usage} setUsage={setUsage} />}
        {mode === "blog" && <BlogPanel usage={usage} setUsage={setUsage} />}
        {mode === "strategy" && <StrategyPanel usage={usage} setUsage={setUsage} />}
        {mode === "hero" && <HeroPanel usage={usage} setUsage={setUsage} />}
      </main>

      {brandOpen && <BrandVoiceDrawer onClose={() => setBrandOpen(false)} />}
    </div>
  );
}

// ---------- Shared sub-components ----------

type PanelProps = { usage: any; setUsage: (u: any) => void };

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08)] ring-1 ring-[#e3e8ee]">{children}</div>;
}

function CopyableBlock({ label, text, children }: { label: string; text: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#697386]">{label}</span>
        <button type="button" onClick={async () => {
          try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
        }} className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#697386] hover:text-[#635bff]">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-4">{children}</div>
    </div>
  );
}

function GenerateButton({ loading, children, onClick, disabled }: { loading: boolean; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6] disabled:opacity-60">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {children}
    </button>
  );
}

function ErrorMsg({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="mt-3 rounded-md bg-[#fff1f0] px-3 py-2 text-[12.5px] text-[#c0392b]">{message}</p>;
}

function downloadText(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============ 1. Quick panel ============

function QuickPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateMarketing);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["id"]>("ad");
  const [result, setResult] = useState<MarketingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Tell us what you're selling first.");
    if (usage && usage.remaining < 1) return setError(`Need 1 credit, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { product: product.trim(), audience: audience.trim(), tone, channel } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product / service</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 280))} rows={3}
          placeholder="e.g. Cold-pressed coffee subscription for remote workers"
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />

        <Label className="mt-3">Audience (optional)</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />

        <Label className="mt-3">Tone</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button key={t} onClick={() => setTone(t)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${tone === t ? "border-[#635bff] bg-[#635bff] text-white" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>
              {t}
            </button>
          ))}
        </div>

        <Label className="mt-3">Channel</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {CHANNELS.map((c) => (
            <button key={c.id} onClick={() => setChannel(c.id)}
              className={`rounded-md border px-3 py-2 text-[13px] font-medium ${channel === c.id ? "border-[#635bff] bg-[#635bff]/8 text-[#635bff]" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>
              {c.label}
            </button>
          ))}
        </div>

        <GenerateButton loading={loading} onClick={run}>Generate copy (1 credit)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>

      <Card>
        <h2 className="text-[16px] font-semibold">Generated copy</h2>
        {!result ? <Empty>Fill in the form to generate.</Empty> : (
          <div className="mt-5 space-y-5">
            <CopyableBlock label="Headline" text={result.headline}>
              <p className="text-[20px] font-semibold leading-snug text-[#0a2540]">{result.headline}</p>
            </CopyableBlock>
            <CopyableBlock label="Variants" text={result.variants.join("\n")}>
              <ul className="space-y-1.5 text-[14px] text-[#3c4257]">
                {result.variants.map((v, i) => <li key={i} className="flex gap-2"><span className="text-[#697386]">{i + 1}.</span><span>{v}</span></li>)}
              </ul>
            </CopyableBlock>
            <CopyableBlock label="Body" text={result.body}>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#3c4257]">{result.body}</p>
            </CopyableBlock>
            <CopyableBlock label="Call to action" text={result.cta}>
              <span className="inline-flex items-center rounded-md bg-[#635bff] px-3 py-1.5 text-[13px] font-semibold text-white">{result.cta}</span>
            </CopyableBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ 2. Campaign panel ============

function CampaignPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateCampaign);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product first.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { product: product.trim(), audience: audience.trim(), tone } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const downloadAll = () => {
    if (!result) return;
    const txt = `CAMPAIGN PACK — ${product}\n\nAD HEADLINES\n${result.ad_headlines.map((h,i)=>`${i+1}. ${h}`).join("\n")}\n\nAD BODIES\n${result.ad_bodies.map((b,i)=>`${i+1}. ${b}`).join("\n\n")}\n\nEMAIL SUBJECTS\n${result.email_subjects.map((s,i)=>`${i+1}. ${s}`).join("\n")}\n\nEMAIL BODY\n${result.email_body}\n\nTWITTER\n${result.twitter_post}\n\nLINKEDIN\n${result.linkedin_post}\n\nINSTAGRAM\n${result.instagram_caption}\n${result.instagram_hashtags.join(" ")}\n\nLANDING\nH1: ${result.landing.h1}\nSubhead: ${result.landing.subhead}\nBullets:\n${result.landing.bullets.map(b=>`- ${b}`).join("\n")}\nCTA: ${result.landing.cta}`;
    downloadText(`campaign-${Date.now()}.txt`, txt);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product / service</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 280))} rows={3}
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Audience</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Tone</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button key={t} onClick={() => setTone(t)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${tone === t ? "border-[#635bff] bg-[#635bff] text-white" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>{t}</button>
          ))}
        </div>
        <GenerateButton loading={loading} onClick={run}>Generate full campaign (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Campaign assets</h2>
          <button disabled={!result} onClick={downloadAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0a2540] hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> Download .txt
          </button>
        </div>
        {!result ? <Empty>Your full campaign pack appears here.</Empty> : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <CopyableBlock label="Ad headlines" text={result.ad_headlines.join("\n")}>
              <ul className="space-y-1 text-[13.5px] text-[#3c4257]">
                {result.ad_headlines.map((h, i) => <li key={i}>{i + 1}. {h}</li>)}
              </ul>
            </CopyableBlock>
            <CopyableBlock label="Ad bodies" text={result.ad_bodies.join("\n\n")}>
              <ul className="space-y-2 text-[13px] text-[#3c4257]">{result.ad_bodies.map((b, i) => <li key={i}>• {b}</li>)}</ul>
            </CopyableBlock>
            <CopyableBlock label="Email subjects" text={result.email_subjects.join("\n")}>
              <ul className="space-y-1 text-[13.5px] text-[#3c4257]">{result.email_subjects.map((s, i) => <li key={i}>{i + 1}. {s}</li>)}</ul>
            </CopyableBlock>
            <CopyableBlock label="Email body" text={result.email_body}>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#3c4257]">{result.email_body}</p>
            </CopyableBlock>
            <CopyableBlock label="Twitter" text={result.twitter_post}>
              <p className="text-[13px] text-[#3c4257]">{result.twitter_post}</p>
            </CopyableBlock>
            <CopyableBlock label="LinkedIn" text={result.linkedin_post}>
              <p className="whitespace-pre-wrap text-[13px] text-[#3c4257]">{result.linkedin_post}</p>
            </CopyableBlock>
            <CopyableBlock label="Instagram" text={`${result.instagram_caption}\n\n${result.instagram_hashtags.join(" ")}`}>
              <p className="text-[13px] text-[#3c4257]">{result.instagram_caption}</p>
              <p className="mt-2 text-[12px] text-[#635bff]">{result.instagram_hashtags.join(" ")}</p>
            </CopyableBlock>
            <CopyableBlock label="Landing page" text={`${result.landing.h1}\n${result.landing.subhead}\n${result.landing.bullets.map(b => `- ${b}`).join("\n")}\nCTA: ${result.landing.cta}`}>
              <p className="text-[15px] font-bold text-[#0a2540]">{result.landing.h1}</p>
              <p className="mt-1 text-[13px] text-[#425466]">{result.landing.subhead}</p>
              <ul className="mt-2 space-y-1 text-[13px] text-[#3c4257]">
                {result.landing.bullets.map((b, i) => <li key={i}>• {b}</li>)}
              </ul>
              <span className="mt-2 inline-flex rounded-md bg-[#635bff] px-3 py-1 text-[12.5px] font-semibold text-white">{result.landing.cta}</span>
            </CopyableBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ 3. Blog panel ============

function BlogPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateBlog);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [result, setResult] = useState<BlogResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (topic.trim().length < 3) return setError("Tell us the topic first.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { topic: topic.trim(), audience, tone, keywords } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const downloadMd = () => {
    if (!result) return;
    const md = `---\ntitle: ${result.title}\nslug: ${result.slug}\ndescription: ${result.meta_description}\n---\n\n# ${result.title}\n\n${result.body_markdown}\n\n## FAQ\n${result.faqs.map(f => `\n**${f.q}**\n\n${f.a}\n`).join("")}`;
    downloadText(`${result.slug || "blog"}.md`, md, "text/markdown");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Topic</Label>
        <textarea value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 280))} rows={2}
          placeholder="e.g. How to migrate from Stripe to Razorpay in India"
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Audience</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Target keywords (comma-separated)</Label>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value.slice(0, 200))} placeholder="razorpay setup, indian payments"
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Tone</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button key={t} onClick={() => setTone(t)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${tone === t ? "border-[#635bff] bg-[#635bff] text-white" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>{t}</button>
          ))}
        </div>
        <GenerateButton loading={loading} onClick={run}>Generate SEO blog (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Blog post</h2>
          <button disabled={!result} onClick={downloadMd}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> .md
          </button>
        </div>
        {!result ? <Empty>Your 700–1000 word SEO article appears here.</Empty> : (
          <div className="mt-5 space-y-4">
            <CopyableBlock label="Title" text={result.title}><p className="text-[18px] font-bold">{result.title}</p></CopyableBlock>
            <div className="grid gap-3 sm:grid-cols-2">
              <CopyableBlock label="Slug" text={result.slug}><code className="text-[12.5px] text-[#3c4257]">{result.slug}</code></CopyableBlock>
              <CopyableBlock label="Meta description" text={result.meta_description}>
                <p className="text-[12.5px] text-[#3c4257]">{result.meta_description}</p>
                <p className="mt-1 text-[10.5px] text-[#697386]">{result.meta_description.length} chars</p>
              </CopyableBlock>
            </div>
            <CopyableBlock label="Outline" text={result.outline.join("\n")}>
              <ul className="space-y-0.5 text-[13px] text-[#3c4257]">{result.outline.map((o, i) => <li key={i}>• {o}</li>)}</ul>
            </CopyableBlock>
            <CopyableBlock label="Body (markdown)" text={result.body_markdown}>
              <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#3c4257]">{result.body_markdown}</pre>
            </CopyableBlock>
            <CopyableBlock label="FAQs" text={result.faqs.map(f => `${f.q}\n${f.a}`).join("\n\n")}>
              <div className="space-y-2 text-[13px]">
                {result.faqs.map((f, i) => (
                  <div key={i}><p className="font-semibold text-[#0a2540]">{f.q}</p><p className="text-[#3c4257]">{f.a}</p></div>
                ))}
              </div>
            </CopyableBlock>
            {result.internal_links.length > 0 && (
              <CopyableBlock label="Suggested internal links" text={result.internal_links.join("\n")}>
                <ul className="space-y-0.5 text-[12.5px] text-[#635bff]">{result.internal_links.map((l, i) => <li key={i}>→ {l}</li>)}</ul>
              </CopyableBlock>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ 4. Strategy panel ============

function StrategyPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateStrategy);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("acquire first 1000 customers");
  const [budget, setBudget] = useState("lean");
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product first.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { product: product.trim(), audience, goal, budget } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const downloadMd = () => {
    if (!result) return;
    const md = `# 30-day Marketing Strategy — ${product}\n\n## Positioning\n${result.positioning}\n\n## Target segments\n${result.segments.map(s => `### ${s.name}\n${s.description}\n\n_Pain:_ ${s.pain}`).join("\n\n")}\n\n## Channel mix\n${result.channels.map(c => `- **${c.name}** (${c.weekly_cadence}) — ${c.why}`).join("\n")}\n\n## Content pillars\n${result.content_pillars.map(p => `- ${p}`).join("\n")}\n\n## KPIs\n${result.kpis.map(k => `- **${k.metric}**: ${k.target}`).join("\n")}\n\n## 30-day plan\n${result.week_plan.map(w => `### Week ${w.week} — ${w.focus}\n${w.actions.map(a => `- ${a}`).join("\n")}`).join("\n\n")}`;
    downloadText(`strategy-${Date.now()}.md`, md, "text/markdown");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product / company</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 280))} rows={2}
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Audience</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">30-day goal</Label>
        <input value={goal} onChange={(e) => setGoal(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Budget level</Label>
        <select value={budget} onChange={(e) => setBudget(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]">
          <option value="bootstrapped">Bootstrapped (₹0–10k/mo)</option>
          <option value="lean">Lean (₹10k–50k/mo)</option>
          <option value="funded">Funded (₹50k–5L/mo)</option>
          <option value="enterprise">Enterprise (₹5L+/mo)</option>
        </select>
        <GenerateButton loading={loading} onClick={run}>Generate strategy (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">30-day plan</h2>
          <button disabled={!result} onClick={downloadMd}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> .md
          </button>
        </div>
        {!result ? <Empty>Your go-to-market plan will appear here.</Empty> : (
          <div className="mt-5 space-y-4">
            <CopyableBlock label="Positioning" text={result.positioning}>
              <p className="text-[14px] leading-relaxed text-[#0a2540]">{result.positioning}</p>
            </CopyableBlock>
            <CopyableBlock label="Target segments" text={result.segments.map(s => `${s.name}: ${s.description} (pain: ${s.pain})`).join("\n")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {result.segments.map((s, i) => (
                  <div key={i} className="rounded-md border border-[#eef1f5] bg-white p-3">
                    <p className="text-[13px] font-semibold text-[#635bff]">{s.name}</p>
                    <p className="mt-1 text-[12px] text-[#3c4257]">{s.description}</p>
                    <p className="mt-1 text-[11.5px] italic text-[#697386]">Pain: {s.pain}</p>
                  </div>
                ))}
              </div>
            </CopyableBlock>
            <CopyableBlock label="Channel mix" text={result.channels.map(c => `${c.name} (${c.weekly_cadence}): ${c.why}`).join("\n")}>
              <ul className="space-y-1.5 text-[13px] text-[#3c4257]">
                {result.channels.map((c, i) => (
                  <li key={i}><b className="text-[#0a2540]">{c.name}</b> · <span className="text-[#635bff]">{c.weekly_cadence}</span> — {c.why}</li>
                ))}
              </ul>
            </CopyableBlock>
            <div className="grid gap-3 sm:grid-cols-2">
              <CopyableBlock label="Content pillars" text={result.content_pillars.join("\n")}>
                <ul className="space-y-1 text-[13px] text-[#3c4257]">{result.content_pillars.map((p, i) => <li key={i}>• {p}</li>)}</ul>
              </CopyableBlock>
              <CopyableBlock label="KPIs" text={result.kpis.map(k => `${k.metric}: ${k.target}`).join("\n")}>
                <ul className="space-y-1 text-[13px] text-[#3c4257]">
                  {result.kpis.map((k, i) => <li key={i}><b>{k.metric}</b>: {k.target}</li>)}
                </ul>
              </CopyableBlock>
            </div>
            <CopyableBlock label="Week-by-week" text={result.week_plan.map(w => `Week ${w.week} — ${w.focus}\n${w.actions.map(a => `- ${a}`).join("\n")}`).join("\n\n")}>
              <div className="space-y-3">
                {result.week_plan.map((w) => (
                  <div key={w.week} className="rounded-md border border-[#eef1f5] bg-white p-3">
                    <p className="text-[13px] font-bold text-[#0a2540]">Week {w.week} — <span className="font-medium text-[#635bff]">{w.focus}</span></p>
                    <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-[#3c4257]">
                      {w.actions.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </CopyableBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ 5. Hero + wireframe panel ============

function HeroPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateHeroWireframe);
  const [product, setProduct] = useState("");
  const [style, setStyle] = useState<"minimal" | "vibrant" | "luxury" | "techy" | "warm" | "editorial">("minimal");
  const [result, setResult] = useState<HeroWireframeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product first.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { product: product.trim(), style } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const imgSrc = result?.image_base64 ? `data:${result.image_mime};base64,${result.image_base64}` : null;

  const downloadImage = () => {
    if (!imgSrc || !result) return;
    const a = document.createElement("a"); a.href = imgSrc; a.download = `hero-${Date.now()}.png`; a.click();
  };
  const downloadWireframe = () => {
    if (!result) return;
    downloadText(`wireframe-${Date.now()}.json`, JSON.stringify(result.wireframe, null, 2), "application/json");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 280))} rows={2}
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Visual style</Label>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {(["minimal","vibrant","luxury","techy","warm","editorial"] as const).map((s) => (
            <button key={s} onClick={() => setStyle(s)}
              className={`rounded-md border px-3 py-2 text-[12.5px] font-medium ${style === s ? "border-[#635bff] bg-[#635bff]/8 text-[#635bff]" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>{s}</button>
          ))}
        </div>
        <GenerateButton loading={loading} onClick={run}>Generate hero + wireframe (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Landing preview</h2>
          <div className="flex gap-1.5">
            <button disabled={!imgSrc} onClick={downloadImage}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
              <ImageIcon className="h-3.5 w-3.5" /> Image
            </button>
            <button disabled={!result} onClick={downloadWireframe}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
              <Download className="h-3.5 w-3.5" /> .json
            </button>
          </div>
        </div>

        {!result ? <Empty>Your AI hero image and landing wireframe appear here.</Empty> : (
          <div className="mt-5 space-y-4">
            <div className="overflow-hidden rounded-lg border border-[#eef1f5]">
              {imgSrc ? (
                <img src={imgSrc} alt="Generated hero" className="h-auto w-full" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-[#f6f9fc] text-[12.5px] text-[#697386]">
                  {result.image_error ?? "No image"}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#eef1f5] bg-white p-5">
              <p className="text-[24px] font-bold leading-tight text-[#0a2540]">{result.wireframe.hero.h1}</p>
              <p className="mt-2 text-[14px] text-[#425466]">{result.wireframe.hero.subhead}</p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-md bg-[#635bff] px-3 py-1.5 text-[12.5px] font-semibold text-white">{result.wireframe.hero.cta_primary}</span>
                <span className="rounded-md border border-[#e3e8ee] px-3 py-1.5 text-[12.5px] font-semibold text-[#0a2540]">{result.wireframe.hero.cta_secondary}</span>
              </div>
              <p className="mt-4 text-[12px] uppercase tracking-wider text-[#697386]">Social proof</p>
              <p className="text-[13px] text-[#3c4257]">{result.wireframe.social_proof}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {result.wireframe.features.map((f, i) => (
                  <div key={i} className="rounded-md border border-[#eef1f5] bg-[#fafbfc] p-3">
                    <p className="text-[13px] font-semibold text-[#0a2540]">{f.title}</p>
                    <p className="mt-1 text-[12px] text-[#3c4257]">{f.body}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[12px] uppercase tracking-wider text-[#697386]">Pricing teaser</p>
              <p className="text-[13px] text-[#3c4257]">{result.wireframe.pricing_teaser}</p>

              <p className="mt-4 text-[12px] uppercase tracking-wider text-[#697386]">FAQ</p>
              <div className="space-y-2">
                {result.wireframe.faq.map((f, i) => (
                  <div key={i}><p className="text-[13px] font-semibold text-[#0a2540]">{f.q}</p><p className="text-[12.5px] text-[#3c4257]">{f.a}</p></div>
                ))}
              </div>

              <div className="mt-4 rounded-md bg-[#635bff]/8 p-3 text-center text-[13px] font-semibold text-[#635bff]">
                {result.wireframe.footer_cta}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ Brand voice drawer ============

function BrandVoiceDrawer({ onClose }: { onClose: () => void }) {
  const fetchBrand = useServerFn(getBrandProfile);
  const save = useServerFn(saveBrandProfile);
  const [brand, setBrand] = useState<BrandProfile>({
    brand_name: "", voice: "", audience: "", usp: "", keywords: [], forbidden_words: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBrand();
        if (data) setBrand(data);
      } catch {} finally { setLoading(false); }
    })();
  }, [fetchBrand]);

  const handleSave = async () => {
    setError(null); setSaving(true);
    try {
      await save({ data: brand });
      setSavedAt(Date.now());
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); } finally { setSaving(false); }
  };

  const addItem = (key: "keywords" | "forbidden_words", val: string) => {
    const v = val.trim().slice(0, 60);
    if (!v) return;
    setBrand((b) => ({ ...b, [key]: [...(b[key] ?? []), v].slice(0, 20) }));
  };
  const removeItem = (key: "keywords" | "forbidden_words", idx: number) =>
    setBrand((b) => ({ ...b, [key]: (b[key] ?? []).filter((_, i) => i !== idx) }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0a2540]/40" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold tracking-tight text-[#0a2540]">Brand voice</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[#697386] hover:bg-[#f6f9fc]"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-[12.5px] text-[#697386]">Save once. Applied to every generation across all marketing modes.</p>

        {loading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#635bff]" /></div>
        ) : (
          <div className="mt-5 space-y-3">
            <div>
              <Label>Brand name</Label>
              <input value={brand.brand_name} onChange={(e) => setBrand({ ...brand, brand_name: e.target.value.slice(0, 100) })}
                className="mt-1.5 w-full rounded-md border border-[#e3e8ee] px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
            </div>
            <div>
              <Label>Voice (3–4 adjectives or one sentence)</Label>
              <input value={brand.voice} onChange={(e) => setBrand({ ...brand, voice: e.target.value.slice(0, 300) })}
                placeholder="confident, warm, plainspoken; no jargon"
                className="mt-1.5 w-full rounded-md border border-[#e3e8ee] px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
            </div>
            <div>
              <Label>Default audience</Label>
              <input value={brand.audience} onChange={(e) => setBrand({ ...brand, audience: e.target.value.slice(0, 300) })}
                className="mt-1.5 w-full rounded-md border border-[#e3e8ee] px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
            </div>
            <div>
              <Label>Unique selling point (USP)</Label>
              <textarea value={brand.usp} rows={2} onChange={(e) => setBrand({ ...brand, usp: e.target.value.slice(0, 400) })}
                className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
            </div>

            <TagInput label="Preferred keywords" items={brand.keywords ?? []} onAdd={(v) => addItem("keywords", v)} onRemove={(i) => removeItem("keywords", i)} />
            <TagInput label="Forbidden words" items={brand.forbidden_words ?? []} onAdd={(v) => addItem("forbidden_words", v)} onRemove={(i) => removeItem("forbidden_words", i)} />

            <button onClick={handleSave} disabled={saving}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] hover:bg-[#5048d6] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save brand voice
            </button>
            {savedAt && <p className="text-center text-[12px] text-[#0a8a3a]">Saved ✓</p>}
            <ErrorMsg message={error} />
          </div>
        )}
      </div>
    </div>
  );
}

function TagInput({ label, items, onAdd, onRemove }: { label: string; items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void }) {
  const [input, setInput] = useState("");
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#f6f9fc] px-2.5 py-1 text-[12px] text-[#0a2540] ring-1 ring-[#e3e8ee]">
            {it}
            <button onClick={() => onRemove(i)} className="text-[#697386] hover:text-[#c0392b]"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="add and press Enter"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(input); setInput(""); } }}
          className="flex-1 rounded-md border border-[#e3e8ee] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[#635bff]" />
        <button onClick={() => { onAdd(input); setInput(""); }}
          className="rounded-md bg-[#f6f9fc] px-2.5 py-1.5 text-[12.5px] text-[#0a2540] ring-1 ring-[#e3e8ee] hover:bg-white">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#697386] ${className}`}>{children}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex h-72 items-center justify-center rounded-lg border border-dashed border-[#e3e8ee] text-[13.5px] text-[#697386]">{children}</div>;
}
