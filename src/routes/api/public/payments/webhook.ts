import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

// Map Paddle product external_id -> our internal plan id (used in user_plans).
// Keep in sync with the Paddle catalog (see src/lib/plans.ts).
const PRODUCT_TO_PLAN: Record<string, string> = {
  starter: "starter",
  pro: "pro",
  biz_growth: "biz-growth",
  biz_scale: "biz-scale",
};

async function activateUserPlan(
  userId: string,
  productExternalId: string,
  periodEnd: string | undefined,
) {
  const planId = PRODUCT_TO_PLAN[productExternalId];
  if (!planId) return;
  await getSupabase().from("user_plans").upsert(
    {
      user_id: userId,
      plan_id: planId,
      active: true,
      expires_at: periodEnd ?? null,
    },
    { onConflict: "user_id" },
  );
}

async function deactivateUserPlan(userId: string) {
  await getSupabase()
    .from("user_plans")
    .update({ active: false })
    .eq("user_id", userId);
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData");
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId", {
      rawPriceId: item.price.id,
      rawProductId: item.product.id,
    });
    return;
  }

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  await activateUserPlan(userId, productId, currentBillingPeriod?.endsAt);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items, customData } = data;
  await getSupabase()
    .from("subscriptions")
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  const userId = customData?.userId;
  const productId = items?.[0]?.product?.importMeta?.externalId;
  if (userId && productId && (status === "active" || status === "trialing")) {
    await activateUserPlan(userId, productId, currentBillingPeriod?.endsAt);
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { id, customData } = data;
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  const userId = customData?.userId;
  if (userId) await deactivateUserPlan(userId);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
