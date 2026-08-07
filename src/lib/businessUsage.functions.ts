import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREDIT_COSTS } from "./credit-costs";

/** Tools that draw from the shared credit wallet. */
export const TOOL_KEYS = ["synthetic", "marketing"] as const;
export type ToolKey = (typeof TOOL_KEYS)[number];

/** Credit cost per run, per tool. */
export const TOOL_COSTS: Record<ToolKey, number> = {
  synthetic: CREDIT_COSTS.synthetic,
  marketing: CREDIT_COSTS.marketing,
};

/**
 * Wallet snapshot, shaped like the old daily-usage snapshot so existing
 * studio screens keep working. Credits never reset — they are bought.
 */
export type UsageSnapshot = {
  tool: ToolKey;
  /** Credits in the wallet right now. */
  remaining: number;
  /** Credits ever granted (used as the denominator in the badge). */
  limit: number;
  baseLimit: number;
  bonus: number;
  /** Credits ever spent. */
  used: number;
  costPerRun: number;
  resetsAtUtc: string;
};

/** Plan gating is handled by the credit balance itself — no separate plan check. */
export async function requireBusinessPlan(_supabase: unknown, _userId: string): Promise<string> {
  return "credits";
}

function snapshot(
  tool: ToolKey,
  balance: number,
  granted: number,
  spent: number,
): UsageSnapshot {
  return {
    tool,
    remaining: balance,
    limit: Math.max(granted, balance),
    baseLimit: Math.max(granted, balance),
    bonus: 0,
    used: spent,
    costPerRun: TOOL_COSTS[tool],
    resetsAtUtc: new Date(Date.now() + 30 * 86400000).toISOString(),
  };
}

export async function loadUsage(
  supabase: any,
  userId: string,
  tool: ToolKey,
  _planId?: string,
): Promise<UsageSnapshot> {
  const { data, error } = await supabase
    .from("credit_wallets")
    .select("balance, lifetime_granted, lifetime_spent")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return snapshot(
    tool,
    data?.balance ?? 0,
    data?.lifetime_granted ?? 0,
    data?.lifetime_spent ?? 0,
  );
}

export const getBusinessUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ tool: z.enum(TOOL_KEYS) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    return loadUsage(supabase, userId, data.tool);
  });

/** Deduct credits for one tool run. Throws when the wallet is short. */
export const consumeBusinessUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        tool: z.enum(TOOL_KEYS),
        credits: z.number().int().min(1).max(50).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<UsageSnapshot> => {
    const { supabase, userId } = context as any;
    const { chargeCredits } = await import("./credits.server");
    const cost = data.credits ?? TOOL_COSTS[data.tool];
    await chargeCredits(userId, cost, `${data.tool}_run`, data.tool, data.metadata ?? {});

    const { error: evErr } = await supabase.from("business_tool_events").insert({
      user_id: userId,
      tool: data.tool,
      credits: cost,
      metadata: data.metadata ?? {},
    });
    if (evErr) console.error("event log insert failed", evErr);

    return loadUsage(supabase, userId, data.tool);
  });

export type UsageHistoryDay = {
  day: string;
  synthetic: { runs: number; credits: number; lastAt: string | null };
  marketing: { runs: number; credits: number; lastAt: string | null };
  topupsInr: number;
  events: Array<{ id: string; tool: ToolKey; credits: number; at: string }>;
};

export const getBusinessUsageHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ days: z.number().int().min(1).max(60).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<UsageHistoryDay[]> => {
    const { supabase, userId } = context as any;
    const days = data.days ?? 14;
    const sinceIso = new Date(Date.now() - days * 86400000).toISOString();

    const { data: events, error: evErr } = await supabase
      .from("business_tool_events")
      .select("id, tool, credits, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(500);
    if (evErr) throw new Error(evErr.message);

    const byDay = new Map<string, UsageHistoryDay>();
    const ensure = (day: string): UsageHistoryDay => {
      let d = byDay.get(day);
      if (!d) {
        d = {
          day,
          synthetic: { runs: 0, credits: 0, lastAt: null },
          marketing: { runs: 0, credits: 0, lastAt: null },
          topupsInr: 0,
          events: [],
        };
        byDay.set(day, d);
      }
      return d;
    };

    for (const e of events ?? []) {
      const day = (e.created_at as string).slice(0, 10);
      const bucket = ensure(day);
      const tool = (e.tool as ToolKey) === "synthetic" ? "synthetic" : "marketing";
      bucket[tool].runs += 1;
      bucket[tool].credits += e.credits ?? 1;
      if (!bucket[tool].lastAt || e.created_at > bucket[tool].lastAt!) {
        bucket[tool].lastAt = e.created_at;
      }
      bucket.events.push({
        id: e.id,
        tool,
        credits: e.credits ?? 1,
        at: e.created_at,
      });
    }

    return Array.from(byDay.values()).sort((a, b) => (a.day < b.day ? 1 : -1));
  });

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
