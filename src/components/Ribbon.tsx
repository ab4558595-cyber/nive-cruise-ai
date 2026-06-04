import { useId } from "react";

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
    cool: `${uid}-cool`,
    warm: `${uid}-warm`,
    hot: `${uid}-hot`,
    deep: `${uid}-deep`,
    sheen: `${uid}-sheen`,
    halo: `${uid}-halo`,
    mask: `${uid}-mask`,
    maskGradient: `${uid}-mask-gradient`,
    ribbonClip: `${uid}-ribbon-clip`,
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
        @keyframes srDriftA { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(-5px, -7px, 0); } }
        @keyframes srDriftB { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(6px, 6px, 0); } }
        @keyframes srDriftC { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(-2px, 8px, 0); } }
        .sr-shell { will-change: transform; }
        .sr-a { animation: srDriftA 18s ease-in-out infinite; transform-origin: 72% 40%; }
        .sr-b { animation: srDriftB 22s ease-in-out infinite; transform-origin: 72% 40%; }
        .sr-c { animation: srDriftC 26s ease-in-out infinite; transform-origin: 72% 40%; }
        @media (prefers-reduced-motion: reduce) {
          .sr-a, .sr-b, .sr-c { animation: none !important; }
        }
      `}</style>

      <div
        className={`sr-shell absolute right-[-38%] top-[-18%] w-[96%] max-w-[1040px] aspect-[960/820] opacity-[0.82] sm:right-[-20%] sm:top-[-12%] sm:w-[82%] sm:opacity-[0.9] md:right-[-26%] md:top-[-10%] md:w-[68%] md:opacity-100 lg:right-[-30%] lg:top-[-5%] lg:w-[78%] xl:right-[-28%] xl:top-[-7%] xl:w-[72%] ${shellClassName}`}
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
            <clipPath id={ids.ribbonClip}>
              <path d="M 1052 42 C 856 92, 664 188, 544 308 C 426 426, 376 600, 224 836 L 394 836 C 524 644, 592 496, 690 398 C 790 300, 930 222, 1104 184 Z" />
            </clipPath>
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
              className="sr-c"
              d="M 1052 42 C 856 92, 664 188, 544 308 C 426 426, 376 600, 224 836 L 394 836 C 524 644, 592 496, 690 398 C 790 300, 930 222, 1104 184 Z"
              fill={`url(#${ids.cool})`}
              opacity="0.34"
              filter={`url(#${ids.blurXl})`}
            />
            <path
              className="sr-a"
              d="M 1046 62 C 852 112, 664 206, 548 322 C 432 438, 386 602, 250 836 L 408 836 C 522 660, 590 524, 684 426 C 784 322, 920 242, 1096 198 Z"
              fill={`url(#${ids.warm})`}
              opacity="0.98"
            />
            <path
              className="sr-b"
              d="M 1046 62 C 852 112, 664 206, 548 322 C 432 438, 386 602, 250 836"
              stroke={`url(#${ids.deep})`}
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
              filter={`url(#${ids.blurSm})`}
            />
            <path
              className="sr-b"
              d="M 1018 122 C 850 166, 702 246, 610 348 C 526 444, 478 562, 392 764"
              stroke={`url(#${ids.hot})`}
              strokeWidth="82"
              strokeLinecap="round"
              fill="none"
              opacity="0.22"
              filter={`url(#${ids.blurMd})`}
            />
            <path
              className="sr-b"
              d="M 1018 112 C 856 154, 714 230, 624 330 C 536 428, 488 550, 390 770"
              stroke={`url(#${ids.sheen})`}
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
              opacity="0.82"
            />
            <path
              d="M 1002 144 C 856 180, 740 242, 660 330 C 582 416, 540 524, 454 716"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.72"
            />
          </g>
        </svg>
      </div>

      <div className={`absolute inset-y-0 left-0 w-[76%] sm:w-[62%] md:w-1/2 lg:w-[38%] ${fadeClassName}`} style={fadeStyle} />
    </div>
  );
}
