import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { StudioShell, Card, MarkdownPanel, ErrorNote } from "@/components/StudioShell";
import { runStudioMode } from "@/lib/studio.functions";

export type StudioMode = {
  id: string;
  label: string;
  desc: string;
};

export function ModeStudio({
  title,
  subtitle,
  icon,
  accent,
  modes,
  placeholder,
  contextPlaceholder,
  examples = [],
  inputLabel = "Input",
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  modes: StudioMode[];
  placeholder: string;
  contextPlaceholder?: string;
  examples?: string[];
  inputLabel?: string;
}) {
  const run = useServerFn(runStudioMode);
  const [mode, setMode] = useState(modes[0].id);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; label: string } | null>(null);

  const active = modes.find((m) => m.id === mode)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 4 || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const out = await run({ data: { mode, input: input.trim(), context: context.trim() || undefined } });
      setResult(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioShell title={title} subtitle={subtitle} icon={icon} accent={accent}>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#425466]">Mode</p>
          <div className="mt-3 space-y-1.5">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  m.id === mode
                    ? "border-transparent text-white"
                    : "border-[#0a2540]/10 hover:border-[#0a2540]/25"
                }`}
                style={m.id === mode ? { backgroundColor: accent } : undefined}
              >
                <span className="block text-[14px] font-semibold">{m.label}</span>
                <span
                  className={`mt-0.5 block text-[12.5px] leading-snug ${
                    m.id === mode ? "text-white/80" : "text-[#425466]"
                  }`}
                >
                  {m.desc}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold" htmlFor="studio-input">
                  {inputLabel}
                </label>
                <textarea
                  id="studio-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  rows={9}
                  className="w-full resize-y rounded-xl border border-[#0a2540]/12 bg-[#f6f9fc] px-3.5 py-3 text-[14px] leading-relaxed outline-none transition-colors focus:border-[#635bff] focus:bg-white"
                />
              </div>

              {examples.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setInput(ex)}
                      className="rounded-full border border-[#0a2540]/12 px-3 py-1.5 text-[12.5px] text-[#425466] transition-colors hover:border-[#635bff] hover:text-[#635bff]"
                    >
                      {ex.length > 54 ? `${ex.slice(0, 54)}…` : ex}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold" htmlFor="studio-context">
                  Context <span className="font-normal text-[#425466]">(optional)</span>
                </label>
                <input
                  id="studio-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={contextPlaceholder ?? "Audience, tone, constraints, brand notes…"}
                  className="w-full rounded-xl border border-[#0a2540]/12 bg-[#f6f9fc] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#635bff] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={busy || input.trim().length < 4}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-medium text-white transition-opacity disabled:opacity-45"
                  style={{ backgroundColor: accent }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {busy ? "Working…" : `Run ${active.label}`}
                </button>
                <span className="text-[13px] text-[#425466]">{active.desc}</span>
              </div>
            </form>
          </Card>

          {error && <ErrorNote message={error} />}
          {result && (
            <MarkdownPanel
              text={result.text}
              filename={`nive-${mode.replace(/\./g, "-")}.md`}
            />
          )}
        </div>
      </div>
    </StudioShell>
  );
}
