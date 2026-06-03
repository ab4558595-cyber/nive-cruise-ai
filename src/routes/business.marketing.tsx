import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, Loader2, Megaphone, Sparkles, Copy, Check } from "lucide-react";
import { Ribbon } from "@/components/Ribbon";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { generateMarketing, type MarketingResult } from "@/lib/marketing.functions";

export const Route = createFileRoute("/business/marketing")({
  head: () => ({
    meta: [
      { title: "AI Marketing Generator — Nive AI for Business" },
      {
        name: "description",
        content:
          "Generate ad, email, social, and landing copy tuned to your brand voice. Download outputs as text.",
      },
      { property: "og:title", content: "AI Marketing Generator — Nive AI" },
      {
        property: "og:description",
        content: "Choose a product, pick a tone, and generate on-brand marketing copy in seconds.",
      },
    ],
    links: [{ rel: "canonical", href: "/business/marketing" }],
  }),
  component: MarketingPage,
});

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "bold", label: "Bold" },
  { id: "playful", label: "Playful" },
  { id: "luxurious", label: "Luxurious" },
  { id: "minimal", label: "Minimal" },
  { id: "urgent", label: "Urgent" },
] as const;

const CHANNELS = [
  { id: "ad", label: "Paid ad" },
  { id: "email", label: "Email" },
  { id: "social", label: "Social post" },
  { id: "landing", label: "Landing hero" },
] as const;

const EXAMPLES = [
  "Organic cold-pressed coffee subscription for remote workers",
  "AI-powered resume builder for new grads",
  "Boutique yoga studio offering sunrise rooftop classes",
  "B2B analytics dashboard for ecommerce founders",
];

function MarketingPage() {
  const generate = useServerFn(generateMarketing);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("professional");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["id"]>("ad");
  const [result, setResult] = useState<MarketingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    const trimmed = product.trim();
    if (trimmed.length < 2) {
      setError("Tell us what you're selling first.");
      return;
    }
    setLoading(true);
    try {
      const data = await generate({
        data: { product: trimmed, audience: audience.trim(), tone, channel },
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      /* ignore */
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const text =
      `Product: ${product}\nAudience: ${audience || "—"}\nTone: ${result.tone}\nChannel: ${result.channel}\n\n` +
      `HEADLINE\n${result.headline}\n\n` +
      `VARIANTS\n${result.variants.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n\n` +
      `BODY\n${result.body}\n\n` +
      `CTA\n${result.cta}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-${result.channel}-${Date.now()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <Ribbon />

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/business" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive<span className="ml-1 text-[#635bff]">/business</span>
        </Link>
        <Link
          to="/business"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to overview
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-[1180px] px-6 pb-24 pt-6 sm:px-10 sm:pt-10">
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#635bff]">
            <Megaphone className="h-3.5 w-3.5" /> AI Marketing
          </div>
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#0a2540] sm:text-[44px]">
            On-brand marketing copy in seconds.
          </h1>
          <p className="mt-3 text-[15px] text-[#425466]">
            Describe your product, pick a tone and channel, and generate headlines, variants, body
            copy, and a CTA — ready to download.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
          {/* Form */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08),0_5px_15px_rgba(0,0,0,0.04)] ring-1 ring-[#e3e8ee]">
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#697386]">
                Product / service
              </span>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="e.g. Cold-pressed coffee subscription for remote workers"
                className="mt-1.5 w-full resize-none rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] text-[#0a2540] outline-none focus:border-[#635bff]"
              />
              <span className="mt-1 block text-right text-[11px] text-[#697386]">{product.length}/280</span>
            </label>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="self-center text-[11px] font-semibold uppercase tracking-wider text-[#697386]">
                Try:
              </span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setProduct(ex)}
                  className="rounded-full border border-[#e3e8ee] bg-white px-2.5 py-1 text-[11.5px] text-[#425466] transition-all hover:border-[#635bff] hover:text-[#635bff]"
                >
                  {ex.split(" ").slice(0, 3).join(" ")}…
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#697386]">
                Audience (optional)
              </span>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value.slice(0, 200))}
                placeholder="e.g. Remote-first product managers, 25–40"
                className="mt-1.5 w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2 text-[14px] text-[#0a2540] outline-none focus:border-[#635bff]"
              />
            </label>

            <div className="mt-4">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#697386]">Tone</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all ${
                      tone === t.id
                        ? "border-[#635bff] bg-[#635bff] text-white"
                        : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff] hover:text-[#635bff]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#697386]">Channel</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`rounded-md border px-3 py-2 text-[13px] font-medium transition-all ${
                      channel === c.id
                        ? "border-[#635bff] bg-[#635bff]/8 text-[#635bff]"
                        : "border-[#e3e8ee] bg-white text-[#0a2540] hover:border-[#635bff]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating…" : "Generate copy"}
            </button>

            {error && (
              <p className="mt-3 rounded-md bg-[#fff1f0] px-3 py-2 text-[12.5px] text-[#c0392b]">
                {error}
              </p>
            )}
          </div>

          {/* Results */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_15px_50px_rgba(50,50,93,0.08),0_5px_15px_rgba(0,0,0,0.04)] ring-1 ring-[#e3e8ee]">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[#0a2540]">Generated copy</h2>
              <button
                type="button"
                onClick={downloadResult}
                disabled={!result}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#e3e8ee] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0a2540] transition-all hover:border-[#635bff] hover:text-[#635bff] disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" /> Download .txt
              </button>
            </div>

            {!result ? (
              <div className="mt-6 flex h-72 items-center justify-center rounded-lg border border-dashed border-[#e3e8ee] text-[13.5px] text-[#697386]">
                Fill in the form, then your copy will appear here.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <Block label="Headline" onCopy={() => copy("h", result.headline)} copied={copied === "h"}>
                  <p className="text-[20px] font-semibold leading-snug text-[#0a2540]">
                    {result.headline}
                  </p>
                </Block>

                <Block label="Variants" onCopy={() => copy("v", result.variants.join("\n"))} copied={copied === "v"}>
                  <ul className="space-y-1.5 text-[14px] text-[#3c4257]">
                    {result.variants.map((v, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[#697386]">{i + 1}.</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </Block>

                <Block label="Body" onCopy={() => copy("b", result.body)} copied={copied === "b"}>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#3c4257]">
                    {result.body}
                  </p>
                </Block>

                <Block label="Call to action" onCopy={() => copy("c", result.cta)} copied={copied === "c"}>
                  <span className="inline-flex items-center rounded-md bg-[#635bff] px-3 py-1.5 text-[13px] font-semibold text-white">
                    {result.cta}
                  </span>
                </Block>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Block({
  label,
  children,
  onCopy,
  copied,
}: {
  label: string;
  children: React.ReactNode;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#697386]">
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#697386] transition-colors hover:text-[#635bff]"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="rounded-lg border border-[#eef1f5] bg-[#fafbfc] p-4">{children}</div>
    </div>
  );
}
