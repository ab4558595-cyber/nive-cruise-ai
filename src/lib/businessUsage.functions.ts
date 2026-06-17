import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Base daily limits for free Business plans. Multiplied by plan tier. */
export const DAILY_LIMITS = {
  synthetic: 40,
  marketing: 30,
} as const;

/** Plan multiplier on top of base. Scale/admin are effectively unlimited. */
const PLAN_MULTIPLIER: Record<string, number> = {
  "biz-growth": 2,
  "biz-scale": 1, // overridden to 9999 below
  admin: 1,
};

/** Plans that include access to the Business suite (synthetic + marketing). */
export const BUSINESS_PLAN_IDS = ["biz-growth", "biz-scale"] as const;

export async function requireBusinessPlan(supabase: any, userId: string): Promise<string> {
  const { data: adminRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (adminRow) return "admin";

  const { data: plan } = await supabase
    .from("user_plans")
    .select("plan_id, expires_at, active")
    .eq("user_id", userId)
    .eq("active", true)
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan || !BUSINESS_PLAN_IDS.includes(plan.plan_id)) {
    const err: any = new Error(
      "This tool is part of Nive AI for Business. Upgrade to Growth or Scale to unlock it.",
    );
    err.code = "BUSINESS_PLAN_REQUIRED";
    throw err;
  }
  return plan.plan_id as string;
}

export type ToolKey = keyof typeof DAILY_LIMITS;

export type UsageSnapshot = {
  tool: ToolKey;
  limit: number;
  baseLimit: number;
  bonus: number;
  used: number;
  remaining: number;
  resetsAtUtc: string;
};

export const TOPUP_PACKS = {
  synthetic_small: { tool: "synthetic" as const, credits: 10, amount_inr: 49, label: "+10 runs" },
  synthetic_medium: { tool: "synthetic" as const, credits: 30, amount_inr: 119, label: "+30 runs" },
  marketing_small: { tool: "marketing" as const, credits: 10, amount_inr: 79, label: "+10 runs" },
  marketing_medium: { tool: "marketing" as const, credits: 30, amount_inr: 199, label: "+30 runs" },
} as const;
export type TopupPackId = keyof typeof TOPUP_PACKS;

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowUtcIso(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

function effectiveBaseLimit(tool: ToolKey, planId: string): number {
  if (planId === "biz-scale" || planId === "admin") return 9999;
  const mult = PLAN_MULTIPLIER[planId] ?? 1;
  return DAILY_LIMITS[tool] * mult;
}

export async function loadUsage(
  supabase: any,
  userId: string,
  tool: ToolKey,
  planId: string = "biz-growth",
): Promise<UsageSnapshot> {
  const day = todayUtc();
  const [{ data: usageRow, error: usageErr }, { data: topupRows, error: topupErr }] =
    await Promise.all([
      supabase
        .from("business_tool_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("tool", tool)
        .eq("day", day)
        .maybeSingle(),
      supabase
        .from("business_credit_topups")
        .select("credits")
        .eq("user_id", userId)
        .eq("tool", tool)
        .eq("day", day),
    ]);
  if (usageErr) throw new Error(usageErr.message);
  if (topupErr) throw new Error(topupErr.message);

  const used = usageRow?.count ?? 0;
  const bonus = (topupRows ?? []).reduce((s: number, r: any) => s + (r.credits ?? 0), 0);
  const baseLimit = effectiveBaseLimit(tool, planId);
  const limit = baseLimit + bonus;
  return {
    tool,
    limit,
    baseLimit,
    bonus,
    used,
    remaining: Math.max(0, limit - used),
    resetsAtUtc: tomorrowUtcIso(),
  };
}

export const getBusinessUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ tool: z.enum(["synthetic", "marketing"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const planId = await requireBusinessPlan(supabase, userId);
    return loadUsage(supabase, userId, data.tool, planId);
  });

/** Increment usage by `credits` (default 1). Throws if over the effective limit. */
export const consumeBusinessUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        tool: z.enum(["synthetic", "marketing"]),
        credits: z.number().int().min(1).max(10).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<UsageSnapshot> => {
    const { supabase, userId } = context as any;
    const planId = await requireBusinessPlan(supabase, userId);
    const current = await loadUsage(supabase, userId, data.tool, planId);
    const cost = data.credits ?? 1;
    if (current.used + cost > current.limit) {
      throw new Error(
        `Not enough ${data.tool} credits left (need ${cost}, have ${current.remaining}/${current.limit}). Top up or wait until midnight UTC.`,
      );
    }
    const day = todayUtc();
    const nextCount = current.used + cost;
    const { error: upErr } = await supabase
      .from("business_tool_usage")
      .upsert(
        {
          user_id: userId,
          tool: data.tool,
          day,
          count: nextCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,tool,day" },
      );
    if (upErr) throw new Error(upErr.message);

    const { error: evErr } = await supabase.from("business_tool_events").insert({
      user_id: userId,
      tool: data.tool,
      credits: cost,
      metadata: data.metadata ?? {},
    });
    if (evErr) console.error("event log insert failed", evErr);

    return {
      ...current,
      used: nextCount,
      remaining: Math.max(0, current.limit - nextCount),
    };
  });

export const purchaseBusinessTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        pack: z.enum(
          Object.keys(TOPUP_PACKS) as [TopupPackId, ...TopupPackId[]],
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<UsageSnapshot> => {
    const { supabase, userId } = context as any;
    const planId = await requireBusinessPlan(supabase, userId);
    const pack = TOPUP_PACKS[data.pack as TopupPackId];
    const { error } = await supabase.from("business_credit_topups").insert({
      user_id: userId,
      tool: pack.tool,
      credits: pack.credits,
      amount_inr: pack.amount_inr,
      pack: data.pack,
    });
    if (error) throw new Error(error.message);
    return loadUsage(supabase, userId, pack.tool, planId);
  });

export type UsageHistoryDay = {
  day: string;
  synthetic: { runs: number; credits: number; lastAt: string | null };
  marketing: { runs: number; credits: number; lastAt: string | null };
  topupsInr: number;
  events: Array<{
    id: string;
    tool: ToolKey;
    credits: number;
    at: string;
  }>;
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

    const [{ data: events, error: evErr }, { data: topups, error: tpErr }] =
      await Promise.all([
        supabase
          .from("business_tool_events")
          .select("id, tool, credits, created_at")
          .eq("user_id", userId)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("business_credit_topups")
          .select("amount_inr, day")
          .eq("user_id", userId)
          .gte("day", sinceIso.slice(0, 10)),
      ]);
    if (evErr) throw new Error(evErr.message);
    if (tpErr) throw new Error(tpErr.message);

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
      const tool = e.tool as ToolKey;
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
    for (const t of topups ?? []) {
      ensure(t.day as string).topupsInr += t.amount_inr ?? 0;
    }

    return Array.from(byDay.values()).sort((a, b) => (a.day < b.day ? 1 : -1));
  });
