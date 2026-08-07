import { Link } from "@tanstack/react-router";
import { X, Zap, ArrowRight } from "lucide-react";
import { CREDIT_PACKS } from "@/lib/plans";
import type { ToolKey } from "@/lib/businessUsage.functions";

type Props = {
  tool: ToolKey;
  open: boolean;
  onClose: () => void;
};

export function TopupDialog({ tool, open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a2540]/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-[#697386] hover:bg-[#f6f9fc] hover:text-[#0a2540]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#635bff]/10 text-[#635bff]">
          <Zap className="h-4 w-4" />
        </div>
        <h3 className="text-[20px] font-bold tracking-tight text-[#0a2540]">Buy more credits</h3>
        <p className="mt-1 text-[13.5px] text-[#697386]">
          One wallet powers every Nive tool, including{" "}
          {tool === "synthetic" ? "Synthetic Data" : "Marketing"}. Credit packs never expire.
        </p>

        <div className="mt-5 space-y-2.5">
          {CREDIT_PACKS.map((p) => (
            <Link
              key={p.id}
              to="/checkout/$planId"
              params={{ planId: p.id }}
              className="group flex w-full items-center justify-between rounded-lg border border-[#e3e8ee] bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-[0_8px_24px_rgba(99,91,255,0.12)]"
            >
              <div>
                <div className="text-[15px] font-semibold text-[#0a2540]">{p.name}</div>
                <div className="text-[12px] text-[#697386]">{p.tagline} · never expires</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-[#0a2540]">₹{p.price}</span>
                <ArrowRight className="h-4 w-4 text-[#635bff] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/pricing"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#635bff] hover:underline"
        >
          Compare monthly plans <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
