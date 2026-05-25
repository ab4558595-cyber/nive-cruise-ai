import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PLANS, OWNER_EMAIL } from "./plans";

const SubmitInput = z.object({
  planId: z.string().min(1).max(32),
  transactionRef: z.string().trim().min(4).max(120),
});

export const submitPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const plan = PLANS.find((p) => p.id === data.planId);
    if (!plan) throw new Error("Unknown plan");
    if (plan.price === 0) throw new Error("Free plan does not require payment");

    const { userId, claims } = context as { userId: string; claims: { email?: string } };
    const userEmail = claims.email ?? "";

    const { data: row, error } = await supabaseAdmin
      .from("payment_requests")
      .insert({
        user_id: userId,
        user_email: userEmail,
        plan_id: plan.id,
        amount: plan.price,
        transaction_ref: data.transactionRef,
      })
      .select("id, approval_token")
      .single();
    if (error) throw new Error(error.message);

    // Build approval URL (works even without email — admin can copy it from /admin)
    const origin = process.env.SITE_URL || "";
    const approveUrl = `${origin}/api/public/approve-payment?token=${row.approval_token}&action=approve`;
    const rejectUrl = `${origin}/api/public/approve-payment?token=${row.approval_token}&action=reject`;

    console.log("=== NEW PAYMENT REQUEST ===");
    console.log(`User: ${userEmail}`);
    console.log(`Plan: ${plan.name} — ₹${plan.price}`);
    console.log(`Txn ref: ${data.transactionRef}`);
    console.log(`Approve: ${approveUrl}`);
    console.log(`Reject:  ${rejectUrl}`);
    console.log(`Owner email: ${OWNER_EMAIL}`);

    return { ok: true };
  });

export const getMyPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { data } = await supabaseAdmin
      .from("user_plans")
      .select("plan_id, expires_at, active")
      .eq("user_id", userId)
      .eq("active", true)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { plan: data ?? null };
  });

export const listPendingPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

const ActionInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export const actOnPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ActionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { data: req, error } = await supabaseAdmin
      .from("payment_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !req) throw new Error("Request not found");

    if (data.action === "approve") {
      await supabaseAdmin
        .from("payment_requests")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", req.id);
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      await supabaseAdmin.from("user_plans").insert({
        user_id: req.user_id,
        plan_id: req.plan_id,
        expires_at: expires.toISOString(),
        active: true,
      });
    } else {
      await supabaseAdmin
        .from("payment_requests")
        .update({ status: "rejected" })
        .eq("id", req.id);
    }
    return { ok: true };
  });
