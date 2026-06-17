import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  getPlan,
  getPaddlePriceIdForPlan,
  buildUpiUri,
  qrImageUrl,
  UPI_ID,
} from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitPayment } from "@/lib/payments.functions";
import { initializePaddle, getPaddlePriceId, getPaddleEnvironment } from "@/lib/paddle";
import { Ribbon } from "@/components/Ribbon";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/checkout/$planId")({
  head: ({ params }) => ({
    meta: [
      { title: "Checkout — Nive AI" },
      { name: "description", content: "Complete your Nive AI plan purchase securely. Pay with card, UPI, wallets, or net banking via Paddle." },
      { property: "og:title", content: "Checkout — Nive AI" },
      { property: "og:description", content: "Pay for your Nive AI plan and unlock instant access." },
      { property: "og:url", content: `/checkout/${params.planId}` },
    ],
    links: [{ rel: "canonical", href: `/checkout/${params.planId}` }],
  }),
  component: Checkout,
});

type Mode = "card" | "upi";

function Checkout() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const plan = getPlan(planId);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [mode, setMode] = useState<Mode>("card");
  const [txnRef, setTxnRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paddleLoading, setPaddleLoading] = useState(false);
  const [paddleError, setPaddleError] = useState<string | null>(null);
  const submit = useServerFn(submitPayment);
  const openedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setUserEmail(data.session?.user.email ?? undefined);
      setUserId(data.session?.user.id);
    });
  }, []);

  const paddlePriceExternalId = plan ? getPaddlePriceIdForPlan(plan.id) : undefined;

  // Open Paddle inline checkout when card mode is active
  useEffect(() => {
    if (mode !== "card" || !authed || !plan || !paddlePriceExternalId) return;
    if (openedRef.current) return;
    openedRef.current = true;

    (async () => {
      setPaddleLoading(true);
      setPaddleError(null);
      try {
        await initializePaddle();
        const paddlePriceId = await getPaddlePriceId(paddlePriceExternalId);
        // Ensure the inline container exists in the DOM before Paddle tries
        // to mount its iframe into it (otherwise paddle.js throws
        // "Cannot read properties of undefined (reading 'appendChild')").
        // Paddle's `frameTarget` is a CLASS NAME, not an id — wait for the
        // container with that class to be in the DOM before opening.
        for (let i = 0; i < 20; i++) {
          if (document.querySelector(".paddle-checkout-container")) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        window.Paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customer: userEmail ? { email: userEmail } : undefined,
          customData: { userId: userId ?? "", planId: plan.id },
          settings: {
            displayMode: "inline",
            frameTarget: "paddle-checkout-container",
            frameInitialHeight: 450,
            frameStyle:
              "width: 100%; min-width: 312px; background-color: transparent; border: none;",
            successUrl: `${window.location.origin}/checkout/success`,
            allowLogout: false,
          },
        });
      } catch (err: any) {
        console.error("Paddle checkout failed:", err);
        setPaddleError(err?.message || "Could not load card checkout. Try UPI instead.");
      } finally {
        setPaddleLoading(false);
      }
    })();
  }, [mode, authed, plan, paddlePriceExternalId, userEmail, userId]);

  // Reset Paddle when switching modes so it re-opens when coming back to card
  useEffect(() => {
    if (mode !== "card") openedRef.current = false;
  }, [mode]);

  if (!plan) {
    return (
      <div className="p-10 text-center">
        Unknown plan. <Link to="/pricing" className="text-primary underline">Back to pricing</Link>
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Ribbon />
        <div className="relative z-10 rounded-2xl bg-white p-8 text-center shadow-[0_15px_50px_rgba(50,50,93,0.12),0_5px_15px_rgba(0,0,0,0.07)]">
          <h1 className="mb-2 text-xl font-semibold text-[#0a2540]">Sign in to continue</h1>
          <p className="mb-5 text-sm text-[#697386]">You need an account to purchase {plan.name}.</p>
          <Link to="/auth" className="inline-flex items-center justify-center rounded-md bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#5048d6]">
            Sign in / Sign up
          </Link>
        </div>
      </div>
    );
  }

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-6 w-6 animate-spin text-[#635bff]" /></div>;
  }

  const note = `Nive AI ${plan.name}`;
  const upi = buildUpiUri(plan.price, note);
  const qr = qrImageUrl(upi);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (txnRef.trim().length < 4) {
      toast.error("Enter your UPI transaction reference (UTR)");
      return;
    }
    setSubmitting(true);
    try {
      await submit({ data: { planId: plan.id, transactionRef: txnRef.trim() } });
      toast.success("Submitted! Your access activates once approved.");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <Toaster richColors position="top-center" />
      <PaymentTestModeBanner />
      <Ribbon />

      <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight text-[#0a2540]">nive</Link>
        <Link to="/pricing" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]">
          <ArrowLeft className="h-4 w-4" /> Back to pricing
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6">
        <div className="rounded-2xl bg-white p-7 shadow-[0_15px_50px_rgba(50,50,93,0.1),0_5px_15px_rgba(0,0,0,0.05)] sm:p-10">
          <h1 className="text-[26px] font-bold tracking-tight text-[#0a2540]">Pay for {plan.name}</h1>
          <p className="mt-1.5 text-[14px] text-[#697386]">
            ₹{plan.price} for {plan.period}. Choose how you want to pay.
          </p>

          {/* Payment method tabs */}
          <div className="mt-6 inline-flex rounded-lg bg-[#f6f9fc] p-1">
            <button
              type="button"
              onClick={() => setMode("card")}
              className={`rounded-md px-4 py-2 text-[13.5px] font-semibold transition-all ${
                mode === "card" ? "bg-white text-[#0a2540] shadow-sm" : "text-[#697386] hover:text-[#0a2540]"
              }`}
            >
              Card / UPI / Wallet
            </button>
            <button
              type="button"
              onClick={() => setMode("upi")}
              className={`rounded-md px-4 py-2 text-[13.5px] font-semibold transition-all ${
                mode === "upi" ? "bg-white text-[#0a2540] shadow-sm" : "text-[#697386] hover:text-[#0a2540]"
              }`}
            >
              Manual UPI (QR)
            </button>
          </div>

          {mode === "card" ? (
            <div className="mt-6">
              {!paddlePriceExternalId && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-[13.5px] text-amber-800">
                  This plan isn't wired to the payment provider yet. Use the Manual UPI option above.
                </div>
              )}
              {paddleError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700">
                  {paddleError}
                </div>
              )}
              {paddleLoading && (
                <div className="flex items-center justify-center py-10 text-[#697386]">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading secure checkout…
                </div>
              )}
              {/* Paddle injects checkout here */}
              <div className="paddle-checkout-container min-h-[450px] rounded-xl" />
              {getPaddleEnvironment() === "sandbox" && (
                <p className="mt-3 text-[12px] text-[#697386]">
                  Test mode — use card <span className="font-mono">4242 4242 4242 4242</span>, any future expiry, CVC <span className="font-mono">123</span>.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="flex flex-col items-center rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-5">
                <img src={qr} alt="UPI QR code" className="h-60 w-60 rounded-lg bg-white p-2 shadow-sm" />
                <div className="mt-4 text-center">
                  <div className="text-[28px] font-bold text-[#0a2540]">₹{plan.price}</div>
                  <div className="mt-1 text-[12px] text-[#697386]">UPI: <span className="font-mono text-[#3c4257]">{UPI_ID}</span></div>
                  <a href={upi} className="mt-3 inline-block text-[13px] font-medium text-[#635bff] hover:underline md:hidden">
                    Open in UPI app →
                  </a>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col">
                <h2 className="text-[15px] font-semibold text-[#0a2540]">How it works</h2>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-[13.5px] text-[#425466]">
                  <li>Scan QR & pay <b className="text-[#0a2540]">₹{plan.price}</b></li>
                  <li>Copy the UTR / transaction ID from your UPI app</li>
                  <li>Paste it below & submit</li>
                  <li>Owner approves — access activates instantly</li>
                </ol>

                <div className="mt-5">
                  <Label htmlFor="utr" className="mb-1.5 block text-[14px] font-medium text-[#3c4257]">UPI Transaction Reference (UTR)</Label>
                  <Input
                    id="utr"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="e.g. 412345678901"
                    required
                    minLength={4}
                    maxLength={120}
                    className="rounded-md border-[#e0e6eb] bg-white text-[15px] text-[#0a2540] shadow-sm focus-visible:border-[#635bff] focus-visible:ring-2 focus-visible:ring-[#635bff]/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 rounded-md bg-[#635bff] py-3 text-[15px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.3)] transition-all hover:bg-[#5048d6] disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit for approval"}
                </Button>
                <p className="mt-3 text-[12px] text-[#697386]">
                  Approval usually takes a few hours. You'll see your plan activate on the home page.
                </p>
              </form>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#e3e8ee] pt-5 text-[12px] text-[#697386]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z" fill="#635bff"/>
            </svg>
            <span>Secured checkout — powered by <span className="font-semibold text-[#0a2540]">Paddle</span></span>
          </div>
        </div>
      </main>
    </div>
  );
}
