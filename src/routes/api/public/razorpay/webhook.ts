import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-razorpay-signature");
        const body = await request.text();
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!signature || !secret) return new Response("missing signature", { status: 401 });

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as {
          event: string;
          payload: { payment?: { entity: { id: string; notes?: Record<string, string> } } };
        };

        if (event.event === "payment.captured") {
          const p = event.payload.payment?.entity;
          const userId = p?.notes?.user_id;
          const planId = p?.notes?.plan_id;
          if (userId && planId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            // idempotency
            const { data: seen } = await supabaseAdmin
              .from("processed_webhook_events")
              .select("event_id")
              .eq("event_id", p.id)
              .maybeSingle();
            if (!seen) {
              const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              await supabaseAdmin.from("user_plans").upsert(
                { user_id: userId, plan_id: planId, active: true, expires_at: expiresAt },
                { onConflict: "user_id" },
              );
              const { creditsForPlan } = await import("@/lib/plans");
              const credits = creditsForPlan(planId);
              if (credits > 0) {
                const { error: grantErr } = await supabaseAdmin.rpc("grant_credits", {
                  _user_id: userId,
                  _amount: credits,
                  _reason: `purchase:${planId}`,
                  _metadata: { payment_id: p.id } as never,
                });
                if (grantErr) console.error("credit grant failed", grantErr);
              }
              await supabaseAdmin
                .from("processed_webhook_events")
                .insert({ event_id: p.id, source: "razorpay" });
            }
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
