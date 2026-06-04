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
              opacity="0.9"
              filter={`url(#${ids.blurMd})`}
            />
            <g clipPath={`url(#${ids.ribbonClip})`}>
              <path
                className="sr-a"
                d="M 1044 80 C 848 128, 666 220, 558 330 C 454 438, 408 588, 282 828 L 446 828 C 552 642, 612 518, 700 420 C 792 318, 926 240, 1088 204 Z"
                fill={`url(#${ids.warm})`}
                opacity="0.98"
              />
              <path
                className="sr-b"
                d="M 1030 126 C 844 170, 686 248, 592 346 C 500 442, 462 574, 366 790 L 514 790 C 594 632, 640 528, 718 444 C 800 356, 914 288, 1042 256 Z"
                fill={`url(#${ids.hot})`}
                opacity="0.93"
              />
              <path
                className="sr-c"
                d="M 1012 172 C 838 214, 702 278, 626 362 C 550 448, 520 554, 446 754 L 576 754 C 638 620, 676 534, 738 464 C 806 390, 900 334, 1004 306 Z"
                fill={`url(#${ids.deep})`}
                opacity="0.88"
              />
              <path
                className="sr-b"
                d="M 1018 110 C 856 150, 714 226, 622 326 C 530 424, 484 548, 382 770"
                stroke={`url(#${ids.sheen})`}
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                opacity="0.88"
              />
              <path
                d="M 1002 138 C 850 174, 726 242, 648 330 C 568 418, 528 528, 436 734"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.74"
              />
            </g>
          </g>
        </svg>
      </div>

      <div className={`absolute inset-y-0 left-0 w-[76%] sm:w-[62%] md:w-1/2 lg:w-[38%] ${fadeClassName}`} style={fadeStyle} />
    </div>
  );
}
