import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listPendingPayments, actOnPayment } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Cruise AI" }] }),
  component: Admin,
});

type Req = {
  id: string;
  user_email: string;
  plan_id: string;
  amount: number;
  transaction_ref: string;
  status: string;
  created_at: string;
};

function Admin() {
  const list = useServerFn(listPendingPayments);
  const act = useServerFn(actOnPayment);
  const [requests, setRequests] = useState<Req[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in first.");
        return;
      }
      const res = await list();
      setRequests(res.requests);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    }
  };

  useEffect(() => { load(); }, []);

  const handle = async (id: string, action: "approve" | "reject") => {
    setBusy(id + action);
    try {
      await act({ data: { id, action } });
      toast.success(action === "approve" ? "Approved" : "Rejected");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-10">
      <Toaster richColors position="top-center" theme="dark" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-surface)" }} />

      <div className="mx-auto max-w-4xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="text-2xl font-semibold">Payment approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve or reject pending payments from users.</p>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            {error} — <Link to="/auth" className="underline">sign in</Link>
          </div>
        )}

        {requests === null && !error && (
          <div className="mt-10 flex justify-center"><Loader2 className="animate-spin" /></div>
        )}

        {requests && requests.length === 0 && (
          <div className="mt-10 rounded-xl border border-border/60 bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No payment requests yet.
          </div>
        )}

        {requests && requests.length > 0 && (
          <div className="mt-6 space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{r.user_email}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Plan: <b className="text-foreground">{r.plan_id}</b> · ₹{r.amount} · UTR <span className="font-mono">{r.transaction_ref}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === "pending" ? "bg-yellow-500/20 text-yellow-300"
                      : r.status === "approved" ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                    }`}>{r.status}</span>
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" disabled={busy === r.id + "approve"} onClick={() => handle(r.id, "approve")}>
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy === r.id + "reject"} onClick={() => handle(r.id, "reject")}>
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
