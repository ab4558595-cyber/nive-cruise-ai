import ribbonAsset from "@/assets/ribbon.png.asset.json";

/**
 * Flowing ribbon: PNG ribbon with a continuous shimmer sweep + gentle wave
 * skew that fakes a silk-like flow. No blank gaps — sized to overflow.
 */
export function Ribbon({
  side = "right",
  className = "",
  shellClassName = "",
  fadeClassName = "",
}: {
  side?: "right" | "left";
  className?: string;
  shellClassName?: string;
  fadeClassName?: string;
}) {
  const flipStyle = side === "left" ? { transform: "scaleX(-1)" } : undefined;
  const fadeStyle =
    side === "left"
      ? {
          background:
            "linear-gradient(270deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.78) 28%, rgba(255,255,255,0.18) 56%, rgba(255,255,255,0) 78%)",
          right: 0,
          left: "auto",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.78) 28%, rgba(255,255,255,0.18) 56%, rgba(255,255,255,0) 78%)",
        };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      style={{
        clipPath: "inset(0)",
        WebkitClipPath: "inset(0)",
        contain: "strict",
        maxWidth: "100vw",
      }}
    >
      <style>{`
        @keyframes srFlow {
          0%   { transform: translate3d(0, -2%, 0) rotate(0deg) scale(1.04); }
          50%  { transform: translate3d(-1.5%, 1.5%, 0) rotate(-1.4deg) scale(1.08); }
          100% { transform: translate3d(0, -2%, 0) rotate(0deg) scale(1.04); }
        }
        @keyframes srWave {
          0%   { transform: skewY(0deg) skewX(0deg); }
          25%  { transform: skewY(-0.6deg) skewX(0.4deg); }
          50%  { transform: skewY(0.8deg) skewX(-0.5deg); }
          75%  { transform: skewY(-0.4deg) skewX(0.3deg); }
          100% { transform: skewY(0deg) skewX(0deg); }
        }
        @keyframes srShimmer {
          0%   { transform: translateX(-60%) skewX(-18deg); opacity: 0; }
          15%  { opacity: 0.55; }
          50%  { opacity: 0.55; }
          85%  { opacity: 0; }
          100% { transform: translateX(160%) skewX(-18deg); opacity: 0; }
        }
        @keyframes srHueShift {
          0%, 100% { filter: hue-rotate(0deg) saturate(1.02); }
          50%      { filter: hue-rotate(14deg) saturate(1.12); }
        }
        .sr-shell { will-change: transform; animation: srFlow 16s ease-in-out infinite; transform-origin: 60% 40%; }
        .sr-wave  { will-change: transform; animation: srWave 11s ease-in-out infinite; transform-origin: 50% 0%; }
        .sr-img   { will-change: filter; animation: srHueShift 14s ease-in-out infinite; display:block; }
        .sr-shimmer {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(110deg,
            transparent 35%,
            rgba(255,255,255,0.55) 50%,
            transparent 65%);
          mix-blend-mode: overlay;
          animation: srShimmer 7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sr-shell, .sr-wave, .sr-img, .sr-shimmer { animation: none !important; }
        }
      `}</style>

      <div
        className={`sr-shell absolute right-[-25%] top-[-20%] w-[140%] max-w-none opacity-95 sm:right-[-15%] sm:top-[-14%] sm:w-[115%] md:right-[-18%] md:top-[-10%] md:w-[105%] lg:right-[-20%] lg:top-[-8%] lg:w-[110%] xl:right-[-18%] xl:top-[-8%] xl:w-[100%] ${shellClassName}`}
        style={flipStyle}
      >
        <div className="sr-wave relative">
          <img
            src={ribbonAsset.url}
            alt=""
            className="sr-img h-auto w-full select-none"
            draggable={false}
          />
          <div className="sr-shimmer" />
        </div>
      </div>

      <div
        className={`absolute inset-y-0 left-0 w-[72%] sm:w-[58%] md:w-1/2 lg:w-[36%] ${fadeClassName}`}
        style={fadeStyle}
      />
    </div>
  );
}
