import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment successful — Razorpay trusted business" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { plan } = Route.useSearch();
  const [state, setState] = useState<"syncing" | "active" | "timeout">("syncing");
  const [activePlan, setActivePlan] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;
    const interval = 2000;

    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts++;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            await new Promise((r) => setTimeout(r, interval));
            continue;
          }
          const { data } = await supabase
            .from("user_plans")
            .select("plan_id, active, expires_at")
            .eq("user_id", user.id)
            .eq("active", true)
            .maybeSingle();

          if (data && data.plan_id && data.plan_id !== "trial") {
            const matches = !plan || data.plan_id === plan;
            if (matches) {
              if (!cancelled) {
                setActivePlan(data.plan_id);
                setState("active");
              }
              return;
            }
          }
        } catch (e) {
          console.error("plan poll error", e);
        }
        await new Promise((r) => setTimeout(r, interval));
      }
      if (!cancelled) setState("timeout");
    };

    poll();
    return () => { cancelled = true; };
  }, [plan]);

  return (
    <div className="min-h-screen bg-[#f6f9fc]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <main className="mx-auto max-w-[520px] px-6 pt-24">
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_15px_50px_rgba(50,50,93,0.1)] ring-1 ring-[#e3e8ee]">
          {state === "syncing" && (
            <>
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#635bff]/10">
                <Loader2 className="h-7 w-7 animate-spin text-[#635bff]" />
              </div>
              <h1 className="mt-4 text-[26px] font-bold tracking-tight text-[#0a2540]">Confirming your payment…</h1>
              <p className="mt-2 text-[14px] text-[#697386]">
                We're activating your plan. This usually takes a few seconds.
              </p>
            </>
          )}

          {state === "active" && (
            <>
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#635bff]/10">
                <CheckCircle2 className="h-7 w-7 text-[#635bff]" />
              </div>
              <h1 className="mt-4 text-[26px] font-bold tracking-tight text-[#0a2540]">You're in!</h1>
              <p className="mt-2 text-[14px] text-[#697386]">
                Your <span className="font-semibold capitalize">{activePlan?.replace("biz-", "")}</span> plan is active. A receipt has been emailed to you.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link to="/" className="rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white hover:bg-[#5048d6]">
                  Start building
                </Link>
                <Link to="/business" className="rounded-md border border-[#e0e6eb] py-2.5 text-[14px] font-semibold text-[#0a2540] hover:border-[#cfd7df]">
                  Open Business suite
                </Link>
              </div>
            </>
          )}

          {state === "timeout" && (
            <>
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1f0]">
                <AlertCircle className="h-7 w-7 text-[#c0392b]" />
              </div>
              <h1 className="mt-4 text-[22px] font-bold tracking-tight text-[#0a2540]">Still syncing…</h1>
              <p className="mt-2 text-[14px] text-[#697386]">
                Your payment was received but activation is taking longer than usual.
                Refresh in a moment or contact support if it doesn't appear.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white hover:bg-[#5048d6]"
                >
                  Check again
                </button>
                <Link to="/business" className="rounded-md border border-[#e0e6eb] py-2.5 text-[14px] font-semibold text-[#0a2540] hover:border-[#cfd7df]">
                  Open Business suite
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
