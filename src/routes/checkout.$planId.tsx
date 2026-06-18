import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck, Check } from "lucide-react";
import { getPlan } from "@/lib/plans";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/razorpay.functions";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

export const Route = createFileRoute("/checkout/$planId")({
  head: () => ({
    meta: [
      { title: "Checkout — Razorpay trusted business" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function Checkout() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const plan = getPlan(planId);
  const createOrder = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);

  const [status, setStatus] = useState<"idle" | "loading" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  if (!plan) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Unknown plan</h1>
        <Link to="/pricing" className="mt-4 inline-block text-[#d97706] underline">Back to pricing</Link>
      </div>
    );
  }

  const handlePay = async () => {
    setError(null);
    setStatus("loading");
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load payment SDK. Check your network.");

      const order = await createOrder({ data: { planId: plan.id } });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Razorpay trusted business",
        description: `${order.planName} plan — 30 days`,
        order_id: order.orderId,
        prefill: { email: order.userEmail },
        theme: { color: "#d97706" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setStatus("processing");
          try {
            await verify({ data: { ...response, planId: plan.id } });
            navigate({ to: "/checkout/success", search: { plan: plan.id } });
          } catch (e) {
            setStatus("error");
            setError(e instanceof Error ? e.message : "Verification failed");
          }
        },
        modal: { ondismiss: () => setStatus("idle") },
      });
      rzp.on("payment.failed", (resp: unknown) => {
        console.error("payment failed", resp);
        setStatus("error");
        setError("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbeb] text-[#451a03]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="mx-auto flex max-w-[880px] items-center justify-between px-6 py-5">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight">nive</Link>
        <Link to="/pricing" className="inline-flex items-center gap-1.5 text-[14px] text-[#451a03]/70 hover:text-[#d97706]">
          <ArrowLeft className="h-4 w-4" /> Back to pricing
        </Link>
      </header>

      <main className="mx-auto max-w-[560px] px-6 pb-24 pt-6">
        <div className="rounded-2xl bg-white p-7 shadow-[0_15px_50px_rgba(50,50,93,0.1)] ring-1 ring-[#fde68a]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#d97706]">Checkout</p>
          <h1 className="mt-2 text-[28px] font-bold tracking-tight">{plan.name} plan</h1>
          <p className="mt-1 text-[14px] text-[#92400e]">{plan.tagline}</p>

          <div className="my-6 flex items-baseline gap-2 border-b border-t border-[#fde68a] py-5">
            <span className="text-[40px] font-bold">₹{plan.price}</span>
            <span className="text-[14px] text-[#92400e]">/ {plan.period}</span>
          </div>

          <ul className="space-y-2 text-[14px]">
            {plan.features.slice(0, 5).map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
                <span className="text-[#78350f]">{f}</span>
              </li>
            ))}
          </ul>

          {authed === false ? (
            <Link
              to="/auth"
              search={{ redirect: `/checkout/${plan.id}` }}
              className="mt-7 inline-flex w-full items-center justify-center rounded-md bg-[#451a03] py-3 text-[15px] font-semibold text-white hover:bg-[#78350f]"
            >
              Sign in to continue
            </Link>
          ) : (
            <button
              type="button"
              onClick={handlePay}
              disabled={status === "loading" || status === "processing" || authed === null}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#d97706] py-3 text-[15px] font-semibold text-white shadow-[0_2px_6px_rgba(99,91,255,0.35)] transition-all hover:bg-[#b45309] disabled:opacity-60"
            >
              {(status === "loading" || status === "processing") && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "processing" ? "Activating plan…" : status === "loading" ? "Opening…" : `Pay ₹${plan.price} securely`}
            </button>
          )}

          {error && (
            <p className="mt-3 rounded-md bg-[#fef2f2] px-3 py-2 text-[13px] text-[#c0392b]">{error}</p>
          )}

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-[#92400e]">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by Razorpay · Cards · UPI · Netbanking
          </p>
        </div>
      </main>
    </div>
  );
}
