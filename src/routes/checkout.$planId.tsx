import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getPlan } from "@/lib/plans";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/razorpay.functions";
import { Ribbon } from "@/components/Ribbon";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Route = createFileRoute("/checkout/$planId")({
  head: ({ params }) => ({
    meta: [
      { title: "Checkout — Nive AI" },
      { name: "description", content: "Complete your Nive AI plan purchase securely with UPI, cards, wallets, or net banking via Razorpay." },
      { property: "og:title", content: "Checkout — Nive AI" },
      { property: "og:description", content: "Pay for your Nive AI plan and unlock instant access." },
      { property: "og:url", content: `/checkout/${params.planId}` },
    ],
    links: [{ rel: "canonical", href: `/checkout/${params.planId}` }],
  }),
  component: Checkout,
});

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const plan = getPlan(planId);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "loading" | "verifying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setUserEmail(data.session?.user.email ?? undefined);
    });
  }, []);

  const handlePay = async () => {
    if (!plan) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Could not load Razorpay. Check your internet connection.");

      const order = await createOrder({ data: { planId: plan.id } });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Nive AI",
        description: `${order.planName} plan — 30 days`,
        order_id: order.orderId,
        prefill: {
          email: order.userEmail || userEmail || "",
        },
        theme: { color: "#635bff" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setStatus("verifying");
          try {
            await verifyPayment({
              data: {
                planId: plan.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });
            navigate({ to: "/checkout/success" });
          } catch (e: any) {
            setStatus("error");
            setErrorMsg(e?.message || "Payment captured but activation failed. Contact support.");
            toast.error(e?.message || "Activation failed");
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("idle");
          },
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        setStatus("error");
        setErrorMsg(resp?.error?.description || "Payment failed");
        toast.error(resp?.error?.description || "Payment failed");
      });

      rzp.open();
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setErrorMsg(e?.message || "Could not start checkout");
      toast.error(e?.message || "Could not start checkout");
    }
  };

  if (!plan) {
    return (
      <div className="p-10 text-center">
        Unknown plan.{" "}
        <Link to="/pricing" className="text-primary underline">
          Back to pricing
        </Link>
      </div>
    );
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#635bff]" />
      </div>
    );
  }

  if (authed === false) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-6"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <Ribbon />
        <div className="relative z-10 rounded-2xl bg-white p-8 text-center shadow-[0_15px_50px_rgba(50,50,93,0.12),0_5px_15px_rgba(0,0,0,0.07)]">
          <h1 className="mb-2 text-xl font-semibold text-[#0a2540]">Sign in to continue</h1>
          <p className="mb-5 text-sm text-[#697386]">You need an account to purchase {plan.name}.</p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#5048d6]"
          >
            Sign in / Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <Toaster richColors position="top-center" />
      <Ribbon />

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive
        </Link>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pricing
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-xl px-4 pb-16 pt-4 sm:px-6">
        <div className="rounded-2xl bg-white p-7 shadow-[0_15px_50px_rgba(50,50,93,0.1),0_5px_15px_rgba(0,0,0,0.05)] sm:p-10">
          <h1 className="text-[26px] font-bold tracking-tight text-[#0a2540]">Pay for {plan.name}</h1>
          <p className="mt-1.5 text-[14px] text-[#697386]">
            Unlock {plan.name} for {plan.period}.
          </p>

          <div className="mt-6 rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-medium text-[#3c4257]">{plan.name} plan</span>
              <span className="text-[28px] font-bold text-[#0a2540]">₹{plan.price}</span>
            </div>
            <p className="mt-1 text-[12px] text-[#697386]">
              One-time payment. Access valid for {plan.period}.
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={status === "loading" || status === "verifying"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#635bff] py-3 text-[15px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.3)] transition-all hover:bg-[#5048d6] disabled:opacity-60"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "verifying" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "loading"
              ? "Opening secure checkout…"
              : status === "verifying"
                ? "Activating your plan…"
                : `Pay ₹${plan.price}`}
          </button>

          <p className="mt-3 text-center text-[12px] text-[#697386]">
            UPI · Cards · Wallets · Net banking
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#e3e8ee] pt-5 text-[12px] text-[#697386]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#635bff]" />
            <span>
              Secure checkout — powered by{" "}
              <span className="font-semibold text-[#0a2540]">Razorpay</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
