import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { History, Zap } from "lucide-react";
import {
  getBusinessUsage,
  type ToolKey,
  type UsageSnapshot,
} from "@/lib/businessUsage.functions";
import { TopupDialog } from "./TopupDialog";

export function useUsage(tool: ToolKey) {
  const fetchUsage = useServerFn(getBusinessUsage);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const u = await fetchUsage({ data: { tool } });
      setUsage(u);
    } catch (e) {
      console.error("usage fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  return { usage, loading, refresh, setUsage };
}

type Props = {
  usage: UsageSnapshot | null;
  onTopupSuccess?: (usage: UsageSnapshot) => void;
};

export function UsageBadge({ usage, onTopupSuccess }: Props) {
  const [topupOpen, setTopupOpen] = useState(false);

  if (!usage) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#f6f9fc] px-3 py-1.5 text-[12px] font-medium text-[#425466] ring-1 ring-[#e3e8ee]">
        Loading credits…
      </span>
    );
  }

  const low = usage.remaining < usage.costPerRun * 5;
  const empty = usage.remaining < usage.costPerRun;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ${
          empty
            ? "bg-[#fff1f0] text-[#c8341c] ring-[#fad7d2]"
            : low
            ? "bg-[#fff8e6] text-[#8a6100] ring-[#f5e2a8]"
            : "bg-[#f6f9fc] text-[#425466] ring-[#e3e8ee]"
        }`}
        title={`This tool costs ${usage.costPerRun} credit${usage.costPerRun === 1 ? "" : "s"} per run. Credits are shared across every Nive tool and never expire.`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {usage.remaining.toLocaleString()} credits · {usage.costPerRun}/run
      </span>

      {(low || empty) && (
        <button
          type="button"
          onClick={() => setTopupOpen(true)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-all ${
            empty
              ? "bg-[#635bff] text-white shadow-[0_2px_6px_rgba(99,91,255,0.35)] hover:bg-[#5048d6]"
              : "bg-white text-[#635bff] ring-1 ring-[#635bff]/30 hover:bg-[#635bff]/5"
          }`}
        >
          <Zap className="h-3 w-3" />
          {empty ? "Out of credits — buy more" : "Top up"}
        </button>
      )}

      <Link
        to="/business/usage"
        title="View usage history"
        className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] text-[#697386] transition-colors hover:text-[#635bff]"
      >
        <History className="h-3.5 w-3.5" />
      </Link>

      <TopupDialog tool={usage.tool} open={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
}

