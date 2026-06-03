/**
 * Flowing ribbon artwork — shared across public pages.
 * Stripe-inspired flow with vibrant multi-stop gradients + subtle
 * CSS-driven motion (slow float + hue rotation). Pure SVG/CSS — no JS.
 */
export function Ribbon({
  side = "right",
  className = "",
}: {
  side?: "right" | "left";
  className?: string;
}) {
  const flipStyle = side === "left" ? { transform: "scaleX(-1)" } : undefined;
  const fadeStyle =
    side === "left"
      ? {
          background:
            "linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.92) 45%, rgba(255,255,255,0) 100%)",
          right: 0,
          left: "auto",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.92) 45%, rgba(255,255,255,0) 100%)",
        };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Scoped keyframes so the ribbon animates anywhere it's dropped */}
      <style>{`
        @keyframes ribbonHue { 0%,100% { filter: hue-rotate(0deg) saturate(1.15); } 50% { filter: hue-rotate(35deg) saturate(1.35); } }
        @keyframes ribbonFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-22px) rotate(-1.2deg); } }
        @keyframes ribbonFloatSlow { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(16px) rotate(0.8deg); } }
        @keyframes ribbonPulse { 0%,100% { opacity: .55; } 50% { opacity: .85; } }
        .ribbon-anim { animation: ribbonHue 14s ease-in-out infinite; transform-origin: 70% 50%; }
        .ribbon-layer-a { animation: ribbonFloat 11s ease-in-out infinite; transform-origin: 70% 50%; }
        .ribbon-layer-b { animation: ribbonFloatSlow 13s ease-in-out infinite; transform-origin: 70% 50%; }
        .ribbon-wash { animation: ribbonPulse 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ribbon-anim, .ribbon-layer-a, .ribbon-layer-b, .ribbon-wash { animation: none !important; }
        }
      `}</style>

      <svg
        className="ribbon-anim absolute right-[-15%] top-[-20%] h-[160%] w-[110%] sm:right-[-5%] sm:w-[80%]"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMaxYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={flipStyle}
      >
        <defs>
          {/* Vibrant cool ribbon: electric blue → violet → magenta */}
          <linearGradient id="ribbon-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="35%" stopColor="#8b5cf6" />
            <stop offset="70%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          {/* Vibrant warm ribbon: gold → tangerine → hot pink */}
          <linearGradient id="ribbon-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="40%" stopColor="#fb923c" />
            <stop offset="75%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          {/* Inner highlight: cream → coral → magenta */}
          <linearGradient id="ribbon-c" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#a21caf" />
          </linearGradient>
          {/* Soft outer wash — peach/rose halo */}
          <linearGradient id="ribbon-d" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.9" />
          </linearGradient>
          {/* Accent emerald → teal sliver for extra vibrancy */}
          <linearGradient id="ribbon-e" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="ribbon-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Soft outer wash */}
        <path
          className="ribbon-wash"
          d="M 800 -50 C 600 60, 460 200, 520 380 C 580 560, 760 640, 820 820"
          stroke="url(#ribbon-d)"
          strokeWidth="240"
          strokeLinecap="round"
          fill="none"
          filter="url(#ribbon-blur)"
        />

        {/* Cool blue→violet→magenta ribbon */}
        <path
          className="ribbon-layer-a"
          d="M 780 -40 C 540 80, 360 240, 480 460 C 600 680, 780 720, 880 900"
          stroke="url(#ribbon-a)"
          strokeWidth="140"
          strokeLinecap="round"
          fill="none"
          opacity="0.92"
        />

        {/* Warm tangerine→pink signature stroke */}
        <path
          className="ribbon-layer-b"
          d="M 760 -20 C 500 100, 380 280, 520 480 C 640 660, 820 700, 900 880"
          stroke="url(#ribbon-b)"
          strokeWidth="90"
          strokeLinecap="round"
          fill="none"
        />

        {/* Emerald/teal accent sliver */}
        <path
          className="ribbon-layer-a"
          d="M 720 40 C 520 150, 460 300, 560 450 C 660 600, 800 650, 860 820"
          stroke="url(#ribbon-e)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />

        {/* Inner highlight */}
        <path
          className="ribbon-layer-b"
          d="M 740 0 C 500 120, 420 280, 540 470 C 650 640, 820 680, 880 860"
          stroke="url(#ribbon-c)"
          strokeWidth="34"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />

        {/* Thin white core for sheen */}
        <path
          d="M 730 20 C 510 130, 430 290, 550 460 C 650 620, 810 660, 870 840"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
      </svg>

      {/* Fade on the opposite side so text stays readable */}
      <div className="absolute inset-y-0 left-0 w-2/3" style={fadeStyle} />
    </div>
  );
}
