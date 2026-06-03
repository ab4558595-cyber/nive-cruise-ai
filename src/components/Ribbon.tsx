/**
 * Stripe-style flowing ribbon.
 * Smooth filled bands with soft multi-stop gradients and gentle motion.
 * Pure SVG/CSS — works anywhere on a light background.
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
            "linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0) 100%)",
          right: 0,
          left: "auto",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0) 100%)",
        };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes ribbonDrift { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(0,-14px,0) rotate(-0.6deg); } }
        @keyframes ribbonDriftAlt { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(0,12px,0) rotate(0.5deg); } }
        @keyframes ribbonHue { 0%,100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(18deg); } }
        .ribbon-root { animation: ribbonHue 18s ease-in-out infinite; transform-origin: 70% 50%; }
        .ribbon-a { animation: ribbonDrift 16s ease-in-out infinite; transform-origin: 70% 50%; }
        .ribbon-b { animation: ribbonDriftAlt 19s ease-in-out infinite; transform-origin: 70% 50%; }
        @media (prefers-reduced-motion: reduce) {
          .ribbon-root, .ribbon-a, .ribbon-b { animation: none !important; }
        }
      `}</style>

      <svg
        className="ribbon-root absolute right-[-25%] top-[-15%] h-[140%] w-[120%] sm:right-[-10%] sm:w-[90%]"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={flipStyle}
      >
        <defs>
          {/* Stripe signature spectrum: cyan → mint → yellow → coral → magenta → violet */}
          <linearGradient id="r-spectrum" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5ee7df" />
            <stop offset="25%" stopColor="#a1f3a1" />
            <stop offset="50%" stopColor="#ffd56b" />
            <stop offset="75%" stopColor="#ff6b9a" />
            <stop offset="100%" stopColor="#7c5cff" />
          </linearGradient>

          {/* Cool secondary band: sky → indigo */}
          <linearGradient id="r-cool" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="60%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Warm overlay */}
          <linearGradient id="r-warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* Soft mask so the band fades at the ends */}
          <linearGradient id="r-mask" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="15%" stopColor="white" stopOpacity="1" />
            <stop offset="85%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="r-fade">
            <rect x="0" y="0" width="1000" height="1000" fill="url(#r-mask)" />
          </mask>

          <filter id="r-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        <g mask="url(#r-fade)" filter="url(#r-soft)">
          {/* Wide main band — filled, smooth, flowing diagonally */}
          <path
            className="ribbon-a"
            d="M 1100 -80
               C 720 120, 420 260, 460 480
               C 500 700, 820 780, 1120 980
               L 1180 900
               C 880 740, 580 680, 560 500
               C 540 320, 820 200, 1180 20
               Z"
            fill="url(#r-spectrum)"
            opacity="0.88"
          />

          {/* Cool band offset behind */}
          <path
            className="ribbon-b"
            d="M 1140 -40
               C 780 160, 500 320, 540 520
               C 580 720, 880 800, 1180 1000
               L 1220 940
               C 940 780, 660 720, 640 540
               C 620 360, 880 240, 1220 60
               Z"
            fill="url(#r-cool)"
            opacity="0.55"
          />

          {/* Warm slim ribbon weaving through */}
          <path
            className="ribbon-a"
            d="M 1080 0
               C 740 180, 480 320, 520 510
               C 560 700, 840 770, 1100 940
               L 1130 900
               C 880 740, 620 680, 600 520
               C 580 360, 820 240, 1140 70
               Z"
            fill="url(#r-warm)"
            opacity="0.45"
          />

          {/* Thin bright highlight stroke for sheen */}
          <path
            className="ribbon-b"
            d="M 1080 0 C 740 180, 480 320, 520 510 C 560 700, 840 770, 1100 940"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
            opacity="0.55"
          />
        </g>
      </svg>

      {/* Readability fade on the opposite side */}
      <div className="absolute inset-y-0 left-0 w-1/2" style={fadeStyle} />
    </div>
  );
}
