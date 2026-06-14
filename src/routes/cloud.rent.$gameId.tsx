import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock, IndianRupee, Zap, Check, Loader2 } from "lucide-react";
import { GAMES } from "./cloud.index";

export const Route = createFileRoute("/cloud/rent/$gameId")({
  head: ({ params }) => {
    const g = GAMES.find((x) => x.id === params.gameId);
    return {
      meta: [
        { title: g ? `Rent ${g.title} — Nive Cloud Gaming` : "Rent a game — Nive Cloud Gaming" },
        { name: "description", content: g ? `Rent ${g.title} on a ${g.rigTier} cloud rig at ₹${g.pricePerHour}/hour.` : "Rent cloud games by the hour." },
      ],
    };
  },
  loader: ({ params }) => {
    const game = GAMES.find((g) => g.id === params.gameId);
    if (!game) throw notFound();
    return { game };
  },
  component: RentPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a14] text-white">
      <div className="text-center">
        <p className="text-[15px] text-white/70">Game not found.</p>
        <Link to="/cloud" className="mt-3 inline-block text-[#00d4ff] hover:underline">← Back to catalog</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a14] text-white">
      <p className="text-[14px] text-white/70">Something went wrong: {error.message}</p>
    </div>
  ),
});

function RentPage() {
  const { game } = Route.useLoaderData();
  const navigate = useNavigate();
  const [hours, setHours] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { subtotal, gst, total, discountNote } = useMemo(() => {
    const sub = Math.max(0, hours) * game.pricePerHour;
    // Loyalty discount for longer sessions
    let discount = 0;
    let note = "";
    if (hours >= 10) { discount = 0.15; note = "15% off for 10+ hours"; }
    else if (hours >= 5) { discount = 0.1; note = "10% off for 5+ hours"; }
    const discounted = sub * (1 - discount);
    const gstAmt = discounted * 0.18;
    return {
      subtotal: sub,
      gst: gstAmt,
      total: discounted + gstAmt,
      discountNote: note,
    };
  }, [hours, game.pricePerHour]);

  const presets = [1, 2, 5, 10, 24];

  const onRent = async () => {
    if (hours <= 0) return;
    setSubmitting(true);
    // Simulated booking confirmation — payment hook can be wired later
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="border-b border-white/10 bg-[#0a0a14]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/cloud" className="inline-flex items-center gap-2 text-[14px] text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to catalog
          </Link>
          <Link to="/welcome" className="text-[14px] text-white/60 hover:text-white">nive</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1100px] gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Game panel */}
        <section>
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${game.accent}55, ${game.accent}11)` }}
          >
            <img
              src={game.image}
              alt={`${game.title} cover art`}
              width={768}
              height={512}
              className="h-64 w-full object-cover sm:h-72"
            />
          </div>

          <div className="mt-5 flex items-center gap-2 text-[12.5px] text-white/60">
            <span>{game.genre}</span>
            <span>·</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">{game.rigTier} rig</span>
          </div>
          <h1 className="mt-2 text-[36px] font-bold tracking-[-0.02em]">{game.title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">{game.blurb}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-[13px]">
            <Spec label="Resolution" value={game.rigTier === "Ultra" ? "1440p / 4K" : game.rigTier === "Performance" ? "1080p / 1440p" : "1080p"} />
            <Spec label="Frame rate" value={game.rigTier === "Ultra" ? "120–144 FPS" : "60–120 FPS"} />
            <Spec label="GPU class" value={game.rigTier === "Ultra" ? "RTX 4080-class" : game.rigTier === "Performance" ? "RTX 3070-class" : "GTX 1660-class"} />
            <Spec label="Region" value="Mumbai (ap-south-1)" />
          </div>
        </section>

        {/* Rental panel */}
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-white/50">Hourly rate</p>
              <div className="mt-1 flex items-baseline gap-1">
                <IndianRupee className="h-4 w-4 text-white/80" />
                <span className="text-[28px] font-bold">{game.pricePerHour}</span>
                <span className="text-[13px] text-white/60">/ hour</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#22c55e]/15 px-2.5 py-1 text-[11.5px] font-medium text-[#86efac]">
              <Zap className="h-3 w-3" /> Rig available now
            </div>
          </div>

          {!confirmed ? (
            <>
              <label className="mt-6 block text-[13px] font-semibold text-white/80">
                How many hours do you want to play?
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setHours(p)}
                    className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                      hours === p
                        ? "bg-[#635bff] text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {p}h
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <Clock className="h-4 w-4 text-white/50" />
                <input
                  type="number"
                  min={1}
                  max={168}
                  step={1}
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, Math.min(168, Number(e.target.value) || 0)))}
                  className="w-full bg-transparent text-[16px] font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[12.5px] text-white/50">hours</span>
              </div>

              <div className="mt-5 space-y-2 text-[13.5px]">
                <Row label={`${game.pricePerHour} × ${hours} hr`} value={`₹${subtotal.toFixed(2)}`} />
                {discountNote && (
                  <Row label={discountNote} value={`− ₹${(subtotal - subtotal * (1 - (hours >= 10 ? 0.15 : 0.1))).toFixed(2)}`} accent />
                )}
                <Row label="GST (18%)" value={`₹${gst.toFixed(2)}`} muted />
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[16px] font-bold">
                  <span>Estimated total</span>
                  <span className="text-white">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onRent}
                disabled={submitting || hours <= 0}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#635bff] to-[#ff4d8d] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(99,91,255,0.45)] transition-all hover:translate-y-[-1px] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Reserving rig…
                  </>
                ) : (
                  <>Rent for {hours}h · ₹{total.toFixed(0)}</>
                )}
              </button>

              <p className="mt-3 text-center text-[11.5px] text-white/50">
                You're only charged for the time you actually play. Unused hours are refunded.
              </p>
            </>
          ) : (
            <div className="mt-6 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-5 text-center">
              <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#86efac]">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-[18px] font-bold">Rig reserved!</h3>
              <p className="mt-1 text-[13.5px] text-white/80">
                Your {game.title} session ({hours} hr · ₹{total.toFixed(0)}) is ready.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/auth" })}
                  className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0a0a14] hover:bg-white/90"
                >
                  Sign in to launch
                </button>
                <Link
                  to="/cloud"
                  className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white hover:bg-white/10"
                >
                  Rent another game
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-semibold text-white">{value}</div>
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-white/55" : accent ? "text-[#86efac]" : "text-white/85"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
