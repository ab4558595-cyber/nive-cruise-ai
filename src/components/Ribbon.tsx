import ribbonAsset from "@/assets/ribbon.png.asset.json";

/**
 * Ribbon with stripes flowing continuously from bottom to top.
 * Two stacked copies translate upward seamlessly for an infinite loop.
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
        @keyframes srFlowUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes srShimmer {
          0%   { transform: translateY(110%); opacity: 0; }
          15%  { opacity: 0.5; }
          85%  { opacity: 0.5; }
          100% { transform: translateY(-110%); opacity: 0; }
        }
        .sr-track {
          will-change: transform;
          animation: srFlowUp 18s linear infinite;
        }
        .sr-shimmer {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(0deg,
            transparent 35%,
            rgba(255,255,255,0.55) 50%,
            transparent 65%);
          mix-blend-mode: overlay;
          animation: srShimmer 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sr-track, .sr-shimmer { animation: none !important; }
        }
      `}</style>

      <div
        className={`absolute right-[-25%] top-0 h-full w-[140%] max-w-none opacity-95 sm:right-[-15%] sm:w-[115%] md:right-[-18%] md:w-[105%] lg:right-[-20%] lg:w-[110%] xl:right-[-18%] xl:w-[100%] overflow-hidden ${shellClassName}`}
        style={flipStyle}
      >
        <div className="sr-track absolute inset-x-0 top-0 flex flex-col">
          <img
            src={ribbonAsset.url}
            alt=""
            className="block h-auto w-full select-none"
            draggable={false}
          />
          <img
            src={ribbonAsset.url}
            alt=""
            className="block h-auto w-full select-none"
            draggable={false}
          />
        </div>
        <div className="sr-shimmer" />
      </div>

      <div
        className={`absolute inset-y-0 left-0 w-[72%] sm:w-[58%] md:w-1/2 lg:w-[36%] ${fadeClassName}`}
        style={fadeStyle}
      />
    </div>
  );
}
