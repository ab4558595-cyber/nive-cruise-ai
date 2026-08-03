import auroraAsset from "@/assets/aurora-bg.jpg.asset.json";

/**
 * Full-bleed decorative aurora backdrop with a soft fade toward the content side.
 * Props are kept for backwards compatibility with existing call sites.
 */
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
  const flipStyle = side === "left" ? { transform: "scaleX(-1)" } : undefined;

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
      <div className={`absolute inset-0 ${shellClassName}`} style={flipStyle}>
        <img
          src={auroraAsset.url}
          alt=""
          className="block h-full w-full select-none object-cover opacity-70 dark:opacity-45"
          draggable={false}
        />
      </div>

      {/* Soft vignette so text stays legible on top of the gradient */}
      <div
        className={`absolute inset-0 ${fadeClassName}`}
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(10,10,16,0) 0%, rgba(10,10,16,0.35) 45%, rgba(10,10,16,0.75) 100%)",
        }}
      />
    </div>
  );
}
