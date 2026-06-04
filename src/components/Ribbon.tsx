import ribbonAsset from "@/assets/ribbon.png.asset.json";

/**
 * Stripe-style flowing ribbon, rendered from a high-fidelity PNG.
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
        @keyframes srFloat {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
          25%  { transform: translate3d(-10px, 8px, 0) rotate(-1.2deg) scale(1.015); }
          50%  { transform: translate3d(6px, -10px, 0) rotate(0.8deg) scale(1.03); }
          75%  { transform: translate3d(-4px, 4px, 0) rotate(-0.4deg) scale(1.01); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
        }
        @keyframes srHueShift {
          0%, 100% { filter: hue-rotate(0deg) saturate(1); }
          50%      { filter: hue-rotate(12deg) saturate(1.08); }
        }
        .sr-shell { will-change: transform; animation: srFloat 18s ease-in-out infinite; transform-origin: 60% 40%; }
        .sr-img   { will-change: filter; animation: srHueShift 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sr-shell, .sr-img { animation: none !important; }
        }
      `}</style>

      <div
        className={`sr-shell absolute right-[-20%] top-[-14%] w-[110%] max-w-[1280px] opacity-95 sm:right-[-10%] sm:top-[-10%] sm:w-[88%] md:right-[-12%] md:top-[-8%] md:w-[78%] lg:right-[-14%] lg:top-[-6%] lg:w-[82%] xl:right-[-12%] xl:top-[-8%] xl:w-[78%] ${shellClassName}`}
        style={flipStyle}
      >
        <img
          src={ribbonAsset.url}
          alt=""
          className="sr-img h-auto w-full select-none"
          draggable={false}
        />

      </div>

      <div
        className={`absolute inset-y-0 left-0 w-[72%] sm:w-[58%] md:w-1/2 lg:w-[36%] ${fadeClassName}`}
        style={fadeStyle}
      />
    </div>
  );
}
