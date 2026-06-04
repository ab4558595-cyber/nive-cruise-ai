import { useId, useMemo } from "react";

/**
 * Stripe-style flowing ribbon: a wide diagonal brush-stroke composed of many
 * thin translucent filaments. Color flows blue → orange → pink → purple along
 * the sweep, with feathered ends.
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
  const uid = useId().replace(/:/g, "");
  const ids = {
    flow: `${uid}-flow`,
    feather: `${uid}-feather`,
    blurSoft: `${uid}-blur-soft`,
    blurHaze: `${uid}-blur-haze`,
  };

  // Base centerline: long diagonal sweep from upper-LEFT down to lower-RIGHT
  // (matches the Stripe reference image).
  const baseCurve = "M -60 -40 C 200 100, 460 260, 680 420 C 900 580, 1080 740, 1260 940";

  // Parallel filaments offset perpendicular to the sweep.
  const filaments = useMemo(() => {
    const list: { dx: number; dy: number; opacity: number; width: number }[] = [];
    const count = 110;
    const spread = 460; // total band thickness in SVG units
    // Perpendicular to (1,1) sweep direction is (-1,1) normalized
    const nx = -0.707;
    const ny = 0.707;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const off = (t - 0.5) * spread;
      const edge = Math.abs(t - 0.5) * 2;
      const opacity = 0.6 * Math.exp(-edge * edge * 2.0) + 0.04;
      const width = 1.0 + (1 - edge) * 1.6;
      list.push({ dx: off * nx, dy: off * ny, opacity, width });
    }
    return list;
  }, []);


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
        @keyframes srDrift { 0%, 100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-6px, -4px, 0); } }
        .sr-shell { will-change: transform; animation: srDrift 22s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .sr-shell { animation: none !important; } }
      `}</style>

      <div
        className={`sr-shell absolute right-[-30%] top-[-14%] w-[110%] max-w-[1280px] aspect-[1200/900] opacity-90 sm:right-[-18%] sm:top-[-10%] sm:w-[92%] sm:opacity-100 md:right-[-22%] md:top-[-8%] md:w-[80%] lg:right-[-24%] lg:top-[-6%] lg:w-[86%] xl:right-[-22%] xl:top-[-8%] xl:w-[80%] ${shellClassName}`}
        style={flipStyle}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 900"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Color flow along the ribbon (upper-left → lower-right):
                light blue/lilac → orange → hot pink → magenta → deep purple */}
            <linearGradient id={ids.flow} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cdd5ff" />
              <stop offset="10%" stopColor="#b9c2ff" />
              <stop offset="22%" stopColor="#e0a7c8" />
              <stop offset="34%" stopColor="#ffa86a" />
              <stop offset="46%" stopColor="#ff8a3d" />
              <stop offset="58%" stopColor="#ff5c6e" />
              <stop offset="72%" stopColor="#ff3d8a" />
              <stop offset="86%" stopColor="#d246c4" />
              <stop offset="100%" stopColor="#6a4cff" />
            </linearGradient>

            {/* Feather mask: fades ribbon out at both ends along the sweep */}
            <linearGradient id={ids.feather} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="14%" stopColor="white" stopOpacity="1" />
              <stop offset="86%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            <mask id={`${uid}-mask`}>
              <rect width="1200" height="900" fill={`url(#${ids.feather})`} />
            </mask>

            <filter id={ids.blurSoft} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
            <filter id={ids.blurHaze} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="38" />
            </filter>
          </defs>

          {/* Soft underlying haze for color bloom */}
          <path
            d={baseCurve}
            stroke={`url(#${ids.flow})`}
            strokeWidth="340"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
            filter={`url(#${ids.blurHaze})`}
            mask={`url(#${uid}-mask)`}
          />

          {/* Filament brush strokes */}
          <g mask={`url(#${uid}-mask)`} filter={`url(#${ids.blurSoft})`}>
            {filaments.map((f, i) => (
              <path
                key={i}
                d={baseCurve}
                transform={`translate(${f.dx} ${f.dy})`}
                stroke={`url(#${ids.flow})`}
                strokeWidth={f.width}
                strokeLinecap="round"
                fill="none"
                opacity={f.opacity}
              />
            ))}
          </g>
        </svg>
      </div>

      <div
        className={`absolute inset-y-0 left-0 w-[72%] sm:w-[58%] md:w-1/2 lg:w-[36%] ${fadeClassName}`}
        style={fadeStyle}
      />
    </div>
  );
}
