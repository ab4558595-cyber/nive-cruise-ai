import { createFileRoute } from "@tanstack/react-router";

// Safety-net webhook: activates the user_plan in case the client-side verify
// call fails (e.g. user closes the tab right after payment). The checkout
// success flow normally activates the plan synchronously via verifyRazorpayPayment.

const VALID_PLANS = new Set(["starter", "pro", "biz-growth", "biz-scale"]);

export const Route = createFileRoute("/api/public/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-razorpay-signature");
        const rawBody = await request.text();
        if (!signature) return new Response("Missing signature", { status: 401 });

        const { verifyWebhookSignature } = await import("@/lib/razorpay.server");
        const ok = await verifyWebhookSignature(rawBody, signature);
        if (!ok) return new Response("Invalid signature", { status: 401 });

        let event: any;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        try {
          if (event?.event === "payment.captured") {
            const payment = event.payload?.payment?.entity;
            const notes = payment?.notes ?? {};
            const userId = notes.user_id as string | undefined;
            const planId = notes.plan_id as string | undefined;

            if (userId && planId && VALID_PLANS.has(planId)) {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

              // Idempotency: skip if already active for this plan
              const { data: existing } = await supabaseAdmin
                .from("user_plans")
                .select("id")
                .eq("user_id", userId)
                .eq("plan_id", planId)
                .eq("active", true)
                .gte("expires_at", new Date().toISOString())
                .maybeSingle();

              if (!existing) {
                await supabaseAdmin
                  .from("user_plans")
                  .update({ active: false })
                  .eq("user_id", userId)
                  .eq("active", true);

                const expires = new Date();
                expires.setDate(expires.getDate() + 30);
                await supabaseAdmin.from("user_plans").insert({
                  user_id: userId,
                  plan_id: planId,
                  active: true,
                  expires_at: expires.toISOString(),
                });
              }
            }
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Razorpay webhook error:", e);
          return new Response("Webhook error", { status: 500 });
        }
      },
    },
  },
});
