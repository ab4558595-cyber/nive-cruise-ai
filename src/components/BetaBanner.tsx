import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";

const KEY = "nive-beta-banner-dismissed";

export function BetaBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{ backgroundImage: "linear-gradient(95deg, #0a2540 0%, #4b45d8 48%, #ff4d8d 100%)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(600px 90px at 20% 120%, rgba(0,212,255,.55), transparent), radial-gradient(500px 80px at 80% -30%, rgba(255,255,255,.35), transparent)",
        }}
      />
      <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-1.5 px-6 py-2.5 text-[13.5px] sm:px-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ring-white/25">
          <Sparkles className="h-3 w-3" /> Beta
        </span>
        <p className="font-medium">
          Nive AI is currently in beta — tools ship fast, and things may change or wobble.
        </p>
        <Link
          to="/docs"
          className="font-semibold text-[#9ff0ff] underline-offset-4 hover:underline"
        >
          See what's live ›
        </Link>
        <button
          type="button"
          aria-label="Dismiss beta notice"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setHidden(true);
          }}
          className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
