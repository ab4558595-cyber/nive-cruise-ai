import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Loader2, Lock, ArrowUp, Copy, Check, Command, Cpu, Globe, Terminal, Smartphone } from "lucide-react";
import { safeStorage } from "@/lib/safeStorage";

const STORAGE_KEY = "nive_free_try_used_v1";

const QUICK_PROMPTS = [
  { icon: Globe, label: "React debounce hook", prompt: "Write a React hook to debounce a value with TypeScript types." },
  { icon: Cpu, label: "ESP32 relay", prompt: "Arduino code for ESP32 hosting a web server to toggle a relay on GPIO 26." },
  { icon: Smartphone, label: "SwiftUI login", prompt: "SwiftUI login screen with email/password validation and a sign-in button." },
  { icon: Terminal, label: "Python scraper", prompt: "Python script using requests + BeautifulSoup to scrape Hacker News to CSV." },
];

export function TryAiDemo() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return safeStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Streaming-style reveal for the response.
  useEffect(() => {
    if (!output) { setRevealed(""); return; }
    setRevealed("");
    let i = 0;
    const step = Math.max(2, Math.floor(output.length / 220));
    const id = window.setInterval(() => {
      i = Math.min(output.length, i + step);
      setRevealed(output.slice(0, i));
      if (i >= output.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [output]);

  // ⌘K / Ctrl+K focuses the prompt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const el = inputRef.current;
        if (el) { e.preventDefault(); el.focus(); el.select(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function submit(text: string) {
    if (used || loading || text.trim().length < 3) return;
    setError(null);
    setOutput(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/try-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setOutput(data.text ?? "");
        try { safeStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
        setUsed(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); submit(prompt); };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* ignore */ }
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10">
      <div className="relative">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] opacity-70 blur-2xl"
          style={{ background: "radial-gradient(60% 60% at 20% 10%, rgba(189,180,255,0.35), transparent 60%), radial-gradient(50% 50% at 90% 90%, rgba(255,138,101,0.22), transparent 60%)" }}
        />

        <div className="overflow-hidden rounded-3xl border border-[#0a2540]/8 bg-white shadow-[0_20px_80px_-24px_rgba(10,37,64,0.20)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-[#0a2540]/8 bg-gradient-to-r from-white to-[#f6f9fc] px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#635bff]">
                <Sparkles className="h-3 w-3" /> Free demo
              </span>
              <span className="hidden text-[12px] text-[#425466] sm:inline">No signup — try Nive AI once on us</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1 rounded-md border border-[#0a2540]/10 bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#425466] sm:inline-flex">
                <Command className="h-3 w-3" /> K
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2540]/10 bg-white px-2 py-0.5 text-[11px] font-medium text-[#425466]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> nive · fast
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <h2 className="text-[26px] font-semibold tracking-tight text-[#0a2540] sm:text-[34px]" style={{ fontFamily: "var(--font-serif)" }}>
              Try Nive AI before you sign up
            </h2>
            <p className="mt-2 max-w-[640px] text-[15px] text-[#425466]">
              Ask anything — code, content, or a quick idea. One free response, streamed instantly.
            </p>

            {/* Composer */}
            <form onSubmit={onSubmit} className="mt-6">
              <div className={`group relative flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 shadow-sm transition-all ${used ? "border-[#0a2540]/10 bg-[#f6f9fc]" : "border-[#0a2540]/12 focus-within:border-[#635bff]/50 focus-within:ring-4 focus-within:ring-[#635bff]/12"}`}>
                <Sparkles className="h-4 w-4 shrink-0 text-[#635bff]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Nive to build something — e.g. a React hook to debounce a value"
                  disabled={used || loading}
                  maxLength={600}
                  className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[#0a2540] outline-none placeholder:text-[#425466]/60"
                />
                <button
                  type="submit"
                  disabled={used || loading || prompt.trim().length < 3}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#635bff] text-white shadow-[0_6px_18px_rgba(99,91,255,0.35)] transition-all hover:-translate-y-[1px] hover:bg-[#5048d6] disabled:cursor-not-allowed disabled:bg-[#635bff]/35 disabled:shadow-none"
                  aria-label="Send"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : used ? <Lock className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>

              {/* Quick-prompt chips */}
              {!output && !loading && !used && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map(({ icon: Icon, label, prompt: p }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => { setPrompt(p); inputRef.current?.focus(); }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2540]/10 bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#425466] transition-all hover:-translate-y-[1px] hover:border-[#635bff]/40 hover:text-[#635bff] hover:shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#635bff]" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Streaming preview */}
            {loading && (
              <div className="mt-6 rounded-2xl border border-[#0a2540]/8 bg-white p-5">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#635bff]">
                  <Sparkles className="h-3.5 w-3.5" /> Nive AI is thinking
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-11/12 animate-pulse rounded bg-gradient-to-r from-[#635bff]/15 via-[#bdb4ff]/25 to-[#ff8a65]/15" />
                  <div className="h-3 w-9/12 animate-pulse rounded bg-gradient-to-r from-[#635bff]/15 via-[#bdb4ff]/25 to-[#ff8a65]/15" />
                  <div className="h-3 w-10/12 animate-pulse rounded bg-gradient-to-r from-[#635bff]/15 via-[#bdb4ff]/25 to-[#ff8a65]/15" />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
                {error}
              </div>
            )}

            {output && (
              <div className="mt-6 rounded-2xl border border-[#0a2540]/8 bg-gradient-to-b from-white to-[#fafbff] p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#635bff]">
                    <Sparkles className="h-3.5 w-3.5" /> Nive AI
                  </div>
                  <button
                    onClick={copy}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[#425466] transition-colors hover:bg-[#635bff]/8 hover:text-[#635bff]"
                    aria-label="Copy response"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#0a2540]">
                  {revealed}
                  {revealed.length < output.length && (
                    <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-pulse bg-[#635bff]" />
                  )}
                </p>
              </div>
            )}

            {used && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#635bff]/20 bg-gradient-to-r from-[#f6f9fc] to-[#efeeff] px-5 py-4">
                <p className="text-[14px] text-[#425466]">
                  You've used your free try. Create a free account to keep building.
                </p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-4 py-2 text-[14px] font-medium text-white shadow-[0_6px_18px_rgba(99,91,255,0.35)] transition-all hover:-translate-y-[1px] hover:bg-[#0a2540]"
                >
                  Sign up free <span aria-hidden>›</span>
                </Link>
              </div>
            )}

            <p className="mt-4 text-[12px] text-[#425466]/70">
              One free response per browser. No card required. Rate-limited to keep the demo fast for everyone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
