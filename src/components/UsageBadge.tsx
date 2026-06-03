import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getBusinessUsage, type ToolKey, type UsageSnapshot } from "@/lib/businessUsage.functions";

export function useUsage(tool: ToolKey) {
  const fetchUsage = useServerFn(getBusinessUsage);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const u = await fetchUsage({ data: { tool } });
      setUsage(u);
    } catch (e) {
      // soft-fail: don't block UI
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

export function UsageBadge({ usage }: { usage: UsageSnapshot | null }) {
  if (!usage) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#f6f9fc] px-3 py-1.5 text-[12px] font-medium text-[#425466] ring-1 ring-[#e3e8ee]">
        Loading credits…
      </span>
    );
  }
  const low = usage.remaining <= Math.max(1, Math.floor(usage.limit * 0.2));
  const empty = usage.remaining === 0;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ${
        empty
          ? "bg-[#fff1f0] text-[#c8341c] ring-[#fad7d2]"
          : low
          ? "bg-[#fff8e6] text-[#8a6100] ring-[#f5e2a8]"
          : "bg-[#f6f9fc] text-[#425466] ring-[#e3e8ee]"
      }`}
      title={`Resets at ${new Date(usage.resetsAtUtc).toLocaleString()} (UTC midnight)`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {usage.remaining}/{usage.limit} {usage.tool === "synthetic" ? "synthetic" : "marketing"} runs left today
    </span>
  );
}
