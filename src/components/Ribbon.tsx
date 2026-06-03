/**
 * Flowing ribbon artwork — shared across pages.
 * Stripe-inspired multi-stop gradient flow, original geometry.
 *
 * Props let pages tune position/scale and which side fades to white so
 * foreground content stays readable.
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
    <div aria-hidden className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}>
      <svg
        className="absolute right-[-15%] top-[-20%] h-[160%] w-[110%] sm:right-[-5%] sm:w-[80%]"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMaxYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={flipStyle}
      >
        <defs>
          <linearGradient id="ribbon-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a4c8ff" />
            <stop offset="40%" stopColor="#d4b3ff" />
            <stop offset="100%" stopColor="#ff7eb6" />
          </linearGradient>
          <linearGradient id="ribbon-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffb86b" />
            <stop offset="50%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#ff3d8a" />
          </linearGradient>
          <linearGradient id="ribbon-c" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffd28d" />
            <stop offset="60%" stopColor="#ff8a5c" />
            <stop offset="100%" stopColor="#c4458f" />
          </linearGradient>
          <linearGradient id="ribbon-d" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe5b4" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ff9aa2" stopOpacity="0.9" />
          </linearGradient>
          <filter id="ribbon-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <path
          d="M 800 -50 C 600 60, 460 200, 520 380 C 580 560, 760 640, 820 820"
          stroke="url(#ribbon-d)"
          strokeWidth="220"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
          filter="url(#ribbon-blur)"
        />
        <path
          d="M 780 -40 C 540 80, 360 240, 480 460 C 600 680, 780 720, 880 900"
          stroke="url(#ribbon-a)"
          strokeWidth="130"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d="M 760 -20 C 500 100, 380 280, 520 480 C 640 660, 820 700, 900 880"
          stroke="url(#ribbon-b)"
          strokeWidth="80"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 740 0 C 500 120, 420 280, 540 470 C 650 640, 820 680, 880 860"
          stroke="url(#ribbon-c)"
          strokeWidth="32"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
        <path
          d="M 730 20 C 510 130, 430 290, 550 460 C 650 620, 810 660, 870 840"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />
      </svg>

      <div className="absolute inset-y-0 left-0 w-2/3" style={fadeStyle} />
    </div>
  );
}
