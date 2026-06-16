import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Client-side auth gate for /business/* pages.
 * Redirects unauthenticated users to /auth?redirect=<full-path-with-query>.
 */
export function BusinessAuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const [status, setStatus] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    let active = true;
    const fullPath = `${location.pathname}${location.searchStr || ""}`;
    const sendToAuth = () =>
      navigate({
        to: "/auth",
        search: { redirect: fullPath } as never,
        replace: true,
      });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) sendToAuth();
      else setStatus("ready");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) sendToAuth();
      else setStatus("ready");
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
  return <>{children}</>;
}
