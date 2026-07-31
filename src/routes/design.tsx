import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Palette, Loader2, Check, Copy } from "lucide-react";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { StudioShell, Card, ErrorNote } from "@/components/StudioShell";
import { runDesignConcept, type DesignConcept } from "@/lib/studio.functions";

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: "Design Studio — AI UI concepts & brand kits | Nive AI" },
      {
        name: "description",
        content:
          "Generate a full design direction: palette, type pairing, hero copy, section map, component notes and ready-to-paste CSS tokens.",
      },
      { property: "og:title", content: "Design Studio — Nive AI" },
      {
        property: "og:description",
        content: "UI concepts, hero art direction and brand kits that stay consistent with your brand voice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/design" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <DesignPage />
    </BusinessAuthGate>
  ),
});

const STYLES = [
  "Editorial & serif",
  "Swiss minimal",
  "Neo-brutalist",
  "Warm organic",
  "Dark technical",
  "Playful retro",
];

function DesignPage() {
  const run = useServerFn(runDesignConcept);
  const [brief, setBrief] = useState("");
  const [style, setStyle] = useState<string>(STYLES[0]);
  const [brandVoice, setBrandVoice] = useState("");
  const [concept, setConcept] = useState<DesignConcept | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (brief.trim().length < 6) {
      setError("Describe the product or page you want designed.");
      return;
    }
    setLoading(true);
    setError("");
    setConcept(null);
    try {
      const res = await run({
        data: { brief: brief.trim(), style, brandVoice: brandVoice || undefined },
      });
      setConcept(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyTokens = async () => {
    if (!concept) return;
    await navigator.clipboard.writeText(concept.cssTokens);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const heroA = concept?.palette?.[0]?.hex ?? "#ff4d8d";
  const heroB = concept?.palette?.[1]?.hex ?? "#635bff";

  return (
    <StudioShell
      title="Design Studio"
      subtitle="Generate UI concepts, hero art direction and brand kits that stay consistent with your saved brand voice — palette, typography, layout map and CSS tokens in one pass."
      icon={Palette}
      accent="#ff4d8d"
    >
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
              What are we designing?
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
              placeholder="Landing page for a B2B logistics dashboard aimed at Indian SMB fleet owners…"
              className="mt-2 w-full resize-y rounded-xl border border-[#0a2540]/12 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#ff4d8d]"
            />
            <label className="mt-4 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
              Brand voice / existing rules (optional)
            </label>
            <input
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="Confident, plainspoken, no hype. Never use purple."
              className="mt-2 w-full rounded-xl border border-[#0a2540]/12 px-4 py-2.5 text-[15px] outline-none focus:border-[#ff4d8d]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
              Style direction
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    style === s
                      ? "border-[#ff4d8d] bg-[#ff4d8d]/8 text-[#ff4d8d]"
                      : "border-[#0a2540]/12 text-[#425466] hover:border-[#0a2540]/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4d8d] px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#0a2540] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Designing…" : "Generate concept"}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}
      </Card>

      {concept && (
        <div className="mt-6 space-y-5">
          {/* Hero mock */}
          <div
            className="overflow-hidden rounded-2xl p-10 text-white"
            style={{ backgroundImage: `linear-gradient(135deg, ${heroA}, ${heroB})` }}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] opacity-80">
              {concept.name} · {concept.vibe}
            </p>
            <h2 className="mt-3 max-w-[720px] text-[32px] font-bold leading-[1.1] sm:text-[42px]">
              {concept.hero?.headline}
            </h2>
            <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed opacity-90">
              {concept.hero?.subhead}
            </p>
            <span className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-[#0a2540]">
              {concept.hero?.cta}
            </span>
            <p className="mt-6 max-w-[560px] text-[13px] italic opacity-80">
              Art direction: {concept.hero?.art}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="text-[17px] font-semibold">Palette</h3>
              <div className="mt-4 space-y-2.5">
                {concept.palette.map((c) => (
                  <div key={c.hex + c.name} className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg border border-[#0a2540]/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">
                        {c.name} <span className="text-[#8792a2]">{c.hex}</span>
                      </p>
                      <p className="truncate text-[13px] text-[#425466]">{c.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-[17px] font-semibold">Typography</h3>
              <p className="mt-4 text-[26px] font-bold leading-tight">
                {concept.typography?.heading}
              </p>
              <p className="mt-1 text-[15px] text-[#425466]">Body: {concept.typography?.body}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-[#425466]">
                {concept.typography?.rationale}
              </p>
              <p className="mt-5 text-[15px] font-medium">{concept.tagline}</p>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="text-[17px] font-semibold">Page structure</h3>
              <ol className="mt-4 space-y-3">
                {(concept.sections ?? []).map((s, i) => (
                  <li key={s.title + i} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f6f9fc] text-[12px] font-semibold text-[#635bff]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold">{s.title}</p>
                      <p className="text-[13px] text-[#425466]">{s.purpose}</p>
                      <p className="text-[13px] text-[#8792a2]">Layout: {s.layout}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <h3 className="text-[17px] font-semibold">Components</h3>
              <ul className="mt-4 space-y-3">
                {(concept.components ?? []).map((c, i) => (
                  <li key={c.name + i}>
                    <p className="text-[14px] font-semibold">{c.name}</p>
                    <p className="text-[13px] text-[#425466]">{c.notes}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] font-semibold">CSS tokens</h3>
              <button
                type="button"
                onClick={copyTokens}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a2540]/12 px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-[#0a2540]/25"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0a2540] p-4 text-[13px] leading-relaxed text-white">
              <code>{concept.cssTokens}</code>
            </pre>
          </Card>
        </div>
      )}
    </StudioShell>
  );
}
