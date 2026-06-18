import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Download, Loader2, Megaphone, Sparkles, Copy, Check, FileText, Compass,
  Image as ImageIcon, Layout, Palette, X, Plus, Trash2, Search, Mail, Target, Globe,
  Calendar, Video, Newspaper, Send, MessageSquare, Users, FlaskConical, Code2, Tags, BookOpen,
  Quote, Lightbulb, Type, Globe2, Heart, Map as MapIcon, Mic, AtSign, Twitter, Linkedin,
  Youtube, Music2, ShieldQuestion, Percent, Gift, ClipboardList, HelpCircle, Link2, PartyPopper,
  Rocket, FileJson,
} from "lucide-react";
import { Ribbon } from "@/components/Ribbon";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { useUsage, UsageBadge } from "@/components/UsageBadge";
import { CurrentPlanBadge } from "@/components/CurrentPlanBadge";
import {
  generateMarketing, generateCampaign, generateBlog, generateStrategy, generateHeroWireframe,
  getBrandProfile, saveBrandProfile,
  generateCompetitor, generateEmailDrip, generateAdPack, generateLandingHtml,
  generateSocialCalendar, generateVideoScript, generatePressRelease, generateColdOutreach,
  generateBrandVoice, generatePersonas, generateABVariants, generateSeoMeta,
  generatePricingCopy, generateCaseStudy,
  generateMarketingTool, type MarketingToolKey,
  generateMegaPack, megaPackMarkdown,
  type MarketingResult, type CampaignResult, type BlogResult, type StrategyResult,
  type HeroWireframeResult, type BrandProfile,
  type CompetitorResult, type EmailDripResult, type AdPackResult, type LandingHtmlResult,
  type SocialCalendarResult, type VideoScriptResult, type PressReleaseResult, type ColdOutreachResult,
  type BrandVoiceResult, type PersonasResult, type ABVariantsResult, type SeoMetaResult,
  type PricingCopyResult, type CaseStudyResult, type MegaPackResult,
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

type Mode =
  | "megapack"
  | "quick" | "campaign" | "blog" | "strategy" | "hero"
  | "competitor" | "drip" | "adpack" | "landing"
  | "calendar" | "video" | "press" | "outreach" | "voice"
  | "personas" | "abtest" | "seometa" | "pricing" | "casestudy"
  | MarketingToolKey;

const TABS: { id: Mode; label: string; icon: any; credits: number }[] = [
  { id: "megapack", label: "Mega Pack ⚡", icon: Rocket, credits: 8 },
  { id: "quick", label: "Quick copy", icon: Sparkles, credits: 1 },
  { id: "campaign", label: "Campaign pack", icon: Megaphone, credits: 3 },
  { id: "blog", label: "SEO blog", icon: FileText, credits: 3 },
  { id: "strategy", label: "30-day strategy", icon: Compass, credits: 2 },
  { id: "hero", label: "Hero + wireframe", icon: Layout, credits: 2 },
  { id: "competitor", label: "Competitor + SEO", icon: Search, credits: 3 },
  { id: "drip", label: "Email drip (5)", icon: Mail, credits: 3 },
  { id: "adpack", label: "Ad pack", icon: Target, credits: 3 },
  { id: "landing", label: "Landing HTML", icon: Globe, credits: 3 },
  { id: "calendar", label: "Social calendar", icon: Calendar, credits: 3 },
  { id: "video", label: "Video script", icon: Video, credits: 2 },
  { id: "press", label: "Press release", icon: Newspaper, credits: 2 },
  { id: "outreach", label: "Cold outreach", icon: Send, credits: 3 },
  { id: "voice", label: "Brand voice", icon: MessageSquare, credits: 2 },
  { id: "personas", label: "Personas", icon: Users, credits: 2 },
  { id: "abtest", label: "A/B variants", icon: FlaskConical, credits: 1 },
  { id: "seometa", label: "SEO meta pack", icon: Code2, credits: 2 },
  { id: "pricing", label: "Pricing copy", icon: Tags, credits: 2 },
  { id: "casestudy", label: "Case study", icon: BookOpen, credits: 3 },
  { id: "tagline", label: "Taglines", icon: Quote, credits: 2 },
  { id: "slogan", label: "Slogans", icon: Lightbulb, credits: 2 },
  { id: "naming", label: "Product naming", icon: Type, credits: 2 },
  { id: "domain", label: "Domain ideas", icon: Globe2, credits: 2 },
  { id: "valueprop", label: "Value prop canvas", icon: Heart, credits: 2 },
  { id: "journey", label: "Customer journey", icon: MapIcon, credits: 2 },
  { id: "webinar", label: "Webinar promo", icon: Video, credits: 2 },
  { id: "podcast", label: "Podcast pitch", icon: Mic, credits: 2 },
  { id: "influencer", label: "Influencer DM", icon: AtSign, credits: 2 },
  { id: "thread", label: "X/Twitter thread", icon: Twitter, credits: 2 },
  { id: "carousel", label: "LinkedIn carousel", icon: Linkedin, credits: 2 },
  { id: "youtube", label: "YouTube SEO", icon: Youtube, credits: 2 },
  { id: "tiktok", label: "TikTok hooks", icon: Music2, credits: 2 },
  { id: "objections", label: "Sales objections", icon: ShieldQuestion, credits: 2 },
  { id: "promo", label: "Promo / discount", icon: Percent, credits: 2 },
  { id: "referral", label: "Referral program", icon: Gift, credits: 2 },
  { id: "survey", label: "Survey questions", icon: ClipboardList, credits: 2 },
  { id: "faq", label: "FAQ pack", icon: HelpCircle, credits: 2 },
  { id: "affiliate", label: "Affiliate program", icon: Link2, credits: 2 },
  { id: "event", label: "Event invite", icon: PartyPopper, credits: 2 },
];

const TOOL_KEYS_SET = new Set<string>([
  "tagline","slogan","naming","domain","valueprop","journey","webinar","podcast",
  "influencer","thread","carousel","youtube","tiktok","objections","promo",
  "referral","survey","faq","affiliate","event",
]);


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
          <CurrentPlanBadge className="hidden sm:inline-flex" />
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

        {mode === "megapack" && <MegaPackPanel usage={usage} setUsage={setUsage} />}
        {mode === "quick" && <QuickPanel usage={usage} setUsage={setUsage} />}
        {mode === "campaign" && <CampaignPanel usage={usage} setUsage={setUsage} />}
        {mode === "blog" && <BlogPanel usage={usage} setUsage={setUsage} />}
        {mode === "strategy" && <StrategyPanel usage={usage} setUsage={setUsage} />}
        {mode === "hero" && <HeroPanel usage={usage} setUsage={setUsage} />}
        {mode === "competitor" && <CompetitorPanel usage={usage} setUsage={setUsage} />}
        {mode === "drip" && <DripPanel usage={usage} setUsage={setUsage} />}
        {mode === "adpack" && <AdPackPanel usage={usage} setUsage={setUsage} />}
        {mode === "landing" && <LandingPanel usage={usage} setUsage={setUsage} />}
        {mode === "calendar" && <CalendarPanel usage={usage} setUsage={setUsage} />}
        {mode === "video" && <VideoPanel usage={usage} setUsage={setUsage} />}
        {mode === "press" && <PressPanel usage={usage} setUsage={setUsage} />}
        {mode === "outreach" && <OutreachPanel usage={usage} setUsage={setUsage} />}
        {mode === "voice" && <VoicePanel usage={usage} setUsage={setUsage} />}
        {mode === "personas" && <PersonasPanel usage={usage} setUsage={setUsage} />}
        {mode === "abtest" && <ABPanel usage={usage} setUsage={setUsage} />}
        {mode === "seometa" && <SeoMetaPanel usage={usage} setUsage={setUsage} />}
        {mode === "pricing" && <PricingCopyPanel usage={usage} setUsage={setUsage} />}
        {mode === "casestudy" && <CaseStudyPanel usage={usage} setUsage={setUsage} />}
        {TOOL_KEYS_SET.has(mode) && (
          <ToolPanel key={mode} tool={mode as MarketingToolKey} label={TABS.find(t => t.id === mode)?.label ?? mode} usage={usage} setUsage={setUsage} />
        )}
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

// ============ 6. Competitor + SEO panel ============

function CompetitorPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateCompetitor);
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (!/^https?:\/\//i.test(url)) return setError("Enter a full URL starting with https://");
    if (niche.trim().length < 2) return setError("Tell us your niche.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { competitor_url: url.trim(), niche: niche.trim(), audience: audience.trim() } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Competitor URL</Label>
        <input value={url} onChange={(e) => setUrl(e.target.value.slice(0, 300))} placeholder="https://example.com"
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Your niche / category</Label>
        <input value={niche} onChange={(e) => setNiche(e.target.value.slice(0, 200))} placeholder="indian payments SaaS"
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Audience (optional)</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <GenerateButton loading={loading} onClick={run}>Run teardown + SEO gap (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <h2 className="text-[16px] font-semibold">Findings</h2>
        {!result ? <Empty>Competitor teardown, keyword gaps and long-tail ideas appear here.</Empty> : (
          <div className="mt-5 space-y-4">
            <CopyableBlock label="Summary" text={result.competitor_summary}>
              <p className="text-[13.5px] leading-relaxed text-[#3c4257]">{result.competitor_summary}</p>
            </CopyableBlock>
            <div className="grid gap-3 sm:grid-cols-2">
              <CopyableBlock label="Strengths" text={result.strengths.join("\n")}>
                <ul className="space-y-1 text-[13px] text-[#3c4257]">{result.strengths.map((s, i) => <li key={i}>+ {s}</li>)}</ul>
              </CopyableBlock>
              <CopyableBlock label="Weaknesses" text={result.weaknesses.join("\n")}>
                <ul className="space-y-1 text-[13px] text-[#3c4257]">{result.weaknesses.map((s, i) => <li key={i}>− {s}</li>)}</ul>
              </CopyableBlock>
            </div>
            <CopyableBlock label="Positioning gap" text={result.positioning_gap}>
              <p className="text-[13.5px] text-[#0a2540]">{result.positioning_gap}</p>
            </CopyableBlock>
            <CopyableBlock label="Keyword gaps" text={result.keyword_gaps.map(k => `${k.keyword} (${k.intent}, ${k.estimated_difficulty})`).join("\n")}>
              <table className="w-full text-left text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-[#697386]"><tr><th className="py-1">Keyword</th><th>Intent</th><th>Difficulty</th></tr></thead>
                <tbody className="divide-y divide-[#eef1f5]">
                  {result.keyword_gaps.map((k, i) => (
                    <tr key={i}><td className="py-1.5 pr-2 font-medium text-[#0a2540]">{k.keyword}</td><td className="text-[#3c4257]">{k.intent}</td><td className="text-[#635bff]">{k.estimated_difficulty}</td></tr>
                  ))}
                </tbody>
              </table>
            </CopyableBlock>
            <CopyableBlock label="Long-tail ideas" text={result.long_tail_ideas.map(k => `${k.keyword} — ${k.angle}`).join("\n")}>
              <ul className="space-y-1 text-[12.5px] text-[#3c4257]">
                {result.long_tail_ideas.map((k, i) => (
                  <li key={i}><b className="text-[#0a2540]">{k.keyword}</b> <span className="text-[#697386]">({k.intent})</span> — {k.angle}</li>
                ))}
              </ul>
            </CopyableBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ 7. Email drip panel ============

function DripPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateEmailDrip);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState<"onboarding" | "reengagement" | "launch" | "nurture">("onboarding");
  const [tone, setTone] = useState<(typeof TONES)[number]>("friendly");
  const [result, setResult] = useState<EmailDripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product first.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { product: product.trim(), audience, goal, tone } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const downloadMd = () => {
    if (!result) return;
    const md = `# ${result.goal} drip\n\n${result.emails.map(e => `## Day ${e.send_day_offset} — Step ${e.step}\n\n**Subject:** ${e.subject}\n\n**Preview:** ${e.preview_text}\n\n${e.body_markdown}\n\n**CTA:** ${e.cta_label}\n\n---\n`).join("\n")}`;
    downloadText(`drip-${result.goal}-${Date.now()}.md`, md, "text/markdown");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product / service</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 280))} rows={2}
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Audience</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Sequence goal</Label>
        <select value={goal} onChange={(e) => setGoal(e.target.value as any)}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]">
          <option value="onboarding">Onboarding (0, 1, 3, 7, 14 days)</option>
          <option value="reengagement">Re-engagement (0, 3, 7, 14, 28)</option>
          <option value="launch">Launch (-3, -1, 0, 1, 3)</option>
          <option value="nurture">Nurture (0, 7, 14, 21, 30)</option>
        </select>
        <Label className="mt-3">Tone</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button key={t} onClick={() => setTone(t)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${tone === t ? "border-[#635bff] bg-[#635bff] text-white" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>{t}</button>
          ))}
        </div>
        <GenerateButton loading={loading} onClick={run}>Generate 5-step drip (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Email sequence</h2>
          <button disabled={!result} onClick={downloadMd}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> .md
          </button>
        </div>
        {!result ? <Empty>Five timed lifecycle emails appear here.</Empty> : (
          <div className="mt-5 space-y-4">
            {result.emails.map((e, i) => (
              <div key={i} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-4">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#697386]">
                  <span>Step {e.step} · Day {e.send_day_offset}</span>
                  <span className="text-[#635bff]">{e.cta_label}</span>
                </div>
                <p className="mt-1 text-[15px] font-semibold text-[#0a2540]">{e.subject}</p>
                <p className="text-[12px] italic text-[#697386]">{e.preview_text}</p>
                <pre className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[#3c4257]">{e.body_markdown}</pre>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ 8. Ad pack panel ============

function AdPackPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateAdPack);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("bold");
  const [result, setResult] = useState<AdPackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product first.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { product: product.trim(), audience, offer, tone } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const Variant = ({ v }: { v: { id: string; text: string; chars: number; max: number; ok: boolean } }) => (
    <div className="rounded-md border border-[#eef1f5] bg-white p-2.5">
      <p className="text-[13px] text-[#0a2540]">{v.text || <em className="text-[#a3acb9]">empty</em>}</p>
      <p className={`mt-1 text-[10.5px] font-mono ${v.ok ? "text-[#0a8a3a]" : "text-[#c0392b]"}`}>{v.chars}/{v.max}</p>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 280))} rows={2}
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Audience</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Offer / hook</Label>
        <input value={offer} onChange={(e) => setOffer(e.target.value.slice(0, 200))} placeholder="20% off launch week"
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Tone</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button key={t} onClick={() => setTone(t)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${tone === t ? "border-[#635bff] bg-[#635bff] text-white" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>{t}</button>
          ))}
        </div>
        <GenerateButton loading={loading} onClick={run}>Generate ad pack (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <h2 className="text-[16px] font-semibold">Platform-spec ads</h2>
        {!result ? <Empty>Google · Meta · LinkedIn · X variants with character validation.</Empty> : (
          <div className="mt-5 space-y-5">
            <div>
              <Label>Google Ads · headlines (≤30) + descriptions (≤90)</Label>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-3">{result.google.headlines.map((v) => <Variant key={v.id} v={v} />)}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{result.google.descriptions.map((v) => <Variant key={v.id} v={v} />)}</div>
            </div>
            <div>
              <Label>Meta Ads · headlines (≤40) + bodies (≤125)</Label>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-5">{result.meta.headlines.map((v) => <Variant key={v.id} v={v} />)}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">{result.meta.bodies.map((v) => <Variant key={v.id} v={v} />)}</div>
            </div>
            <div>
              <Label>LinkedIn · intro (≤150) + headline (≤70)</Label>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                <Variant v={result.linkedin.intro} /><Variant v={result.linkedin.headline} />
              </div>
            </div>
            <div>
              <Label>X / Twitter · posts (≤270)</Label>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-3">{result.x.posts.map((v) => <Variant key={v.id} v={v} />)}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ 9. Landing HTML panel ============

function LandingPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateLandingHtml);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState<"minimal" | "vibrant" | "dark" | "warm" | "techy">("minimal");
  const [color, setColor] = useState("#635bff");
  const [result, setResult] = useState<LandingHtmlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product first.");
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return setError("Color must be a #hex like #635bff");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { product: product.trim(), audience, style, primary_color: color } });
      setResult(r); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const downloadHtml = () => {
    if (!result) return;
    downloadText(`landing-${Date.now()}.html`, result.html, "text/html");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 280))} rows={2}
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Audience</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />
        <Label className="mt-3">Style</Label>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {(["minimal","vibrant","dark","warm","techy"] as const).map((s) => (
            <button key={s} onClick={() => setStyle(s)}
              className={`rounded-md border px-2 py-2 text-[12px] font-medium ${style === s ? "border-[#635bff] bg-[#635bff]/8 text-[#635bff]" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>{s}</button>
          ))}
        </div>
        <Label className="mt-3">Brand color (hex)</Label>
        <div className="mt-1.5 flex gap-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded-md border border-[#e3e8ee]" />
          <input value={color} onChange={(e) => setColor(e.target.value)}
            className="flex-1 rounded-md border border-[#e3e8ee] bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[#635bff]" />
        </div>
        <GenerateButton loading={loading} onClick={run}>Generate landing HTML (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Landing preview</h2>
          <button disabled={!result} onClick={downloadHtml}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> index.html
          </button>
        </div>
        {!result ? <Empty>Self-contained Tailwind-CDN HTML appears here.</Empty> : (
          <div className="mt-5">
            <iframe srcDoc={result.html} title="landing preview" className="h-[600px] w-full rounded-lg border border-[#e3e8ee] bg-white" sandbox="allow-same-origin" />
          </div>
        )}
      </Card>
    </div>
  );
}


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

// ============================================================
// ============== 10 NEW PANELS (compact, shared shape) =======
// ============================================================

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff] ${props.className || ""}`} />;
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff] ${props.className || ""}`} />;
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${active ? "border-[#635bff] bg-[#635bff] text-white" : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"}`}>{children}</button>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[16px] font-semibold">{children}</h2>;
}
function DownloadButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0a2540] hover:border-[#635bff] hover:text-[#635bff]">
      <Download className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

// ---- 10. Social Calendar ----
const PLATFORMS = ["instagram","linkedin","x","tiktok","facebook"] as const;
function CalendarPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateSocialCalendar);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("friendly");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "linkedin"]);
  const [result, setResult] = useState<SocialCalendarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const togglePlatform = (p: string) => setPlatforms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Add a product or topic.");
    if (platforms.length === 0) return setError("Pick at least one platform.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { product: product.trim(), audience: audience.trim(), tone, platforms: platforms as any } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  const downloadCsv = () => {
    if (!result) return;
    const rows = [["day","date_offset","platform","hook","caption","hashtags","best_time","cta"], ...result.days.map((d) => [d.day, d.date_offset, d.platform, d.hook, d.caption, d.hashtags.join(" "), d.best_time, d.cta])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadText("social-calendar.csv", csv, "text/csv");
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product / topic</Label>
        <TextArea rows={3} value={product} onChange={(e) => setProduct(e.target.value.slice(0, 300))} placeholder="e.g. Eco-friendly water bottles" />
        <Label className="mt-3">Audience</Label>
        <TextInput value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))} />
        <Label className="mt-3">Tone</Label>
        <TextInput value={tone} onChange={(e) => setTone(e.target.value.slice(0, 40))} />
        <Label className="mt-3">Platforms</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => <Pill key={p} active={platforms.includes(p)} onClick={() => togglePlatform(p)}>{p}</Pill>)}
        </div>
        <GenerateButton loading={loading} onClick={run}>Generate 30-day calendar (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <div className="flex items-center justify-between"><SectionTitle>30-day calendar</SectionTitle>{result && <DownloadButton onClick={downloadCsv}>CSV</DownloadButton>}</div>
        {!result ? <Empty>Pick platforms and generate.</Empty> : (
          <div className="mt-5 max-h-[640px] overflow-auto rounded-lg border border-[#eef1f5]">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-[#fafbfc] text-[#697386]">
                <tr><th className="px-2 py-2 text-left">Day</th><th className="px-2 py-2 text-left">Platform</th><th className="px-2 py-2 text-left">Hook + caption</th><th className="px-2 py-2 text-left">Time</th></tr>
              </thead>
              <tbody>
                {result.days.map((d) => (
                  <tr key={d.day} className="border-t border-[#eef1f5] align-top">
                    <td className="px-2 py-2 font-semibold">{d.day}</td>
                    <td className="px-2 py-2">{d.platform}</td>
                    <td className="px-2 py-2"><div className="font-semibold">{d.hook}</div><div className="text-[#697386]">{d.caption}</div><div className="mt-1 text-[11px] text-[#635bff]">{d.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")}</div><div className="text-[11px] text-[#697386]">CTA: {d.cta}</div></td>
                    <td className="px-2 py-2 whitespace-nowrap text-[#697386]">{d.best_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 11. Video / Reels script ----
function VideoPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateVideoScript);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [length, setLength] = useState<"30s"|"60s"|"3min">("60s");
  const [tone, setTone] = useState("energetic");
  const [result, setResult] = useState<VideoScriptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (topic.trim().length < 2) return setError("Add a topic.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { topic: topic.trim(), audience: audience.trim(), length, tone } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Topic</Label>
        <TextArea rows={3} value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 300))} placeholder="e.g. 3 ways our planner saves you an hour a day" />
        <Label className="mt-3">Audience</Label>
        <TextInput value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))} />
        <Label className="mt-3">Length</Label>
        <div className="mt-1.5 flex gap-1.5">{(["30s","60s","3min"] as const).map((l) => <Pill key={l} active={length === l} onClick={() => setLength(l)}>{l}</Pill>)}</div>
        <Label className="mt-3">Tone</Label>
        <TextInput value={tone} onChange={(e) => setTone(e.target.value.slice(0, 40))} />
        <GenerateButton loading={loading} onClick={run}>Generate script (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <SectionTitle>Script</SectionTitle>
        {!result ? <Empty>Generate a script first.</Empty> : (
          <div className="mt-5 space-y-5">
            <CopyableBlock label="Hook (first 2 seconds)" text={result.hook}><p className="text-[18px] font-semibold">{result.hook}</p></CopyableBlock>
            <div>
              <Label>Shot list</Label>
              <div className="mt-2 space-y-2">
                {result.beats.map((b, i) => (
                  <div key={i} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-3 text-[13px]">
                    <div className="text-[11px] font-semibold text-[#635bff]">{b.time}</div>
                    <div className="mt-1"><b>Shot:</b> {b.shot}</div>
                    <div><b>VO:</b> {b.voiceover}</div>
                    <div><b>On-screen:</b> {b.on_screen_text}</div>
                    <div className="text-[#697386]"><b>B-roll:</b> {b.b_roll}</div>
                  </div>
                ))}
              </div>
            </div>
            <CopyableBlock label="Thumbnail concept" text={result.thumbnail_concept}><p className="text-[14px]">{result.thumbnail_concept}</p></CopyableBlock>
            <CopyableBlock label="CTA" text={result.cta}><span className="inline-flex rounded-md bg-[#635bff] px-3 py-1.5 text-[13px] font-semibold text-white">{result.cta}</span></CopyableBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 12. Press release ----
function PressPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generatePressRelease);
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [spokesperson, setSpokesperson] = useState("");
  const [spokespersonTitle, setSpokespersonTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [result, setResult] = useState<PressReleaseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (company.trim().length < 2 || announcement.trim().length < 5) return setError("Add company + announcement.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { company: company.trim(), city: city.trim(), announcement: announcement.trim(), spokesperson: spokesperson.trim(), spokesperson_title: spokespersonTitle.trim(), contact_email: contactEmail.trim() } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Company</Label><TextInput value={company} onChange={(e) => setCompany(e.target.value.slice(0, 120))} />
        <Label className="mt-3">City</Label><TextInput value={city} onChange={(e) => setCity(e.target.value.slice(0, 80))} placeholder="San Francisco, CA" />
        <Label className="mt-3">Announcement</Label>
        <TextArea rows={4} value={announcement} onChange={(e) => setAnnouncement(e.target.value.slice(0, 500))} placeholder="What's the news? Funding, launch, partnership..." />
        <Label className="mt-3">Spokesperson</Label><TextInput value={spokesperson} onChange={(e) => setSpokesperson(e.target.value.slice(0, 120))} placeholder="Jane Doe" />
        <Label className="mt-3">Title</Label><TextInput value={spokespersonTitle} onChange={(e) => setSpokespersonTitle(e.target.value.slice(0, 120))} placeholder="CEO" />
        <Label className="mt-3">Media contact email</Label><TextInput value={contactEmail} onChange={(e) => setContactEmail(e.target.value.slice(0, 120))} />
        <GenerateButton loading={loading} onClick={run}>Generate release (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <div className="flex items-center justify-between"><SectionTitle>Press release</SectionTitle>
          {result && <div className="flex gap-2"><DownloadButton onClick={() => downloadText("press-release.html", result.html, "text/html")}>HTML</DownloadButton><DownloadButton onClick={() => { const txt = `FOR IMMEDIATE RELEASE\n\n${result.headline}\n${result.subhead}\n\n${result.dateline} — ${result.body_paragraphs.join("\n\n")}\n\n"${result.quote.text}"\n— ${result.quote.attribution}\n\nAbout: ${result.boilerplate}\n${result.contact_block}\n\n###`; downloadText("press-release.txt", txt); }}>TXT</DownloadButton></div>}
        </div>
        {!result ? <Empty>Fill in the announcement to generate.</Empty> : (
          <div className="mt-5 space-y-3 text-[14px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#697386]">For immediate release</div>
            <h1 className="text-[22px] font-bold leading-tight">{result.headline}</h1>
            <p className="text-[15px] italic text-[#3c4257]">{result.subhead}</p>
            <p><b>{result.dateline}</b> — {result.body_paragraphs[0]}</p>
            {result.body_paragraphs.slice(1, -1).map((b, i) => <p key={i}>{b}</p>)}
            <blockquote className="border-l-2 border-[#635bff] pl-4 italic text-[#3c4257]">"{result.quote.text}"<br/><span className="text-[12px] not-italic">— {result.quote.attribution}</span></blockquote>
            {result.body_paragraphs.length > 1 && <p>{result.body_paragraphs[result.body_paragraphs.length - 1]}</p>}
            <div className="mt-4 border-t border-[#eef1f5] pt-3 text-[13px] text-[#3c4257]"><b>About:</b> {result.boilerplate}{result.contact_block && <><br/><br/>{result.contact_block}</>}</div>
            <p className="text-center text-[#697386]">###</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 13. Cold outreach ----
function OutreachPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateColdOutreach);
  const [product, setProduct] = useState("");
  const [persona, setPersona] = useState("");
  const [valueProp, setValueProp] = useState("");
  const [sender, setSender] = useState("");
  const [result, setResult] = useState<ColdOutreachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (product.trim().length < 2 || persona.trim().length < 2 || valueProp.trim().length < 2) return setError("Fill product, persona, value prop.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { product: product.trim(), target_persona: persona.trim(), value_prop: valueProp.trim(), sender_name: sender.trim() } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Product / service</Label><TextArea rows={3} value={product} onChange={(e) => setProduct(e.target.value.slice(0, 300))} />
        <Label className="mt-3">Target persona</Label><TextInput value={persona} onChange={(e) => setPersona(e.target.value.slice(0, 200))} placeholder="VP of Engineering at 50–200 person SaaS" />
        <Label className="mt-3">Value prop</Label><TextArea rows={2} value={valueProp} onChange={(e) => setValueProp(e.target.value.slice(0, 300))} />
        <Label className="mt-3">Sender name</Label><TextInput value={sender} onChange={(e) => setSender(e.target.value.slice(0, 120))} />
        <GenerateButton loading={loading} onClick={run}>Generate outreach (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <SectionTitle>Outreach pack</SectionTitle>
        {!result ? <Empty>Generate to see emails + LinkedIn templates.</Empty> : (
          <div className="mt-5 space-y-5">
            <div>
              <Label>Initial emails (3 variants)</Label>
              <div className="mt-2 space-y-3">
                {result.emails.map((e, i) => (
                  <div key={i} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-3">
                    <div className="text-[11px] font-semibold text-[#635bff]">{e.variant}</div>
                    <div className="mt-1 text-[13px]"><b>Subject:</b> {e.subject}</div>
                    <pre className="mt-2 whitespace-pre-wrap text-[13px] text-[#3c4257]">{e.body}</pre>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Follow-ups</Label>
              <div className="mt-2 space-y-3">
                {result.follow_ups.map((e, i) => (
                  <div key={i} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-3">
                    <div className="text-[11px] font-semibold text-[#635bff]">Day +{e.day_offset}</div>
                    <div className="mt-1 text-[13px]"><b>Subject:</b> {e.subject}</div>
                    <pre className="mt-2 whitespace-pre-wrap text-[13px] text-[#3c4257]">{e.body}</pre>
                  </div>
                ))}
              </div>
            </div>
            <CopyableBlock label="LinkedIn connection note" text={result.linkedin.connection_note}><p className="text-[13.5px]">{result.linkedin.connection_note}</p></CopyableBlock>
            <CopyableBlock label="LinkedIn first message" text={result.linkedin.first_message}><p className="whitespace-pre-wrap text-[13.5px]">{result.linkedin.first_message}</p></CopyableBlock>
            <CopyableBlock label="LinkedIn follow-up" text={result.linkedin.follow_up}><p className="whitespace-pre-wrap text-[13.5px]">{result.linkedin.follow_up}</p></CopyableBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 14. Brand voice ----
function VoicePanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateBrandVoice);
  const [sample, setSample] = useState("");
  const [result, setResult] = useState<BrandVoiceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (sample.trim().length < 10) return setError("Paste a paragraph of brand copy or a description.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { sample_or_description: sample.trim() } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Sample copy or brand description</Label>
        <TextArea rows={10} value={sample} onChange={(e) => setSample(e.target.value.slice(0, 2000))} placeholder="Paste an existing blog post, About page, or describe how you want the brand to sound..." />
        <GenerateButton loading={loading} onClick={run}>Derive brand voice (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <div className="flex items-center justify-between"><SectionTitle>Brand voice guidelines</SectionTitle>{result && <DownloadButton onClick={() => downloadText("brand-voice.md", result.style_guide_markdown, "text/markdown")}>Markdown</DownloadButton>}</div>
        {!result ? <Empty>Paste sample copy to begin.</Empty> : (
          <div className="mt-5 space-y-5">
            <CopyableBlock label="Voice summary" text={result.voice_summary}><p className="text-[14px]">{result.voice_summary}</p></CopyableBlock>
            <div>
              <Label>Attributes</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">{result.attributes.map((a, i) => <span key={i} className="rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold text-[#635bff]">{a}</span>)}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Do</Label><ul className="mt-1.5 space-y-1 text-[13px] text-[#1f7a3a]">{result.do_words.map((w, i) => <li key={i}>✓ {w}</li>)}</ul></div>
              <div><Label>Don't</Label><ul className="mt-1.5 space-y-1 text-[13px] text-[#c0392b]">{result.dont_words.map((w, i) => <li key={i}>✗ {w}</li>)}</ul></div>
            </div>
            <div>
              <Label>Sample rewrites</Label>
              <div className="mt-2 space-y-2">
                {result.sample_rewrites.map((r, i) => (
                  <div key={i} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-3 text-[13px]">
                    <div className="text-[#c0392b]"><b>Before:</b> {r.before}</div>
                    <div className="mt-1 text-[#1f7a3a]"><b>After:</b> {r.after}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 15. Personas ----
function PersonasPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generatePersonas);
  const [product, setProduct] = useState("");
  const [hint, setHint] = useState("");
  const [result, setResult] = useState<PersonasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { product: product.trim(), audience_hint: hint.trim() } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Product</Label><TextArea rows={3} value={product} onChange={(e) => setProduct(e.target.value.slice(0, 300))} />
        <Label className="mt-3">Audience hint</Label><TextArea rows={3} value={hint} onChange={(e) => setHint(e.target.value.slice(0, 300))} placeholder="e.g. B2B SaaS, Indian SMBs, hobbyists..." />
        <GenerateButton loading={loading} onClick={run}>Generate 3 personas (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <SectionTitle>Personas</SectionTitle>
        {!result ? <Empty>Generate to build personas.</Empty> : (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {result.personas.map((p, i) => (
              <div key={i} className="rounded-xl border border-[#eef1f5] bg-[#fafbfc] p-4 text-[13px]">
                <div className="text-[15px] font-bold">{p.name}</div>
                <div className="text-[12px] text-[#697386]">{p.role} · {p.age_range}</div>
                <p className="mt-2 text-[12.5px] italic text-[#3c4257]">"{p.quote}"</p>
                <div className="mt-3"><Label>Demographics</Label><p className="mt-1 text-[12.5px]">{p.demographics}</p></div>
                <div className="mt-2"><Label>Jobs to be done</Label><ul className="mt-1 list-disc pl-4 text-[12.5px]">{p.jobs_to_be_done.map((j, k) => <li key={k}>{j}</li>)}</ul></div>
                <div className="mt-2"><Label>Pains</Label><ul className="mt-1 list-disc pl-4 text-[12.5px] text-[#c0392b]">{p.pains.map((j, k) => <li key={k}>{j}</li>)}</ul></div>
                <div className="mt-2"><Label>Gains</Label><ul className="mt-1 list-disc pl-4 text-[12.5px] text-[#1f7a3a]">{p.gains.map((j, k) => <li key={k}>{j}</li>)}</ul></div>
                <div className="mt-2"><Label>Channels</Label><div className="mt-1 flex flex-wrap gap-1">{p.channels.map((c, k) => <span key={k} className="rounded bg-white px-2 py-0.5 text-[11px] ring-1 ring-[#e3e8ee]">{c}</span>)}</div></div>
                <div className="mt-2"><Label>Objections</Label><ul className="mt-1 list-disc pl-4 text-[12.5px]">{p.objections.map((j, k) => <li key={k}>{j}</li>)}</ul></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 16. A/B variants ----
const AB_TYPES = ["headline","ad","subject_line","cta","tagline"] as const;
function ABPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateABVariants);
  const [original, setOriginal] = useState("");
  const [assetType, setAssetType] = useState<typeof AB_TYPES[number]>("headline");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState<ABVariantsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (original.trim().length < 2) return setError("Paste the original asset.");
    if (usage && usage.remaining < 1) return setError(`Need 1 credit, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { original: original.trim(), asset_type: assetType, audience: audience.trim() } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Asset type</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">{AB_TYPES.map((t) => <Pill key={t} active={assetType === t} onClick={() => setAssetType(t)}>{t.replace("_", " ")}</Pill>)}</div>
        <Label className="mt-3">Original</Label>
        <TextArea rows={3} value={original} onChange={(e) => setOriginal(e.target.value.slice(0, 500))} />
        <Label className="mt-3">Audience</Label><TextInput value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))} />
        <GenerateButton loading={loading} onClick={run}>Generate 8 variants (1 credit)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <SectionTitle>Ranked variants</SectionTitle>
        {!result ? <Empty>Generate to see ranked alternatives.</Empty> : (
          <div className="mt-5 space-y-3">
            {result.variants.map((v) => (
              <div key={v.rank} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="rounded-full bg-[#635bff]/10 px-2 py-0.5 font-semibold text-[#635bff]">#{v.rank} · {v.angle}</span>
                </div>
                <p className="mt-1.5 text-[14px] font-semibold">{v.text}</p>
                <p className="mt-1 text-[12px] text-[#697386]">{v.rationale}</p>
              </div>
            ))}
            <div className="rounded-lg border border-[#635bff]/30 bg-[#635bff]/5 p-3 text-[13px]"><b>Hypothesis:</b> {result.hypothesis}</div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 17. SEO meta ----
function SeoMetaPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateSeoMeta);
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState<SeoMetaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (topic.trim().length < 2) return setError("Add a URL or topic.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { topic_or_url: topic.trim(), primary_keyword: keyword.trim(), audience: audience.trim() } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>URL or topic</Label><TextInput value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 400))} placeholder="https://example.com/post OR a topic" />
        <Label className="mt-3">Primary keyword</Label><TextInput value={keyword} onChange={(e) => setKeyword(e.target.value.slice(0, 80))} />
        <Label className="mt-3">Audience</Label><TextInput value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))} />
        <GenerateButton loading={loading} onClick={run}>Generate meta pack (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <SectionTitle>SEO meta pack</SectionTitle>
        {!result ? <Empty>Run to get titles, descriptions, OG, schema.</Empty> : (
          <div className="mt-5 space-y-5">
            <div>
              <Label>10 title options (≤60 chars)</Label>
              <ul className="mt-2 space-y-1">{result.titles.map((t, i) => <li key={i} className="flex items-start gap-2 text-[13px]"><span className={`mt-0.5 rounded px-1.5 text-[10px] ${t.ok ? "bg-[#dff5e6] text-[#1f7a3a]" : "bg-[#fff1f0] text-[#c0392b]"}`}>{t.chars}</span><span>{t.text}</span></li>)}</ul>
            </div>
            <div>
              <Label>10 meta descriptions (120–160)</Label>
              <ul className="mt-2 space-y-1">{result.descriptions.map((t, i) => <li key={i} className="flex items-start gap-2 text-[13px]"><span className={`mt-0.5 rounded px-1.5 text-[10px] ${t.ok ? "bg-[#dff5e6] text-[#1f7a3a]" : "bg-[#fff1f0] text-[#c0392b]"}`}>{t.chars}</span><span>{t.text}</span></li>)}</ul>
            </div>
            <CopyableBlock label="Open Graph" text={`<meta property="og:title" content="${result.open_graph.title}" />\n<meta property="og:description" content="${result.open_graph.description}" />\n<meta property="og:type" content="${result.open_graph.type}" />\n<meta property="og:image:alt" content="${result.open_graph.image_alt}" />`}>
              <pre className="whitespace-pre-wrap text-[12px]">{`<meta property="og:title" content="${result.open_graph.title}" />
<meta property="og:description" content="${result.open_graph.description}" />
<meta property="og:type" content="${result.open_graph.type}" />
<meta property="og:image:alt" content="${result.open_graph.image_alt}" />`}</pre>
            </CopyableBlock>
            <CopyableBlock label="Twitter card" text={`<meta name="twitter:card" content="${result.twitter_card.card}" />\n<meta name="twitter:title" content="${result.twitter_card.title}" />\n<meta name="twitter:description" content="${result.twitter_card.description}" />`}>
              <pre className="whitespace-pre-wrap text-[12px]">{`<meta name="twitter:card" content="${result.twitter_card.card}" />
<meta name="twitter:title" content="${result.twitter_card.title}" />
<meta name="twitter:description" content="${result.twitter_card.description}" />`}</pre>
            </CopyableBlock>
            <CopyableBlock label="JSON-LD" text={`<script type="application/ld+json">\n${result.json_ld}\n</script>`}>
              <pre className="whitespace-pre-wrap text-[12px]">{result.json_ld}</pre>
            </CopyableBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 18. Pricing copy ----
function PricingCopyPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generatePricingCopy);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [positioning, setPositioning] = useState<"value"|"premium"|"freemium"|"enterprise">("value");
  const [result, setResult] = useState<PricingCopyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { product: product.trim(), audience: audience.trim(), currency: currency.trim() || "USD", positioning } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Product</Label><TextArea rows={3} value={product} onChange={(e) => setProduct(e.target.value.slice(0, 300))} />
        <Label className="mt-3">Audience</Label><TextInput value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))} />
        <Label className="mt-3">Currency</Label><TextInput value={currency} onChange={(e) => setCurrency(e.target.value.slice(0, 8))} />
        <Label className="mt-3">Positioning</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">{(["value","premium","freemium","enterprise"] as const).map((p) => <Pill key={p} active={positioning === p} onClick={() => setPositioning(p)}>{p}</Pill>)}</div>
        <GenerateButton loading={loading} onClick={run}>Generate pricing copy (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <SectionTitle>Pricing page</SectionTitle>
        {!result ? <Empty>Generate 3 tiers + FAQ.</Empty> : (
          <div className="mt-5 space-y-5">
            <div className="text-center">
              <h3 className="text-[22px] font-bold">{result.intro_headline}</h3>
              <p className="mt-2 text-[14px] text-[#3c4257]">{result.intro_subhead}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {result.tiers.map((t, i) => (
                <div key={i} className={`rounded-xl border p-4 ${t.badge ? "border-[#635bff] bg-[#635bff]/5" : "border-[#eef1f5] bg-[#fafbfc]"}`}>
                  {t.badge && <div className="mb-2 inline-block rounded-full bg-[#635bff] px-2 py-0.5 text-[10px] font-bold uppercase text-white">{t.badge}</div>}
                  <div className="text-[15px] font-bold">{t.name}</div>
                  <div className="text-[12px] text-[#697386]">{t.tagline}</div>
                  <div className="mt-3 text-[24px] font-bold">{t.price_monthly}<span className="text-[12px] font-normal text-[#697386]">/mo</span></div>
                  <div className="text-[11px] text-[#697386]">or {t.price_annual}</div>
                  <ul className="mt-3 space-y-1.5 text-[12.5px]">{t.features.map((f, k) => <li key={k} className="flex gap-2"><Check className="mt-0.5 h-3 w-3 shrink-0 text-[#635bff]" />{f}</li>)}</ul>
                  <button className="mt-4 w-full rounded-md bg-[#635bff] py-2 text-[12.5px] font-semibold text-white">{t.cta}</button>
                </div>
              ))}
            </div>
            <div>
              <Label>Feature matrix</Label>
              <div className="mt-2 overflow-auto rounded-lg border border-[#eef1f5]">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-[#fafbfc]"><tr><th className="px-3 py-2 text-left">Feature</th>{result.tiers.map((t, i) => <th key={i} className="px-3 py-2 text-center">{t.name}</th>)}</tr></thead>
                  <tbody>{result.feature_matrix.map((row, i) => (
                    <tr key={i} className="border-t border-[#eef1f5]"><td className="px-3 py-1.5">{row.feature}</td>{row.tiers.map((b, k) => <td key={k} className="px-3 py-1.5 text-center">{b ? <Check className="mx-auto h-3.5 w-3.5 text-[#1f7a3a]" /> : <X className="mx-auto h-3.5 w-3.5 text-[#c0392b]/40" />}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div>
              <Label>FAQ</Label>
              <div className="mt-2 space-y-2">{result.faq.map((f, i) => (
                <details key={i} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-3 text-[13px]"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-[#3c4257]">{f.a}</p></details>
              ))}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- 19. Case study ----
function CaseStudyPanel({ usage, setUsage }: PanelProps) {
  const gen = useServerFn(generateCaseStudy);
  const [customer, setCustomer] = useState("");
  const [industry, setIndustry] = useState("");
  const [product, setProduct] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [result, setResult] = useState<CaseStudyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    if (customer.trim().length < 1 || product.trim().length < 2 || outcomes.trim().length < 5) return setError("Fill customer, product, outcomes.");
    if (usage && usage.remaining < 3) return setError(`Need 3 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const data = await gen({ data: { customer: customer.trim(), industry: industry.trim(), product: product.trim(), outcomes: outcomes.trim() } });
      setResult(data); setUsage(data.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <Label>Customer name</Label><TextInput value={customer} onChange={(e) => setCustomer(e.target.value.slice(0, 120))} />
        <Label className="mt-3">Industry</Label><TextInput value={industry} onChange={(e) => setIndustry(e.target.value.slice(0, 120))} />
        <Label className="mt-3">Product / service used</Label><TextArea rows={2} value={product} onChange={(e) => setProduct(e.target.value.slice(0, 300))} />
        <Label className="mt-3">Outcomes (bullets, free text)</Label>
        <TextArea rows={6} value={outcomes} onChange={(e) => setOutcomes(e.target.value.slice(0, 1000))} placeholder={"- 3.2x increase in signups\n- Cut onboarding from 14 to 3 days\n- $120k saved annually"} />
        <GenerateButton loading={loading} onClick={run}>Draft case study (3 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>
      <Card>
        <div className="flex items-center justify-between"><SectionTitle>Case study</SectionTitle>{result && <DownloadButton onClick={() => downloadText("case-study.md", result.markdown, "text/markdown")}>Markdown</DownloadButton>}</div>
        {!result ? <Empty>Fill in the wins to draft.</Empty> : (
          <div className="mt-5 space-y-5">
            <div><h2 className="text-[22px] font-bold">{result.title}</h2><p className="mt-1 text-[14px] text-[#697386]">{result.subtitle}</p></div>
            <div className="rounded-xl bg-[#635bff]/5 p-5 text-center ring-1 ring-[#635bff]/20"><div className="text-[36px] font-bold text-[#635bff]">{result.hero_metric.value}</div><div className="text-[13px] text-[#3c4257]">{result.hero_metric.label}</div></div>
            <div className="grid grid-cols-3 gap-2">{result.metrics.map((m, i) => (
              <div key={i} className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-3 text-center"><div className="text-[18px] font-bold">{m.value}</div><div className="text-[11px] text-[#697386]">{m.label}</div></div>
            ))}</div>
            {result.sections.map((s, i) => (
              <div key={i}><h3 className="text-[15px] font-bold text-[#0a2540]">{s.heading}</h3><p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#3c4257]">{s.body}</p></div>
            ))}
            <blockquote className="rounded-lg border-l-4 border-[#635bff] bg-[#fafbfc] p-4 italic text-[#3c4257]">"{result.pull_quote.text}"<br/><span className="mt-2 block text-[12px] not-italic text-[#697386]">— {result.pull_quote.attribution}</span></blockquote>
            <div className="text-center"><span className="inline-flex rounded-md bg-[#635bff] px-5 py-2.5 text-[13px] font-semibold text-white">{result.cta}</span></div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#697386] ${className}`}>{children}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex h-72 items-center justify-center rounded-lg border border-dashed border-[#e3e8ee] text-[13.5px] text-[#697386]">{children}</div>;
}

// ============ Generic markdown ToolPanel (powers 20 lightweight features) ============

function ToolPanel({ tool, label, usage, setUsage }: PanelProps & { tool: MarketingToolKey; label: string }) {
  const gen = useServerFn(generateMarketingTool);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [extra, setExtra] = useState("");
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setError(null);
    if (product.trim().length < 2) return setError("Describe your product or service first.");
    if (usage && usage.remaining < 2) return setError(`Need 2 credits, have ${usage.remaining}.`);
    setLoading(true);
    try {
      const r = await gen({ data: { tool, product: product.trim(), audience: audience.trim(), extra: extra.trim() } });
      setMarkdown(r.markdown); setUsage(r.usage);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
      <Card>
        <Label>Product / service</Label>
        <textarea value={product} onChange={(e) => setProduct(e.target.value.slice(0, 400))} rows={3}
          placeholder="What are you marketing?"
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />

        <Label className="mt-3">Audience (optional)</Label>
        <input value={audience} onChange={(e) => setAudience(e.target.value.slice(0, 200))}
          className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />

        <Label className="mt-3">Extra context (optional)</Label>
        <textarea value={extra} onChange={(e) => setExtra(e.target.value.slice(0, 800))} rows={3}
          placeholder="Goals, constraints, must-mention details…"
          className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#635bff]" />

        <GenerateButton loading={loading} onClick={run}>Generate {label.toLowerCase()} (2 credits)</GenerateButton>
        <ErrorMsg message={error} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">{label}</h2>
          {markdown && (
            <div className="flex gap-2">
              <button type="button" onClick={async () => {
                try { await navigator.clipboard.writeText(markdown); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
              }} className="inline-flex items-center gap-1 rounded-md border border-[#e3e8ee] px-2.5 py-1 text-[12px] font-medium text-[#697386] hover:border-[#635bff] hover:text-[#635bff]">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={() => downloadText(`${tool}-${Date.now()}.md`, markdown, "text/markdown")}
                className="inline-flex items-center gap-1 rounded-md border border-[#e3e8ee] px-2.5 py-1 text-[12px] font-medium text-[#697386] hover:border-[#635bff] hover:text-[#635bff]">
                <Download className="h-3 w-3" /> .md
              </button>
            </div>
          )}
        </div>
        {!markdown ? <Empty>Fill in the form to generate.</Empty> : (
          <pre className="mt-5 max-h-[640px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-4 font-sans text-[13.5px] leading-relaxed text-[#3c4257]">{markdown}</pre>
        )}
      </Card>
    </div>
  );
}
