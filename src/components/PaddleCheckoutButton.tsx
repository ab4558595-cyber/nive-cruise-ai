import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { supabase } from "@/integrations/supabase/client";

// Map our internal plan.id (from src/lib/plans.ts) -> Paddle human-readable price_id.
const PLAN_TO_PRICE: Record<string, string> = {
  starter: "starter_monthly",
  pro: "pro_monthly",
  "biz-growth": "biz_growth_monthly",
  "biz-scale": "biz_scale_monthly",
};

interface Props {
  planId: string;
  planName: string;
  highlight?: boolean;
}

export function PaddleCheckoutButton({ planId, planName, highlight }: Props) {
  const { openCheckout, loading } = usePaddleCheckout();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  const priceId = PLAN_TO_PRICE[planId];

  const handleClick = async () => {
    if (!user) {
      window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!priceId) {
      console.error("No Paddle price mapped for plan", planId);
      return;
    }
    try {
      await openCheckout({
        priceId,
        customerEmail: user.email,
        customData: { userId: user.id, planId },
        successUrl: `${window.location.origin}/checkout/success`,
      });
    } catch (e) {
      console.error("Checkout failed", e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`mt-7 inline-flex items-center justify-center gap-2 rounded-md py-2.5 text-[14px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all disabled:opacity-60 ${
        highlight ? "bg-[#635bff] hover:bg-[#5048d6]" : "bg-[#0a2540] hover:bg-[#1a3a5c]"
      }`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Choose {planName}
    </button>
  );
}
