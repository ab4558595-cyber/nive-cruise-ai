import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  MessageSquare,
  BarChart3,
  Calendar,
  Copy,
  Check,
  Download,
  Share2,
  Hash,
  User,
  Lightbulb,
  Repeat,
  Briefcase,
  Heart,
  FileText,
  TrendingUp,
} from "lucide-react";

import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { safeStorage } from "@/lib/safeStorage";
import {
  generateSocialPost,
  generateSocialReply,
  analyzeSocialMetrics,
  generateContentCalendar,
  researchHashtags,
  generateBio,
  generateIdeas,
  repurposePost,
  writeLongform,
  growthPlaybook,
  type SocialPost,
  type ReplyResult,
  type AnalyticsInsights,
  type CalendarItem,
  type HashtagGroup,
  type BioResult,
  type IdeasResult,
  type RepurposeResult,
  type LongformResult,
  type LongformFormat,
  type GrowthPlaybook,
} from "@/lib/social.functions";



export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "AI Social Media Manager — Nive AI" },
      {
        name: "description",
        content:
          "Generate posts, draft replies, analyze metrics, and plan a content calendar across Instagram, X, LinkedIn and more — all in one place.",
      },
      { property: "og:title", content: "AI Social Media Manager — Nive AI" },
      {
        property: "og:description",
        content:
          "Your AI social media manager: captions, replies, analytics insights and a full content calendar.",
      },
    ],
    links: [{ rel: "canonical", href: "/social" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <SocialPage />
    </BusinessAuthGate>
  ),
});

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
] as const;

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "bold", label: "Bold" },
  { id: "playful", label: "Playful" },
  { id: "inspirational", label: "Inspirational" },
  { id: "witty", label: "Witty" },
  { id: "minimal", label: "Minimal" },
] as const;

type Tab = "post" | "reply" | "analytics" | "calendar" | "hashtags" | "bio" | "ideas" | "repurpose" | "longform" | "growth";
export type Mode = "business" | "creator";

const ModeCtx = React.createContext<Mode>("business");
const useMode = () => React.useContext(ModeCtx);

function SocialPage() {
  const [tab, setTab] = useState<Tab>("post");
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "business";
    return (safeStorage.getItem("nive_social_mode") as Mode) || "business";
  });
  function changeMode(m: Mode) {
    setMode(m);
    if (typeof window !== "undefined") safeStorage.setItem("nive_social_mode", m);
  }

  return (
    <ModeCtx.Provider value={mode}>
      <div className="min-h-screen bg-gradient-to-b from-[#f6f9fc] to-white text-[#0a2540]">
        <header className="border-b border-[#e5e7eb] bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-[#425466] hover:text-[#0a2540]">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Share2 className="h-4 w-4 text-[#635bff]" /> AI Social Media Manager
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Nive, your AI social media manager
          </h1>
          <p className="mt-2 max-w-2xl text-[#425466]">
            For businesses and personal bloggers. Plan content, write captions, draft threads & blog posts,
            reply in your voice, research hashtags, repurpose across platforms, and follow a 4-week growth playbook.
          </p>

          {/* Mode switch */}
          <div className="mt-5 inline-flex rounded-full border border-[#e5e7eb] bg-white p-1 text-sm shadow-sm">
            <button
              onClick={() => changeMode("business")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition ${
                mode === "business" ? "bg-[#0a2540] text-white" : "text-[#425466] hover:text-[#0a2540]"
              }`}
            >
              <Briefcase className="h-4 w-4" /> Business
            </button>
            <button
              onClick={() => changeMode("creator")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition ${
                mode === "creator" ? "bg-[#ff4d8d] text-white" : "text-[#425466] hover:text-[#0a2540]"
              }`}
            >
              <Heart className="h-4 w-4" /> Creator / Blogger
            </button>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2">
            <TabButton active={tab === "post"} onClick={() => setTab("post")} icon={<Sparkles className="h-4 w-4" />}>Generate post</TabButton>
            <TabButton active={tab === "longform"} onClick={() => setTab("longform")} icon={<FileText className="h-4 w-4" />}>Long-form</TabButton>
            <TabButton active={tab === "reply"} onClick={() => setTab("reply")} icon={<MessageSquare className="h-4 w-4" />}>Reply / DM</TabButton>
            <TabButton active={tab === "hashtags"} onClick={() => setTab("hashtags")} icon={<Hash className="h-4 w-4" />}>Hashtags</TabButton>
            <TabButton active={tab === "ideas"} onClick={() => setTab("ideas")} icon={<Lightbulb className="h-4 w-4" />}>Ideas</TabButton>
            <TabButton active={tab === "repurpose"} onClick={() => setTab("repurpose")} icon={<Repeat className="h-4 w-4" />}>Repurpose</TabButton>
            <TabButton active={tab === "bio"} onClick={() => setTab("bio")} icon={<User className="h-4 w-4" />}>Bio</TabButton>
            <TabButton active={tab === "growth"} onClick={() => setTab("growth")} icon={<TrendingUp className="h-4 w-4" />}>Growth</TabButton>
            <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={<BarChart3 className="h-4 w-4" />}>Analytics</TabButton>
            <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")} icon={<Calendar className="h-4 w-4" />}>Calendar</TabButton>
          </nav>

          <section className="mt-6">
            {tab === "post" && <PostTab />}
            {tab === "longform" && <LongformTab />}
            {tab === "reply" && <ReplyTab />}
            {tab === "hashtags" && <HashtagsTab />}
            {tab === "ideas" && <IdeasTab />}
            {tab === "repurpose" && <RepurposeTab />}
            {tab === "bio" && <BioTab />}
            {tab === "growth" && <GrowthTab />}
            {tab === "analytics" && <AnalyticsTab />}
            {tab === "calendar" && <CalendarTab />}
          </section>
        </main>
      </div>
    </ModeCtx.Provider>

  );
}


function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-[#635bff] bg-[#635bff] text-white"
          : "border-[#e5e7eb] bg-white text-[#0a2540] hover:border-[#635bff]/40"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">{children}</div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[#0a2540]">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0a2540] outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20";

function PrimaryBtn({
  loading,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className="inline-flex items-center gap-2 rounded-full bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5048e5] disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {children}
    </button>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] px-2 py-1 text-xs text-[#425466] hover:border-[#635bff]/40"
    >
      {done ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/* ----- Tab: generate post ----- */
function PostTab() {
  const run = useServerFn(generateSocialPost);
  const mode = useMode();

  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("instagram");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("friendly");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<SocialPost | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await run({ data: { topic, platform, tone, audience, mode } });
      setResult(r);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="What is the post about?">
            <textarea
              required
              className={inputCls + " min-h-[100px]"}
              placeholder="e.g. Launching our new oat-milk latte for monsoon season"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Tone">
              <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as any)}>
                {TONES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Audience (optional)">
            <input className={inputCls} placeholder="e.g. urban millennials, SaaS founders"
              value={audience} onChange={(e) => setAudience(e.target.value)} />
          </Field>
          <PrimaryBtn loading={loading}>Generate post</PrimaryBtn>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </Card>

      <Card>
        {!result ? (
          <p className="text-sm text-[#425466]">Your caption, hashtags, alt variants and a best-time suggestion will appear here.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Caption</h3>
                <CopyBtn text={result.caption} />
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-[#f6f9fc] p-3 text-sm">{result.caption}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Hashtags</h3>
                <CopyBtn text={result.hashtags.map((h) => "#" + h).join(" ")} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.hashtags.map((h) => (
                  <span key={h} className="rounded-full bg-[#635bff]/10 px-2 py-0.5 text-xs text-[#635bff]">#{h}</span>
                ))}
              </div>
            </div>
            {result.variants.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-semibold">Alt variants</h3>
                <ul className="space-y-2">
                  {result.variants.map((v, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-[#f6f9fc] p-2 text-sm">
                      <span>{v}</span>
                      <CopyBtn text={v} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.cta && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Call to action</h3>
                  <CopyBtn text={result.cta} />
                </div>
                <p className="rounded-lg bg-[#f6f9fc] p-2 text-sm">{result.cta}</p>
              </div>
            )}
            {result.imagePrompt && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Image prompt</h3>
                  <CopyBtn text={result.imagePrompt} />
                </div>
                <p className="rounded-lg bg-[#f6f9fc] p-2 text-sm italic text-[#425466]">{result.imagePrompt}</p>
              </div>
            )}
            {result.bestTime && (
              <p className="text-xs text-[#425466]">Suggested time: <span className="font-medium text-[#0a2540]">{result.bestTime}</span></p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----- Tab: reply ----- */
function ReplyTab() {
  const run = useServerFn(generateSocialReply);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("friendly");
  const [intent, setIntent] = useState<"thank" | "answer" | "deescalate" | "redirect" | "convert">("answer");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ReplyResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await run({ data: { message, tone, intent, brand } });
      setResult(r);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Incoming comment or DM">
            <textarea required className={inputCls + " min-h-[120px]"}
              placeholder="Paste the message you want to reply to…"
              value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Intent">
              <select className={inputCls} value={intent} onChange={(e) => setIntent(e.target.value as any)}>
                <option value="thank">Thank</option>
                <option value="answer">Answer a question</option>
                <option value="deescalate">De-escalate</option>
                <option value="redirect">Redirect (DM / link)</option>
                <option value="convert">Convert to customer</option>
              </select>
            </Field>
            <Field label="Tone">
              <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as any)}>
                {TONES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
            </Field>
          </div>
          <Field label="Brand voice (optional)">
            <input className={inputCls} placeholder="e.g. warm, concise, no exclamation marks"
              value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <PrimaryBtn loading={loading}>Draft replies</PrimaryBtn>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </Card>

      <Card>
        {!result ? (
          <p className="text-sm text-[#425466]">Three reply options will appear here.</p>
        ) : (
          <ul className="space-y-3">
            {result.replies.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-[#f6f9fc] p-3 text-sm">
                <span>{r}</span>
                <CopyBtn text={r} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ----- Tab: analytics ----- */
function AnalyticsTab() {
  const run = useServerFn(analyzeSocialMetrics);
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("instagram");
  const [goal, setGoal] = useState("grow engagement");
  const [metrics, setMetrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyticsInsights | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await run({ data: { platform, goal, metrics } });
      setResult(r);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
                {PLATFORMS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
              </select>
            </Field>
            <Field label="Goal">
              <input className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} />
            </Field>
          </div>
          <Field label="Paste your metrics">
            <textarea required className={inputCls + " min-h-[160px] font-mono text-xs"}
              placeholder={`e.g.\nFollowers: 4,210 (+1.2%)\nReach last 7d: 18,450\nEngagement rate: 2.4%\nTop post: Reel "monsoon latte" — 9.1k views`}
              value={metrics} onChange={(e) => setMetrics(e.target.value)} />
          </Field>
          <PrimaryBtn loading={loading}>Analyze</PrimaryBtn>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </Card>

      <Card>
        {!result ? (
          <p className="text-sm text-[#425466]">A summary, wins, issues and recommendations will appear here.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-sm font-semibold">Summary</h3>
              <p className="mt-1 text-[#425466]">{result.summary}</p>
            </div>
            {result.wins.length > 0 && (
              <Bullets title="What's working" items={result.wins} dotClass="bg-green-500" />
            )}
            {result.issues.length > 0 && (
              <Bullets title="What needs fixing" items={result.issues} dotClass="bg-amber-500" />
            )}
            {result.recommendations.length > 0 && (
              <Bullets title="Recommendations" items={result.recommendations} dotClass="bg-[#635bff]" />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function Bullets({ title, items, dotClass }: { title: string; items: string[]; dotClass: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-1 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
            <span className="text-[#425466]">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----- Tab: calendar ----- */
function CalendarTab() {
  const run = useServerFn(generateContentCalendar);
  const [brand, setBrand] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("friendly");
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<CalendarItem[] | null>(null);

  function togglePlat(id: string) {
    setPlatforms((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (platforms.length === 0) { setErr("Pick at least one platform"); return; }
    setLoading(true); setErr(null);
    try {
      const r = await run({ data: { brand, niche, platforms: platforms as any, days, tone } });
      setItems(r.items);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to plan");
    } finally { setLoading(false); }
  }

  function exportCsv() {
    if (!items) return;
    const rows = [
      ["day", "date", "platform", "format", "hook", "caption", "hashtags"],
      ...items.map((i) => [
        String(i.day), i.date, i.platform, i.format, i.hook, i.caption, i.hashtags.join(" "),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "content-calendar.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Brand / business">
            <input required className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="Niche (optional)">
            <input className={inputCls} placeholder="e.g. specialty coffee, SaaS for HR"
              value={niche} onChange={(e) => setNiche(e.target.value)} />
          </Field>
          <Field label="Tone">
            <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as any)}>
              {TONES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
            </select>
          </Field>
          <Field label="Length">
            <select className={inputCls} value={days} onChange={(e) => setDays(Number(e.target.value) as 7 | 14 | 30)}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Platforms</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = platforms.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => togglePlat(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      on
                        ? "border-[#635bff] bg-[#635bff] text-white"
                        : "border-[#e5e7eb] bg-white text-[#0a2540] hover:border-[#635bff]/40"
                    }`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <PrimaryBtn loading={loading}>Plan calendar</PrimaryBtn>
            {items && items.length > 0 && (
              <button type="button" onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] px-4 py-2 text-sm hover:border-[#635bff]/40">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            )}
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>
        </form>
      </Card>

      {items && items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#425466]">
                <tr>
                  <th className="py-2 pr-3">Day</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Platform</th>
                  <th className="py-2 pr-3">Format</th>
                  <th className="py-2 pr-3">Hook</th>
                  <th className="py-2 pr-3">Caption</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t border-[#e5e7eb] align-top">
                    <td className="py-2 pr-3 font-medium">{it.day}</td>
                    <td className="py-2 pr-3 text-[#425466]">{it.date}</td>
                    <td className="py-2 pr-3 capitalize">{it.platform}</td>
                    <td className="py-2 pr-3">{it.format}</td>
                    <td className="py-2 pr-3">{it.hook}</td>
                    <td className="py-2 pr-3 text-[#425466]">{it.caption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ----- Tab: hashtags ----- */
function HashtagsTab() {
  const run = useServerFn(researchHashtags);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("instagram");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<HashtagGroup | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try { setResult(await run({ data: { topic, platform } })); }
    catch (e: any) { setErr(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  const all = result ? [...result.niche, ...result.trending, ...result.broad, ...result.branded] : [];

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Topic / niche">
            <input required className={inputCls} placeholder="e.g. vegan baking, indie SaaS"
              value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
          <Field label="Platform">
            <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              {PLATFORMS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          </Field>
          <PrimaryBtn loading={loading}>Research hashtags</PrimaryBtn>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </Card>

      <Card>
        {!result ? (
          <p className="text-sm text-[#425466]">Niche, trending, broad and branded hashtag groups will appear here.</p>
        ) : (
          <div className="space-y-4">
            {([
              ["Niche", result.niche],
              ["Trending", result.trending],
              ["Broad reach", result.broad],
              ["Branded", result.branded],
            ] as const).map(([label, list]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <CopyBtn text={list.map((h) => "#" + h).join(" ")} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((h) => (
                    <span key={h} className="rounded-full bg-[#635bff]/10 px-2 py-0.5 text-xs text-[#635bff]">#{h}</span>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-[#e5e7eb] pt-3">
              <CopyBtn text={all.map((h) => "#" + h).join(" ")} />
              <span className="ml-2 text-xs text-[#425466]">Copy all {all.length} hashtags</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----- Tab: ideas ----- */
function IdeasTab() {
  const run = useServerFn(generateIdeas);
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("instagram");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("grow reach");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<IdeasResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try { setResult(await run({ data: { niche, platform, audience, goal } })); }
    catch (e: any) { setErr(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Niche / topic">
            <input required className={inputCls} value={niche} onChange={(e) => setNiche(e.target.value)} />
          </Field>
          <Field label="Platform">
            <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              {PLATFORMS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          </Field>
          <Field label="Audience (optional)">
            <input className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value)} />
          </Field>
          <Field label="Goal">
            <input className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <PrimaryBtn loading={loading}>Brainstorm 10 ideas</PrimaryBtn>
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          </div>
        </form>
      </Card>

      {result && result.ideas.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {result.ideas.map((it, i) => (
            <Card key={i}>
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-[#635bff]/10 px-2 py-0.5 text-xs font-medium uppercase text-[#635bff]">{it.format}</span>
                <CopyBtn text={`${it.hook}\n\n${it.angle}`} />
              </div>
              <p className="font-semibold">{it.hook}</p>
              <p className="mt-1 text-sm text-[#425466]">{it.angle}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----- Tab: repurpose ----- */
function RepurposeTab() {
  const run = useServerFn(repurposePost);
  const [source, setSource] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState<(typeof PLATFORMS)[number]["id"]>("instagram");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("friendly");
  const [targets, setTargets] = useState<string[]>(["twitter", "linkedin"]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<RepurposeResult | null>(null);

  function toggle(id: string) {
    setTargets((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (targets.length === 0) { setErr("Pick at least one target platform"); return; }
    setLoading(true); setErr(null);
    try { setResult(await run({ data: { source, sourcePlatform, targets: targets as any, tone } })); }
    catch (e: any) { setErr(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Original post / content">
            <textarea required className={inputCls + " min-h-[140px]"}
              placeholder="Paste the original post, caption or thread to repurpose…"
              value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Source platform">
              <select className={inputCls} value={sourcePlatform} onChange={(e) => setSourcePlatform(e.target.value as any)}>
                {PLATFORMS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
              </select>
            </Field>
            <Field label="Tone">
              <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as any)}>
                {TONES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
            </Field>
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium">Target platforms</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.filter((p) => p.id !== sourcePlatform).map((p) => {
                const on = targets.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => toggle(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      on ? "border-[#635bff] bg-[#635bff] text-white"
                         : "border-[#e5e7eb] bg-white text-[#0a2540] hover:border-[#635bff]/40"
                    }`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <PrimaryBtn loading={loading}>Repurpose</PrimaryBtn>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </Card>

      {result && result.outputs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {result.outputs.map((o, i) => (
            <Card key={i}>
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-[#635bff]/10 px-2 py-0.5 text-xs font-semibold uppercase text-[#635bff]">{o.platform}</span>
                <CopyBtn text={o.content} />
              </div>
              <p className="whitespace-pre-wrap text-sm">{o.content}</p>
              {o.notes && <p className="mt-2 text-xs italic text-[#425466]">{o.notes}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----- Tab: bio ----- */
function BioTab() {
  const run = useServerFn(generateBio);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("instagram");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("friendly");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<BioResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try { setResult(await run({ data: { name, platform, about, keywords, tone } })); }
    catch (e: any) { setErr(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name / brand">
            <input required className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="About you / what you do">
            <textarea required className={inputCls + " min-h-[100px]"}
              value={about} onChange={(e) => setAbout(e.target.value)} />
          </Field>
          <Field label="Keywords (optional)">
            <input className={inputCls} placeholder="e.g. coach, founder, fitness"
              value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
                {PLATFORMS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
              </select>
            </Field>
            <Field label="Tone">
              <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as any)}>
                {TONES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
            </Field>
          </div>
          <PrimaryBtn loading={loading}>Generate bios</PrimaryBtn>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </Card>

      <Card>
        {!result ? (
          <p className="text-sm text-[#425466]">5 bio options optimized for your platform will appear here.</p>
        ) : (
          <ul className="space-y-3">
            {result.bios.map((b, i) => (
              <li key={i} className="rounded-lg bg-[#f6f9fc] p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#425466]">{b.length} chars</span>
                  <CopyBtn text={b} />
                </div>
                <p className="whitespace-pre-wrap">{b}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ----- Tab: long-form writer ----- */
const LONGFORM_OPTS: { id: LongformFormat; label: string }[] = [
  { id: "twitter_thread", label: "X / Twitter thread" },
  { id: "instagram_carousel", label: "Instagram carousel" },
  { id: "linkedin_article", label: "LinkedIn article" },
  { id: "blog_post", label: "Blog post" },
  { id: "youtube_script", label: "YouTube script" },
  { id: "newsletter", label: "Newsletter" },
];

function LongformTab() {
  const run = useServerFn(writeLongform);
  const mode = useMode();
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<LongformFormat>("twitter_thread");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("friendly");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<LongformResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try { setResult(await run({ data: { topic, format, tone, audience, mode } })); }
    catch (e: any) { setErr(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  const fullText = result
    ? `${result.hook}\n\n${result.sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n")}\n\n${result.outro}\n\n${result.hashtags.map((h) => "#" + h).join(" ")}`
    : "";

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Topic / angle">
              <textarea required className={inputCls + " min-h-[80px]"}
                placeholder="e.g. 5 lessons from my first year freelancing"
                value={topic} onChange={(e) => setTopic(e.target.value)} />
            </Field>
          </div>
          <Field label="Format">
            <select className={inputCls} value={format} onChange={(e) => setFormat(e.target.value as LongformFormat)}>
              {LONGFORM_OPTS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
            </select>
          </Field>
          <Field label="Tone">
            <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as any)}>
              {TONES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Audience (optional)">
              <input className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value)}
                placeholder={mode === "creator" ? "e.g. aspiring writers" : "e.g. small-business owners"} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <PrimaryBtn loading={loading}>Write {LONGFORM_OPTS.find((o) => o.id === format)?.label}</PrimaryBtn>
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          </div>
        </form>
      </Card>

      {result && (
        <Card>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{result.title}</h3>
              <p className="mt-1 text-sm italic text-[#425466]">{result.hook}</p>
            </div>
            <CopyBtn text={fullText} />
          </div>
          <ol className="space-y-3">
            {result.sections.map((s, i) => (
              <li key={i} className="rounded-lg bg-[#f6f9fc] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-[#635bff]">#{i + 1} · {s.heading}</span>
                  <CopyBtn text={`${s.heading}\n${s.body}`} />
                </div>
                <p className="whitespace-pre-wrap text-sm">{s.body}</p>
              </li>
            ))}
          </ol>
          {result.outro && (
            <div className="mt-3 rounded-lg border border-[#635bff]/20 bg-[#635bff]/5 p-3 text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-[#635bff]">Outro / CTA</span>
              {result.outro}
            </div>
          )}
          {result.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.hashtags.map((h) => (
                <span key={h} className="rounded-full bg-[#635bff]/10 px-2 py-0.5 text-xs text-[#635bff]">#{h}</span>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ----- Tab: growth playbook ----- */
function GrowthTab() {
  const run = useServerFn(growthPlaybook);
  const mode = useMode();
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("instagram");
  const [followers, setFollowers] = useState(500);
  const [goal, setGoal] = useState("grow audience");
  const [hoursPerWeek, setHours] = useState(5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<GrowthPlaybook | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try { setResult(await run({ data: { niche, platform, followers, goal, hoursPerWeek, mode } })); }
    catch (e: any) { setErr(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Niche / what you post about">
              <input required className={inputCls} value={niche} onChange={(e) => setNiche(e.target.value)}
                placeholder={mode === "creator" ? "e.g. solo travel in India" : "e.g. B2B SaaS for HR teams"} />
            </Field>
          </div>
          <Field label="Platform">
            <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              {PLATFORMS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          </Field>
          <Field label="Current followers">
            <input type="number" min={0} className={inputCls} value={followers}
              onChange={(e) => setFollowers(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Primary goal">
            <input className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </Field>
          <Field label="Hours per week you can commit">
            <input type="number" min={1} max={80} className={inputCls} value={hoursPerWeek}
              onChange={(e) => setHours(Math.min(80, Math.max(1, Number(e.target.value) || 1)))} />
          </Field>
          <div className="md:col-span-2">
            <PrimaryBtn loading={loading}>Build my 4-week playbook</PrimaryBtn>
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          </div>
        </form>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <span className="text-xs font-semibold uppercase text-[#635bff]">North star</span>
            <p className="mt-1 text-base font-medium">{result.northStar}</p>
            {result.pillars.length > 0 && (
              <>
                <span className="mt-4 block text-xs font-semibold uppercase text-[#635bff]">Content pillars</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.pillars.map((p) => (
                    <span key={p} className="rounded-full bg-[#0a2540] px-3 py-1 text-xs text-white">{p}</span>
                  ))}
                </div>
              </>
            )}
          </Card>

          {result.weekly.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {result.weekly.map((w) => (
                <Card key={w.week}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-[#635bff] px-2.5 py-0.5 text-xs font-bold text-white">Week {w.week}</span>
                    <span className="text-sm font-semibold">{w.focus}</span>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {w.actions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#635bff]" />
                        <span className="text-[#425466]">{a}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {result.collabs.length > 0 && (
              <Card>
                <h4 className="mb-2 text-sm font-semibold">Collab ideas</h4>
                <ul className="space-y-1.5 text-sm text-[#425466]">
                  {result.collabs.map((c, i) => (<li key={i}>• {c}</li>))}
                </ul>
              </Card>
            )}
            {result.monetization.length > 0 && (
              <Card>
                <h4 className="mb-2 text-sm font-semibold">Monetization</h4>
                <ul className="space-y-1.5 text-sm text-[#425466]">
                  {result.monetization.map((m, i) => (<li key={i}>• {m}</li>))}
                </ul>
              </Card>
            )}
            {result.kpis.length > 0 && (
              <Card>
                <h4 className="mb-2 text-sm font-semibold">KPIs to track</h4>
                <ul className="space-y-1.5 text-sm text-[#425466]">
                  {result.kpis.map((k, i) => (<li key={i}>• {k}</li>))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
