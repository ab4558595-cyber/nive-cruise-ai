import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, X, Zap, Check } from "lucide-react";
import {
  purchaseBusinessTopup,
  TOPUP_PACKS,
  type ToolKey,
  type UsageSnapshot,
  type TopupPackId,
} from "@/lib/businessUsage.functions";

type Props = {
  tool: ToolKey;
  open: boolean;
  onClose: () => void;
  onSuccess: (usage: UsageSnapshot) => void;
};

export function TopupDialog({ tool, open, onClose, onSuccess }: Props) {
  const purchase = useServerFn(purchaseBusinessTopup);
  const [busy, setBusy] = useState<TopupPackId | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const packs = (Object.entries(TOPUP_PACKS) as [TopupPackId, (typeof TOPUP_PACKS)[TopupPackId]][])
    .filter(([, p]) => p.tool === tool);

  const buy = async (id: TopupPackId) => {
    setError(null);
    setBusy(id);
    try {
      const usage = await purchase({ data: { pack: id } });
      onSuccess(usage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a2540]/50 p-4">
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
        <h3 className="text-[20px] font-bold tracking-tight text-[#0a2540]">
          Top up {tool === "synthetic" ? "Synthetic Data" : "Marketing"} credits
        </h3>
        <p className="mt-1 text-[13.5px] text-[#697386]">
          Add extra runs for today. Credits unlock instantly and expire at midnight UTC.
        </p>

        <div className="mt-5 space-y-2.5">
          {packs.map(([id, p]) => (
            <button
              key={id}
              type="button"
              onClick={() => buy(id)}
              disabled={busy !== null}
              className="group flex w-full items-center justify-between rounded-lg border border-[#e3e8ee] bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#635bff] hover:shadow-[0_8px_24px_rgba(99,91,255,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div>
                <div className="text-[15px] font-semibold text-[#0a2540]">{p.label}</div>
                <div className="text-[12px] text-[#697386]">
                  {p.credits} more runs · today only
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-[#0a2540]">₹{p.amount_inr}</span>
                {busy === id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#635bff]" />
                ) : (
                  <Check className="h-4 w-4 text-[#635bff] opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-[#fff1f0] px-3 py-2 text-[12.5px] text-[#c0392b]">
            {error}
          </p>
        )}

        <p className="mt-4 text-[11.5px] leading-relaxed text-[#8898aa]">
          Demo billing: credits are granted immediately for testing. Production builds gate this
          behind UPI payment approval.
        </p>
      </div>
    </div>
  );
}
