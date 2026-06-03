import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getPlan, buildUpiUri, qrImageUrl, UPI_ID } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitPayment } from "@/lib/payments.functions";
import { Ribbon } from "@/components/Ribbon";

export const Route = createFileRoute("/checkout/$planId")({
  head: ({ params }) => ({
    meta: [
      { title: "Checkout — Nive AI" },
      { name: "description", content: "Complete your Nive AI plan purchase securely with UPI. Access activates once your payment is verified." },
      { property: "og:title", content: "Checkout — Nive AI" },
      { property: "og:description", content: "Pay for your Nive AI plan via UPI and unlock instant access after approval." },
      { property: "og:url", content: `/checkout/${params.planId}` },
    ],
    links: [{ rel: "canonical", href: `/checkout/${params.planId}` }],
  }),
  component: Checkout,
});

function Checkout() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const plan = getPlan(planId);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = useServerFn(submitPayment);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

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

  if (authed === null) return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-6 w-6 animate-spin text-[#635bff]" /></div>;

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
          <p className="mt-1.5 text-[14px] text-[#697386]">Scan the QR with any UPI app, then enter your transaction reference.</p>

          <div className="mt-7 grid gap-6 md:grid-cols-2">
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
        </div>
      </main>
    </div>
  );
}
