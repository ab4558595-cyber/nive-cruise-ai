import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DAILY_LIMITS = {
  synthetic: 20,
  marketing: 15,
} as const;

export type ToolKey = keyof typeof DAILY_LIMITS;

export type UsageSnapshot = {
  tool: ToolKey;
  limit: number;        // effective limit (base + today's topups)
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

export async function loadUsage(
  supabase: any,
  userId: string,
  tool: ToolKey,
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
  const baseLimit = DAILY_LIMITS[tool];
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
    return loadUsage(supabase, userId, data.tool);
  });

/** Increment usage + log a per-run event. Throws if over the effective limit. */
export const consumeBusinessUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        tool: z.enum(["synthetic", "marketing"]),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<UsageSnapshot> => {
    const { supabase, userId } = context as any;
    const current = await loadUsage(supabase, userId, data.tool);
    if (current.remaining <= 0) {
      throw new Error(
        `Daily limit reached for ${data.tool} (${current.limit}/day). Top up or wait until midnight UTC.`,
      );
    }
    const day = todayUtc();
    const nextCount = current.used + 1;
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
      credits: 1,
      metadata: data.metadata ?? {},
    });
    if (evErr) console.error("event log insert failed", evErr);

    return {
      ...current,
      used: nextCount,
      remaining: Math.max(0, current.limit - nextCount),
    };
  });

/** Purchase a top-up pack. Credits are granted instantly for today (UTC). */
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
    const pack = TOPUP_PACKS[data.pack as TopupPackId];
    const { error } = await supabase.from("business_credit_topups").insert({
      user_id: userId,
      tool: pack.tool,
      credits: pack.credits,
      amount_inr: pack.amount_inr,
      pack: data.pack,
    });
    if (error) throw new Error(error.message);
    return loadUsage(supabase, userId, pack.tool);
  });

export type UsageHistoryDay = {
  day: string; // YYYY-MM-DD (UTC)
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
