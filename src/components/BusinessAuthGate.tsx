import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, Sparkles } from "lucide-react";

const BUSINESS_PLAN_IDS = ["biz-growth", "biz-scale"];

type Status = "checking" | "ready" | "no-plan";

/**
 * Auth + plan gate for /business/* pages.
 * - Unauthenticated → redirect to /auth.
 * - Authenticated but not on a Business plan → inline upgrade CTA.
 * - Admins always pass.
 */
export function BusinessAuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    const rawPath = `${location.pathname}${location.searchStr || ""}`;
    // Never redirect back to /auth itself — prevents nested redirect loops.
    const fullPath = location.pathname.startsWith("/auth") ? "/business" : rawPath;
    const sendToAuth = () =>
      navigate({
        to: "/auth",
        search: { redirect: fullPath } as never,
        replace: true,
      });

    const evaluate = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        sendToAuth();
        return;
      }
      const uid = data.session.user.id;

      // Admin bypass
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (roles) {
        if (active) setStatus("ready");
        return;
      }

      // Business plan check
      const { data: plan } = await supabase
        .from("user_plans")
        .select("plan_id, expires_at, active")
        .eq("user_id", uid)
        .eq("active", true)
        .gte("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;
      if (plan && BUSINESS_PLAN_IDS.includes(plan.plan_id)) {
        setStatus("ready");
      } else {
        setStatus("no-plan");
      }
    };

    evaluate();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) sendToAuth();
      else evaluate();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, location.pathname, location.searchStr]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#0a2540]">
        <Loader2 className="h-6 w-6 animate-spin text-[#635bff]" />
      </div>
    );
  }

  if (status === "no-plan") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f6f9fc] to-white px-6 py-16 text-[#0a2540]">
        <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-[0_20px_60px_rgba(50,50,93,0.12),0_8px_24px_rgba(0,0,0,0.05)] ring-1 ring-[#e3e8ee]">
          <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#635bff]/10 text-[#635bff]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight">Business plan required</h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-[#425466]">
            Synthetic data and the AI marketing suite are part of <b>Nive AI for Business</b>.
            Upgrade to <b>Growth</b> (₹499/mo) or <b>Scale</b> (₹1499/mo) to unlock them.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/business/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#635bff] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#5048d6]"
            >
              <Sparkles className="h-4 w-4" /> See Business plans
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md border border-[#e0e6eb] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0a2540] transition-all hover:border-[#cfd7df]"
            >
              Back to chat
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-[#697386]">
            On a Code plan (Starter/Pro)? Those unlock the chat assistant, not the Business suite.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
