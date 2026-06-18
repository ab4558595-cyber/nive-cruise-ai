import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS } from "@/lib/plans";

type ActivePlan = { plan_id: string; expires_at: string } | null;

export function useCurrentPlan() {
  const [plan, setPlan] = useState<ActivePlan>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_plans")
        .select("plan_id, expires_at")
        .eq("user_id", auth.user.id)
        .eq("active", true)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setPlan(data ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plan, loading };
}

export function CurrentPlanBadge({ className = "" }: { className?: string }) {
  const { plan, loading } = useCurrentPlan();
  if (loading || !plan) return null;
  const meta = PLANS.find((p) => p.id === plan.plan_id);
  const name = meta?.name ?? plan.plan_id.replace("biz-", "");
  const expires = new Date(plan.expires_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <Link
      to="/business/usage"
      title={`Active until ${expires}`}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0a2540]/5 px-3 py-1.5 text-[12.5px] font-semibold text-[#0a2540] ring-1 ring-[#635bff]/20 transition-colors hover:bg-[#635bff]/10 ${className}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-[#635bff]" />
      <span className="text-[#697386]">Your plan:</span>
      <span className="capitalize">{name}</span>
    </Link>
  );
}
