/**
 * Stripe-style flowing ribbon — vibrant, saturated, animated.
 * Bright orange → magenta → purple → blue spectrum like Stripe.com hero.
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
            "linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0) 60%)",
          right: 0,
          left: "auto",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0) 60%)",
        };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes srDriftA  { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(-18px,-14px,0) rotate(-1.2deg); } }
        @keyframes srDriftB  { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(14px, 16px,0) rotate(1.4deg); } }
        @keyframes srDriftC  { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-22px,0); } }
        @keyframes srHue     { 0%,100% { filter: hue-rotate(0deg) saturate(1); } 50% { filter: hue-rotate(14deg) saturate(1.08); } }
        .sr-root  { animation: srHue 18s ease-in-out infinite; transform-origin: 70% 50%; will-change: filter; }
        .sr-band-a{ animation: srDriftA 16s ease-in-out infinite; transform-origin: 70% 50%; }
        .sr-band-b{ animation: srDriftB 19s ease-in-out infinite; transform-origin: 70% 50%; }
        .sr-band-c{ animation: srDriftC 22s ease-in-out infinite; transform-origin: 70% 50%; }
        @media (prefers-reduced-motion: reduce) {
          .sr-root,.sr-band-a,.sr-band-b,.sr-band-c { animation: none !important; }
        }
      `}</style>

      <svg
        className="sr-root absolute right-[-50%] top-[-20%] h-[180%] w-[180%] sm:right-[-25%] sm:w-[130%] md:right-[-12%] md:w-[105%] lg:right-[-4%] lg:w-[88%]"
        viewBox="0 0 1200 1200"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={flipStyle}
      >
        <defs>
          {/* Main vibrant Stripe spectrum: blue → purple → magenta → orange */}
          <linearGradient id="sr-main" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%"   stopColor="#b8c6ff" />
            <stop offset="18%"  stopColor="#8a9cff" />
            <stop offset="35%"  stopColor="#c084fc" />
            <stop offset="52%"  stopColor="#ff5fb0" />
            <stop offset="70%"  stopColor="#ff6a3d" />
            <stop offset="88%"  stopColor="#ff9248" />
            <stop offset="100%" stopColor="#ffb86b" />
          </linearGradient>

          {/* Hot orange-magenta band */}
          <linearGradient id="sr-hot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ffb347" />
            <stop offset="40%"  stopColor="#ff6b35" />
            <stop offset="75%"  stopColor="#ff3d8a" />
            <stop offset="100%" stopColor="#b94dff" />
          </linearGradient>

          {/* Cool blue-purple band that weaves under */}
          <linearGradient id="sr-cool" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#a5b8ff" />
            <stop offset="55%"  stopColor="#8a7cff" />
            <stop offset="100%" stopColor="#d76bff" />
          </linearGradient>

          {/* Diffuse halo behind */}
          <radialGradient id="sr-halo" cx="0.75" cy="0.45" r="0.7">
            <stop offset="0%"   stopColor="#ffb38a" stopOpacity="0.55" />
            <stop offset="45%"  stopColor="#ff8acf" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#b8a8ff" stopOpacity="0" />
          </radialGradient>

          {/* Soft sheen highlight */}
          <linearGradient id="sr-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Fade ribbon ends */}
          <linearGradient id="sr-mask-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="12%"  stopColor="white" stopOpacity="1" />
            <stop offset="88%"  stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="sr-mask">
            <rect width="1200" height="1200" fill="url(#sr-mask-grad)" />
          </mask>

          <filter id="sr-blur-lg" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="32" />
          </filter>
          <filter id="sr-blur-sm" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Diffuse warm halo */}
        <rect
          className="sr-band-c"
          x="200" y="-100" width="1200" height="1400"
          fill="url(#sr-halo)"
          filter="url(#sr-blur-lg)"
        />

        <g mask="url(#sr-mask)">
          {/* Cool blue-purple back band */}
          <path
            className="sr-band-b"
            d="M 1320 -80
               C 820  140, 420  340, 520  600
               C 620  860, 1020 1000, 1360 1240
               L 1420 1160
               C 1080  920, 720  800, 700  600
               C 680   400, 1020  220, 1420 -20
               Z"
            fill="url(#sr-cool)"
            opacity="0.85"
            filter="url(#sr-blur-sm)"
          />

          {/* Main vivid ribbon — the bright spectrum */}
          <path
            className="sr-band-a"
            d="M 1280 -60
               C 800  180, 440  380, 560  620
               C 680  860, 1000 980, 1320 1200
               L 1370 1130
               C 1060  900, 740  790, 720  610
               C 700   430, 1020  260, 1370  20
               Z"
            fill="url(#sr-main)"
            opacity="0.95"
          />

          {/* Hot orange-magenta overlay weaving through */}
          <path
            className="sr-band-a"
            d="M 1260 40
               C 880  220, 600  420, 660  640
               C 720  860, 980  960, 1280 1140
               L 1310 1080
               C 1040  880, 800  790, 780  640
               C 760   490, 1000  340, 1300 120
               Z"
            fill="url(#sr-hot)"
            opacity="0.78"
          />

          {/* Bright sheen along the front face */}
          <path
            className="sr-band-a"
            d="M 1250 -20
               C 860  200, 520  390, 580  610
               C 640  830, 960  950, 1260 1160"
            stroke="url(#sr-sheen)"
            strokeWidth="8"
            fill="none"
            opacity="0.8"
          />

          {/* Hairline white core */}
          <path
            d="M 1230 10
               C 880  220, 560  400, 620  610
               C 680  820, 960  940, 1240 1130"
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
