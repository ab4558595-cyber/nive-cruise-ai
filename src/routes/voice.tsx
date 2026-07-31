import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Loader2, Code2, Megaphone, Phone, ListChecks } from "lucide-react";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { StudioShell, Card, MarkdownPanel, ErrorNote } from "@/components/StudioShell";
import { createVoiceInput, isVoiceSupported } from "@/lib/voiceInput";
import { runVoiceBrief } from "@/lib/studio.functions";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Voice Agents — speak a brief, get code or copy | Nive AI" },
      {
        name: "description",
        content:
          "Dictate a brief with your microphone and Nive turns it into runnable code, marketing copy, a call script or structured notes — hands-free.",
      },
      { property: "og:title", content: "Voice Agents — Nive AI" },
      {
        property: "og:description",
        content: "Hands-free building: speak your brief, get code, copy, call scripts or notes back.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/voice" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <VoicePage />
    </BusinessAuthGate>
  ),
});

const OUTPUTS = [
  { key: "code", label: "Code", icon: Code2, hint: "Runnable multi-file code" },
  { key: "copy", label: "Copy", icon: Megaphone, hint: "Headlines, body, CTA" },
  { key: "script", label: "Call script", icon: Phone, hint: "Opener → objections → close" },
  { key: "notes", label: "Notes", icon: ListChecks, hint: "Summary, decisions, actions" },
] as const;

type OutputKey = (typeof OUTPUTS)[number]["key"];

function VoicePage() {
  const run = useServerFn(runVoiceBrief);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [output, setOutput] = useState<OutputKey>("code");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    setSupported(isVoiceSupported());
  }, []);

  const toggleMic = () => {
    setError("");
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = createVoiceInput({
      onPartial: (t) => setPartial(t),
      onFinal: (t) => {
        setPartial("");
        setTranscript((prev) => (prev ? `${prev} ${t}`.trim() : t));
      },
      onError: (m) => {
        setError(m);
        setListening(false);
      },
    });
    if (!rec) {
      setSupported(false);
      return;
    }
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const submit = async () => {
    const text = `${transcript} ${partial}`.trim();
    if (text.length < 4) {
      setError("Say (or type) a bit more first.");
      return;
    }
    recRef.current?.stop();
    setListening(false);
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await run({ data: { transcript: text, output, context: context || undefined } });
      setResult(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudioShell
      title="Voice Agents"
      subtitle="Speak your brief and get back code, copy or a call script — hands-free building. Your microphone stays in the browser; only the final transcript is sent."
      icon={Mic}
      accent="#7a5cff"
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleMic}
              disabled={!supported}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium text-white transition-colors disabled:opacity-40 ${
                listening ? "bg-[#ff4d4f]" : "bg-[#7a5cff] hover:bg-[#0a2540]"
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? "Stop listening" : "Start speaking"}
            </button>
            {listening && (
              <span className="inline-flex items-center gap-2 text-[14px] text-[#425466]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d4f]" /> Listening…
              </span>
            )}
          </div>

          {!supported && (
            <p className="mt-3 text-[13px] text-[#8792a2]">
              Speech recognition isn’t available in this browser — type your brief below instead.
            </p>
          )}

          <label className="mt-5 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
            Transcript
          </label>
          <textarea
            value={partial ? `${transcript} ${partial}`.trim() : transcript}
            onChange={(e) => {
              setPartial("");
              setTranscript(e.target.value);
            }}
            rows={7}
            placeholder="Build me a pricing page in React with three tiers and a monthly/annual toggle…"
            className="mt-2 w-full resize-y rounded-xl border border-[#0a2540]/12 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#7a5cff]"
          />

          <label className="mt-4 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
            Extra context (optional)
          </label>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Stack, audience, tone, constraints…"
            className="mt-2 w-full rounded-xl border border-[#0a2540]/12 px-4 py-2.5 text-[15px] outline-none focus:border-[#7a5cff]"
          />
        </Card>

        <Card>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
            What should Nive return?
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {OUTPUTS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setOutput(o.key)}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  output === o.key
                    ? "border-[#7a5cff] bg-[#7a5cff]/6 shadow-[0_0_0_3px_rgba(122,92,255,0.12)]"
                    : "border-[#0a2540]/10 hover:border-[#0a2540]/25"
                }`}
              >
                <o.icon className="h-4.5 w-4.5 text-[#7a5cff]" />
                <span className="mt-2 block text-[15px] font-semibold">{o.label}</span>
                <span className="mt-0.5 block text-[13px] text-[#425466]">{o.hint}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0a2540] px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#635bff] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Working…" : "Generate"}
          </button>
          {error && (
            <div className="mt-4">
              <ErrorNote message={error} />
            </div>
          )}
        </Card>
      </div>

      {result && (
        <div className="mt-6">
          <MarkdownPanel text={result} filename="nive-voice-output.md" />
        </div>
      )}
    </StudioShell>
  );
}
