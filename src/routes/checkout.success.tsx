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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <CheckCircle2 className="h-14 w-14 text-[#635bff]" />
      <h1 className="mt-6 text-3xl font-bold text-[#0a2540]">Payment successful</h1>
      <p className="mt-3 max-w-md text-[15px] text-[#425466]">
        Thanks! Your subscription is being activated. It usually takes a few seconds — refresh if you
        don't see your plan right away.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="rounded-md bg-[#635bff] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5048d6]"
        >
          Back to chat
        </Link>
      </div>
    </div>
  );
}
