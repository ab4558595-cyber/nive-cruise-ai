import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Loader2, Lock } from "lucide-react";

const STORAGE_KEY = "nive_free_try_used_v1";

export function TryAiDemo() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (used || loading) return;
    setError(null);
    setOutput(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/try-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setOutput(data.text ?? "");
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {
          /* ignore */
        }
        setUsed(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10">
      <div className="overflow-hidden rounded-3xl border border-[#635bff]/15 bg-gradient-to-br from-[#f6f9fc] via-white to-[#f0eeff] p-6 shadow-[0_8px_40px_rgba(99,91,255,0.08)] sm:p-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-[#635bff]">
            <Sparkles className="h-3.5 w-3.5" /> Free demo
          </span>
          <span className="text-[13px] text-[#425466]">No signup required — try Nive AI once on us</span>
        </div>

        <h2 className="text-[26px] font-bold tracking-tight text-[#0a2540] sm:text-[34px]">
          Try Nive AI before you sign up
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] text-[#425466]">
          Ask anything — code, content, or a quick idea. You get one free response, instantly.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Write a React hook to debounce a value"
            disabled={used || loading}
            maxLength={600}
            className="w-full rounded-full border border-[#0a2540]/10 bg-white px-5 py-3 text-[15px] text-[#0a2540] shadow-sm outline-none transition-colors placeholder:text-[#425466]/60 focus:border-[#635bff]/40 focus:ring-2 focus:ring-[#635bff]/15 disabled:bg-[#f6f9fc]"
          />
          <button
            type="submit"
            disabled={used || loading || prompt.trim().length < 3}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#635bff] px-6 py-3 text-[15px] font-medium text-white shadow-[0_4px_14px_rgba(99,91,255,0.35)] transition-all hover:translate-y-[-1px] hover:bg-[#5048d6] disabled:cursor-not-allowed disabled:bg-[#635bff]/40 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking
              </>
            ) : used ? (
              <>
                <Lock className="h-4 w-4" /> Used
              </>
            ) : (
              <>Try it free</>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        {output && (
          <div className="mt-6 rounded-2xl border border-[#0a2540]/8 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#635bff]">
              <Sparkles className="h-3.5 w-3.5" /> Nive AI
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#0a2540]">{output}</p>
          </div>
        )}

        {used && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#635bff]/20 bg-white px-5 py-4">
            <p className="text-[14px] text-[#425466]">
              You've used your free try. Create a free account to keep building.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0a2540]"
            >
              Sign up free <span aria-hidden>›</span>
            </Link>
          </div>
        )}

        <p className="mt-4 text-[12px] text-[#425466]/70">
          One free response per browser. No card required. Rate-limited to keep the demo fast for everyone.
        </p>
      </div>
    </section>
  );
}
