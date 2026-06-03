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
  limit: number;
  used: number;
  remaining: number;
  resetsAtUtc: string;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowUtcIso(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

async function readUsage(
  supabase: any,
  userId: string,
  tool: ToolKey,
): Promise<UsageSnapshot> {
  const { data, error } = await supabase
    .from("business_tool_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("tool", tool)
    .eq("day", todayUtc())
    .maybeSingle();
  if (error) throw new Error(error.message);
  const used = data?.count ?? 0;
  const limit = DAILY_LIMITS[tool];
  return {
    tool,
    limit,
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
    return readUsage(supabase, userId, data.tool);
  });

/**
 * Atomically increment usage for a tool. Throws when the user is over the
 * daily limit. Returns the post-increment snapshot.
 */
export const consumeBusinessUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ tool: z.enum(["synthetic", "marketing"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const current = await readUsage(supabase, userId, data.tool);
    if (current.remaining <= 0) {
      throw new Error(
        `Daily limit reached for ${data.tool} (${current.limit}/day). Resets at midnight UTC.`,
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
    return {
      ...current,
      used: nextCount,
      remaining: Math.max(0, current.limit - nextCount),
    } satisfies UsageSnapshot;
  });
