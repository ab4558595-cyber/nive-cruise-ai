import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUSINESS_PLAN_IDS = ["biz-growth", "biz-scale"];

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "Payment successful — Nive AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "timeout">("checking");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // ~40s

    const poll = async () => {
      if (cancelled) return;
      attempts++;

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        if (attempts >= MAX_ATTEMPTS) setState("timeout");
        else setTimeout(poll, 2000);
        return;
      }

      const { data: plan } = await supabase
        .from("user_plans")
        .select("plan_id, expires_at, active")
        .eq("user_id", uid)
        .eq("active", true)
        .gte("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (plan && BUSINESS_PLAN_IDS.includes(plan.plan_id)) {
        setState("ready");
        setTimeout(() => {
          if (!cancelled) navigate({ to: "/business", replace: true });
        }, 800);
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        setState("timeout");
      } else {
        setTimeout(poll, 2000);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <CheckCircle2 className="h-14 w-14 text-[#635bff]" />
      <h1 className="mt-6 text-3xl font-bold text-[#0a2540]">Payment successful</h1>

      {state === "checking" && (
        <p className="mt-3 flex max-w-md items-center justify-center gap-2 text-[15px] text-[#425466]">
          <Loader2 className="h-4 w-4 animate-spin text-[#635bff]" />
          Activating your plan…
        </p>
      )}

      {state === "ready" && (
        <p className="mt-3 max-w-md text-[15px] text-[#425466]">
          Your Business plan is active. Redirecting you to the dashboard…
        </p>
      )}

      {state === "timeout" && (
        <p className="mt-3 max-w-md text-[15px] text-[#425466]">
          Your subscription is still being activated. This usually takes a few seconds — try refreshing
          the Business dashboard.
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="rounded-md border border-[#e0e6eb] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0a2540] hover:border-[#cfd7df]"
        >
          Back to chat
        </Link>
        <Link
          to="/business"
          className="rounded-md bg-[#635bff] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5048d6]"
        >
          Go to Business
        </Link>
      </div>
    </div>
  );
}
