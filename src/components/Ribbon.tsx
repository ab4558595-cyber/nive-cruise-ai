/**
 * Stripe-style flowing ribbon.
 * Soft pastel spectrum, folded-ribbon look with light/shadow sides.
 * Pure SVG/CSS, responsive across breakpoints, on white backgrounds.
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
            "linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0) 100%)",
          right: 0,
          left: "auto",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0) 100%)",
        };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes ribbonDrift   { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-10px,0); } }
        @keyframes ribbonDriftB  { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0, 8px,0); } }
        @keyframes ribbonHueShift{ 0%,100% { filter: hue-rotate(0deg); }     50% { filter: hue-rotate(10deg); } }
        .stripe-ribbon       { animation: ribbonHueShift 22s ease-in-out infinite; transform-origin: 70% 50%; will-change: transform, filter; }
        .stripe-ribbon-a     { animation: ribbonDrift    18s ease-in-out infinite; transform-origin: 70% 50%; }
        .stripe-ribbon-b     { animation: ribbonDriftB   21s ease-in-out infinite; transform-origin: 70% 50%; }
        @media (prefers-reduced-motion: reduce) {
          .stripe-ribbon, .stripe-ribbon-a, .stripe-ribbon-b { animation: none !important; }
        }
      `}</style>

      <svg
        className="stripe-ribbon absolute right-[-40%] top-[-25%] h-[170%] w-[160%] sm:right-[-20%] sm:w-[110%] md:right-[-10%] md:w-[95%] lg:right-[-5%] lg:w-[80%]"
        viewBox="0 0 1200 1200"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={flipStyle}
      >
        <defs>
          {/* Stripe spectrum — soft pastel, top→bottom cyan → mint → lemon → peach → pink → lilac */}
          <linearGradient id="sr-spectrum" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%"   stopColor="#a0e9ff" />
            <stop offset="22%"  stopColor="#b9f3d6" />
            <stop offset="42%"  stopColor="#fff2a8" />
            <stop offset="62%"  stopColor="#ffc7a8" />
            <stop offset="82%"  stopColor="#ff9ec7" />
            <stop offset="100%" stopColor="#c7a8ff" />
          </linearGradient>

          {/* Shadow side of the fold — desaturated, slightly darker */}
          <linearGradient id="sr-shadow" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%"   stopColor="#7ec9e0" />
            <stop offset="35%"  stopColor="#a3d4b9" />
            <stop offset="65%"  stopColor="#e8a78a" />
            <stop offset="100%" stopColor="#a98ad6" />
          </linearGradient>

          {/* Soft halo wash */}
          <linearGradient id="sr-wash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#cbeeff" stopOpacity="0.9" />
            <stop offset="50%"  stopColor="#ffe1cc" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e6d5ff" stopOpacity="0.9" />
          </linearGradient>

          {/* Highlight line on the front face */}
          <linearGradient id="sr-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Fade ribbon ends so it doesn't slam into edges */}
          <linearGradient id="sr-mask-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="14%"  stopColor="white" stopOpacity="1" />
            <stop offset="86%"  stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="sr-mask">
            <rect width="1200" height="1200" fill="url(#sr-mask-grad)" />
          </mask>

          <filter id="sr-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* Big soft halo behind everything (the diffuse Stripe glow) */}
        <path
          className="stripe-ribbon-b"
          d="M 1300 -100
             C 900   140, 520  320, 560  560
             C 600   800, 980  920, 1320 1180
             L 1380 1100
             C 1080  900, 720  780, 700  580
             C 680   380, 1000 220, 1380 0
             Z"
          fill="url(#sr-wash)"
          filter="url(#sr-soft)"
          opacity="0.85"
        />

        <g mask="url(#sr-mask)">
          {/* Shadow side — drawn first, slightly offset, gives the fold depth */}
          <path
            className="stripe-ribbon-a"
            d="M 1260 -60
               C 880  160, 540  340, 580  560
               C 620  780, 960  900, 1280 1140
               L 1320 1080
               C 1020 880, 700  760, 680  580
               C 660  400, 980  240, 1320 40
               Z"
            fill="url(#sr-shadow)"
            opacity="0.55"
          />

          {/* Front face — the bright spectrum ribbon */}
          <path
            className="stripe-ribbon-a"
            d="M 1240 -40
               C 860  180, 520  360, 560  580
               C 600  800, 940  920, 1260 1160
               L 1290 1110
               C 1000 900, 690  780, 670  600
               C 650  420, 970  260, 1300 60
               Z"
            fill="url(#sr-spectrum)"
            opacity="0.95"
          />

          {/* Folded twist near the bend — slim slice to suggest the ribbon turning */}
          <path
            className="stripe-ribbon-b"
            d="M 620 540
               C 700 470, 820 440, 940 460
               C 1020 475, 1080 510, 1100 560
               C 1020 540, 920 540, 820 570
               C 720 600, 660 600, 620 580 Z"
            fill="url(#sr-shadow)"
            opacity="0.45"
          />

          {/* Bright sheen along the front face */}
          <path
            className="stripe-ribbon-a"
            d="M 1230 -20
               C 870  200, 540  370, 580  590
               C 620  810, 940  920, 1250 1140"
            stroke="url(#sr-sheen)"
            strokeWidth="6"
            fill="none"
            opacity="0.7"
          />

          {/* Hairline white core sparkle */}
          <path
            d="M 1220 0
               C 880  210, 560  380, 600  590
               C 640  800, 940  910, 1240 1120"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
            opacity="0.55"
          />
        </g>
      </svg>

      {/* Readability fade on the opposite side, so text stays clean */}
      <div className="absolute inset-y-0 left-0 w-1/2" style={fadeStyle} />
    </div>
  );
}
