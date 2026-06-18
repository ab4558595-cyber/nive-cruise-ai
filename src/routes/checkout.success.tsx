import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-[#f6f9fc]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <main className="mx-auto max-w-[520px] px-6 pt-24">
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_15px_50px_rgba(50,50,93,0.1)] ring-1 ring-[#e3e8ee]">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#635bff]/10">
            <CheckCircle2 className="h-7 w-7 text-[#635bff]" />
          </div>
          <h1 className="mt-4 text-[26px] font-bold tracking-tight text-[#0a2540]">You're in!</h1>
          <p className="mt-2 text-[14px] text-[#697386]">
            Your plan is active. A receipt has been emailed to you.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/" className="rounded-md bg-[#635bff] py-2.5 text-[14px] font-semibold text-white hover:bg-[#5048d6]">
              Start building
            </Link>
            <Link to="/business" className="rounded-md border border-[#e0e6eb] py-2.5 text-[14px] font-semibold text-[#0a2540] hover:border-[#cfd7df]">
              Open Business suite
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
