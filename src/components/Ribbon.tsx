/**
 * Stripe-style flowing silk ribbon.
 * Built from overlapping curved stroke bands with vivid gradients +
 * soft blur, mimicking Stripe.com hero ribbon (blue → purple → magenta → orange).
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
            "linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 28%, rgba(255,255,255,0) 55%)",
          right: 0,
          left: "auto",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 28%, rgba(255,255,255,0) 55%)",
        };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes srFloatA { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-10px,-14px,0); } }
        @keyframes srFloatB { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(8px, 12px,0); } }
        @keyframes srFloatC { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-6px, 18px,0); } }
        @keyframes srHue    { 0%,100% { filter: hue-rotate(0deg) saturate(1); } 50% { filter: hue-rotate(12deg) saturate(1.08); } }
        .sr-root  { animation: srHue 20s ease-in-out infinite; will-change: filter; }
        .sr-a { animation: srFloatA 14s ease-in-out infinite; transform-origin: 70% 50%; }
        .sr-b { animation: srFloatB 18s ease-in-out infinite; transform-origin: 70% 50%; }
        .sr-c { animation: srFloatC 22s ease-in-out infinite; transform-origin: 70% 50%; }
        @media (prefers-reduced-motion: reduce) {
          .sr-root,.sr-a,.sr-b,.sr-c { animation: none !important; }
        }
      `}</style>

      <svg
        className="sr-root absolute right-[-55%] top-[-25%] h-[185%] w-[185%] sm:right-[-25%] sm:w-[135%] md:right-[-10%] md:w-[110%] lg:right-[-2%] lg:w-[92%]"
        viewBox="0 0 1200 1200"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={flipStyle}
      >
        <defs>
          {/* Cool top strand — lavender → periwinkle */}
          <linearGradient id="sr-g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#cdd6ff" />
            <stop offset="55%"  stopColor="#a4b1ff" />
            <stop offset="100%" stopColor="#b39bff" />
          </linearGradient>

          {/* Warm core strand — peach → orange → magenta */}
          <linearGradient id="sr-g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ffd29a" />
            <stop offset="35%"  stopColor="#ff9b54" />
            <stop offset="70%"  stopColor="#ff5a6f" />
            <stop offset="100%" stopColor="#ff3d8a" />
          </linearGradient>

          {/* Hot magenta strand */}
          <linearGradient id="sr-g3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ff7a5c" />
            <stop offset="50%"  stopColor="#ff3d8a" />
            <stop offset="100%" stopColor="#d24bff" />
          </linearGradient>

          {/* Deep purple bottom strand */}
          <linearGradient id="sr-g4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#d56bff" />
            <stop offset="60%"  stopColor="#9a5cff" />
            <stop offset="100%" stopColor="#6a48d9" />
          </linearGradient>

          {/* Bright sheen */}
          <linearGradient id="sr-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Diffuse halo wash */}
          <radialGradient id="sr-halo" cx="0.78" cy="0.42" r="0.65">
            <stop offset="0%"   stopColor="#ffb38a" stopOpacity="0.55" />
            <stop offset="45%"  stopColor="#ff8acf" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#b8a8ff" stopOpacity="0" />
          </radialGradient>

          {/* Fade ribbon ends */}
          <linearGradient id="sr-mask-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="10%"  stopColor="white" stopOpacity="1" />
            <stop offset="90%"  stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="sr-mask">
            <rect width="1200" height="1200" fill="url(#sr-mask-grad)" />
          </mask>

          <filter id="sr-blur-xl" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
          <filter id="sr-blur-md" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="sr-blur-sm" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Diffuse warm halo behind the ribbon */}
        <rect
          className="sr-c"
          x="100" y="-120" width="1300" height="1500"
          fill="url(#sr-halo)"
          filter="url(#sr-blur-xl)"
        />

        <g mask="url(#sr-mask)">
          {/* Strand 1 — wide blurred lavender (top of the ribbon) */}
          <path
            className="sr-b"
            d="M 1320 -40
               C 940  140, 560  300, 580  540
               C 600  780, 1000 960, 1340 1180"
            stroke="url(#sr-g1)"
            strokeWidth="220"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
            filter="url(#sr-blur-md)"
          />

          {/* Strand 2 — warm core (orange/peach/magenta) */}
          <path
            className="sr-a"
            d="M 1300 0
               C 900  180, 560  360, 600  580
               C 640  800, 980  960, 1320 1170"
            stroke="url(#sr-g2)"
            strokeWidth="180"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
            filter="url(#sr-blur-sm)"
          />

          {/* Strand 3 — hot magenta running below the core */}
          <path
            className="sr-a"
            d="M 1280 60
               C 880  230, 620  420, 660  620
               C 700  820, 970  960, 1290 1150"
            stroke="url(#sr-g3)"
            strokeWidth="140"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
            filter="url(#sr-blur-sm)"
          />

          {/* Strand 4 — deep purple at the bottom */}
          <path
            className="sr-c"
            d="M 1260 140
               C 880  310, 700  480, 740  650
               C 780  820, 990  960, 1270 1130"
            stroke="url(#sr-g4)"
            strokeWidth="110"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
            filter="url(#sr-blur-sm)"
          />

          {/* Bright sheen highlight across the front face */}
          <path
            className="sr-a"
            d="M 1270 20
               C 880  200, 540  380, 580  600
               C 620  820, 960  960, 1270 1160"
            stroke="url(#sr-sheen)"
            strokeWidth="10"
            fill="none"
            opacity="0.85"
          />

          {/* Hairline white core */}
          <path
            d="M 1250 50
               C 880  220, 560  400, 620  610
               C 680  820, 960  950, 1250 1140"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
        </g>
      </svg>

      {/* Readability fade on the opposite side */}
      <div className="absolute inset-y-0 left-0 w-1/2" style={fadeStyle} />
    </div>
  );
}
