import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS } from "./plans";

const CreateOrderInput = z.object({ planId: z.string().min(1).max(32) });

function basicAuth() {
  const id = process.env.RAZORPAY_KEY_ID!;
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const plan = PLANS.find((p) => p.id === data.planId);
    if (!plan) throw new Error("Unknown plan");
    if (plan.price === 0) throw new Error("Free plan does not require payment");

    const { userId, claims } = context as { userId: string; claims: { email?: string } };

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: basicAuth() },
      body: JSON.stringify({
        amount: plan.price * 100,
        currency: "INR",
        receipt: `${plan.id}_${userId.slice(0, 8)}_${Date.now()}`,
        notes: { user_id: userId, plan_id: plan.id, user_email: claims.email ?? "" },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("razorpay order create failed", res.status, text);
      throw new Error("Could not create order. Please try again.");
    }
    const order = await res.json();
    return {
      orderId: order.id as string,
      amount: order.amount as number,
      currency: order.currency as string,
      keyId: process.env.RAZORPAY_KEY_ID!,
      planName: plan.name,
      userEmail: claims.email ?? "",
    };
  });

const VerifyInput = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  planId: z.string(),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VerifyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const sigBuf = Buffer.from(data.razorpay_signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new Error("Payment signature invalid");
    }

    const plan = PLANS.find((p) => p.id === data.planId);
    if (!plan) throw new Error("Unknown plan");

    const { userId } = context as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("user_plans").upsert(
      { user_id: userId, plan_id: plan.id, active: true, expires_at: expiresAt },
      { onConflict: "user_id" },
    );
    if (error) {
      console.error("activate plan failed", error);
      throw new Error("Payment ok but plan activation failed. Contact support.");
    }
    const credits = plan.credits ?? 0;
    if (credits > 0) {
      const { data: seen } = await supabaseAdmin
        .from("processed_webhook_events")
        .select("event_id")
        .eq("event_id", data.razorpay_payment_id)
        .maybeSingle();
      if (!seen) {
        const { giveCredits } = await import("./credits.server");
        await giveCredits(userId, credits, `purchase:${plan.id}`, {
          payment_id: data.razorpay_payment_id,
        });
        await supabaseAdmin
          .from("processed_webhook_events")
          .insert({ event_id: data.razorpay_payment_id, source: "razorpay-verify" });
      }
    }

    return { ok: true, planId: plan.id, credits };
  });
