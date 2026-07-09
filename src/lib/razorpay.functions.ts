import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPlan } from "./plans";

const CreateOrderInput = z.object({
  planId: z.string().min(1).max(32),
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const plan = getPlan(data.planId);
    if (!plan) throw new Error("Unknown plan");
    if (plan.price <= 0) throw new Error("Free plan does not require payment");

    const { userId, claims } = context as { userId: string; claims: { email?: string } };
    const { rzpFetch, getRazorpayKeys } = await import("./razorpay.server");

    const receipt = `nv_${plan.id}_${Date.now().toString(36)}`.slice(0, 40);
    const res = await rzpFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: plan.price * 100, // paise
        currency: "INR",
        receipt,
        notes: {
          user_id: userId,
          plan_id: plan.id,
          user_email: claims.email ?? "",
        },
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error("Razorpay order create failed:", body);
      throw new Error(body?.error?.description || "Could not create payment order");
    }

    return {
      orderId: body.id as string,
      amount: body.amount as number,
      currency: body.currency as string,
      keyId: getRazorpayKeys().keyId,
      planName: plan.name,
      userEmail: claims.email ?? "",
    };
  });

const VerifyInput = z.object({
  planId: z.string().min(1).max(32),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VerifyInput.parse(input))
  .handler(async ({ data, context }) => {
    const plan = getPlan(data.planId);
    if (!plan) throw new Error("Unknown plan");

    const { userId } = context as { userId: string };
    const { verifyCheckoutSignature } = await import("./razorpay.server");
    const ok = await verifyCheckoutSignature({
      orderId: data.razorpayOrderId,
      paymentId: data.razorpayPaymentId,
      signature: data.razorpaySignature,
    });
    if (!ok) throw new Error("Invalid payment signature");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    // Deactivate any current active plan, then insert new one
    await supabaseAdmin
      .from("user_plans")
      .update({ active: false })
      .eq("user_id", userId)
      .eq("active", true);

    const { error } = await supabaseAdmin.from("user_plans").insert({
      user_id: userId,
      plan_id: plan.id,
      active: true,
      expires_at: expires.toISOString(),
    });
    if (error) throw new Error(error.message);

    return { ok: true, planId: plan.id };
  });
