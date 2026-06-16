import ribbonAsset from "@/assets/ribbon.png.asset.json";

/**
 * Static decorative ribbon image with a content-side fade overlay.
 */
export function Ribbon({
  side = "right",
  className = "",
  shellClassName = "",
  fadeClassName = "",
  theme = "light",
}: {
  side?: "right" | "left";
  className?: string;
  shellClassName?: string;
  fadeClassName?: string;
  theme?: "light" | "dark";
}) {
  const flipStyle = side === "left" ? { transform: "scaleX(-1)" } : undefined;
  const fadeColor = theme === "dark" ? "10,10,11" : "255,255,255";
  const fadeStyle =
    side === "left"
      ? {
          background:
            `linear-gradient(270deg, rgba(${fadeColor},0.98) 0%, rgba(${fadeColor},0.78) 28%, rgba(${fadeColor},0.18) 56%, rgba(${fadeColor},0) 78%)`,
          right: 0,
          left: "auto",
        }
      : {
          background:
            `linear-gradient(90deg, rgba(${fadeColor},0.98) 0%, rgba(${fadeColor},0.78) 28%, rgba(${fadeColor},0.18) 56%, rgba(${fadeColor},0) 78%)`,
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
      <div
        className={`absolute right-[-25%] top-0 h-full w-[140%] max-w-none sm:right-[-15%] sm:w-[115%] md:right-[-18%] md:w-[105%] lg:right-[-20%] lg:w-[110%] xl:right-[-18%] xl:w-[100%] ${shellClassName}`}
        style={flipStyle}
      >
        <img
          src={ribbonAsset.url}
          alt=""
          className="block h-full w-full object-cover select-none"
          draggable={false}
        />
      </div>

      <div
        className={`absolute inset-y-0 left-0 w-[72%] sm:w-[58%] md:w-1/2 lg:w-[36%] ${fadeClassName}`}
        style={fadeStyle}
      />
    </div>
  );
}
