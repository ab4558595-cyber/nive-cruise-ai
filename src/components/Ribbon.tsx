import { useId } from "react";

export function Ribbon({
  side = "right",
  className = "",
}: {
  side?: "right" | "left";
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const ids = {
    cool: `${uid}-cool`,
    warm: `${uid}-warm`,
    hot: `${uid}-hot`,
    deep: `${uid}-deep`,
    sheen: `${uid}-sheen`,
    halo: `${uid}-halo`,
    mask: `${uid}-mask`,
    maskGradient: `${uid}-mask-gradient`,
    blurXl: `${uid}-blur-xl`,
    blurMd: `${uid}-blur-md`,
    blurSm: `${uid}-blur-sm`,
  };

  const flipStyle = side === "left" ? { transform: "scaleX(-1)" } : undefined;
  const fadeStyle =
    side === "left"
      ? {
          background:
            "linear-gradient(270deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.82) 26%, rgba(255,255,255,0.18) 52%, rgba(255,255,255,0) 72%)",
          right: 0,
          left: "auto",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.82) 26%, rgba(255,255,255,0.18) 52%, rgba(255,255,255,0) 72%)",
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
        @keyframes srDriftA { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(-8px, -10px, 0); } }
        @keyframes srDriftB { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(10px, 10px, 0); } }
        @keyframes srDriftC { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(-4px, 14px, 0); } }
        .sr-shell { will-change: transform; }
        .sr-a { animation: srDriftA 18s ease-in-out infinite; transform-origin: 72% 40%; }
        .sr-b { animation: srDriftB 22s ease-in-out infinite; transform-origin: 72% 40%; }
        .sr-c { animation: srDriftC 26s ease-in-out infinite; transform-origin: 72% 40%; }
        @media (prefers-reduced-motion: reduce) {
          .sr-a, .sr-b, .sr-c { animation: none !important; }
        }
      `}</style>

      <div
        className="sr-shell absolute right-[-38%] top-[-18%] w-[96%] max-w-[1040px] aspect-[960/820] opacity-[0.82] sm:right-[-20%] sm:top-[-12%] sm:w-[82%] sm:opacity-[0.9] md:right-[-12%] md:top-[-10%] md:w-[68%] md:opacity-100 lg:right-[-6%] lg:top-[-4%] lg:w-[76%] xl:right-[-4%] xl:top-[-6%] xl:w-[70%]"
        style={flipStyle}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 960 820"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={ids.cool} x1="0.2" y1="0.1" x2="0.78" y2="0.78">
              <stop offset="0%" stopColor="#d7dcff" />
              <stop offset="42%" stopColor="#9ab0ff" />
              <stop offset="100%" stopColor="#8f73ff" />
            </linearGradient>
            <linearGradient id={ids.warm} x1="0.15" y1="0.12" x2="0.78" y2="0.88">
              <stop offset="0%" stopColor="#ffe4b1" />
              <stop offset="34%" stopColor="#ffb267" />
              <stop offset="72%" stopColor="#ff6b72" />
              <stop offset="100%" stopColor="#ff4f92" />
            </linearGradient>
            <linearGradient id={ids.hot} x1="0.2" y1="0.08" x2="0.84" y2="0.92">
              <stop offset="0%" stopColor="#ffab7a" />
              <stop offset="44%" stopColor="#ff5f85" />
              <stop offset="100%" stopColor="#cb58ff" />
            </linearGradient>
            <linearGradient id={ids.deep} x1="0.18" y1="0.14" x2="0.82" y2="0.9">
              <stop offset="0%" stopColor="#d79bff" />
              <stop offset="50%" stopColor="#9f6fff" />
              <stop offset="100%" stopColor="#6a53e8" />
            </linearGradient>
            <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={ids.halo} cx="0.78" cy="0.4" r="0.72">
              <stop offset="0%" stopColor="#ffd1a8" stopOpacity="0.56" />
              <stop offset="34%" stopColor="#ff97a4" stopOpacity="0.34" />
              <stop offset="70%" stopColor="#b7abff" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={ids.maskGradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="10%" stopColor="white" stopOpacity="1" />
              <stop offset="88%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id={ids.mask}>
              <rect width="960" height="820" fill={`url(#${ids.maskGradient})`} />
            </mask>
            <filter id={ids.blurXl} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="44" />
            </filter>
            <filter id={ids.blurMd} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <filter id={ids.blurSm} x="-16%" y="-16%" width="132%" height="132%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          <ellipse
            className="sr-c"
            cx="742"
            cy="396"
            rx="344"
            ry="346"
            fill={`url(#${ids.halo})`}
            filter={`url(#${ids.blurXl})`}
          />

          <g mask={`url(#${ids.mask})`}>
            <path
              className="sr-b"
              d="M 1046 36 C 850 84, 652 176, 532 294 C 412 416, 374 584, 212 836"
              stroke={`url(#${ids.cool})`}
              strokeWidth="214"
              strokeLinecap="round"
              fill="none"
              opacity="0.92"
              filter={`url(#${ids.blurMd})`}
            />
            <path
              className="sr-a"
              d="M 1042 74 C 850 122, 656 218, 554 338 C 454 448, 420 604, 264 834"
              stroke={`url(#${ids.warm})`}
              strokeWidth="162"
              strokeLinecap="round"
              fill="none"
              opacity="0.98"
              filter={`url(#${ids.blurSm})`}
            />
            <path
              className="sr-a"
              d="M 1018 124 C 844 168, 694 252, 612 356 C 532 456, 504 596, 354 802"
              stroke={`url(#${ids.hot})`}
              strokeWidth="118"
              strokeLinecap="round"
              fill="none"
              opacity="0.94"
              filter={`url(#${ids.blurSm})`}
            />
            <path
              className="sr-c"
              d="M 994 178 C 842 218, 718 286, 648 372 C 576 462, 552 574, 430 756"
              stroke={`url(#${ids.deep})`}
              strokeWidth="86"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
              filter={`url(#${ids.blurSm})`}
            />
            <path
              className="sr-b"
              d="M 1002 98 C 834 140, 672 226, 586 326 C 500 430, 466 568, 336 802"
              stroke={`url(#${ids.sheen})`}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M 996 114 C 844 154, 690 234, 608 336 C 522 442, 490 572, 368 792"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          </g>
        </svg>
      </div>

      <div className="absolute inset-y-0 left-0 w-[76%] sm:w-[62%] md:w-1/2 lg:w-[38%]" style={fadeStyle} />
    </div>
  );
}
