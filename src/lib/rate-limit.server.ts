/**
 * Per-IP, per-route rate limiter backed by the public.abuse_log table.
 * Server-only. Bucket = floor(now / windowSec). Atomic upsert via UNIQUE
 * (ip, route, window_start). On limit hit, throws an Error with .status = 429.
 *
 * NOTE: Loaded lazily inside handlers — never import at module scope of any
 * file the client bundle can reach.
 */

import { createClient } from "@supabase/supabase-js";

export class RateLimitError extends Error {
  status = 429;
  retryAfter: number;
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry in ${retryAfter}s.`);
    this.retryAfter = retryAfter;
  }
}

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials not configured");
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export function getClientIp(req: Request): string {
  const h = req.headers;
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    "0.0.0.0"
  );
}

/**
 * Throws RateLimitError if (ip, route) has exceeded `max` requests inside the
 * current `windowSec`-second bucket. Otherwise increments the bucket.
 */
export async function rateLimit(
  ip: string,
  route: string,
  max: number,
  windowSec: number,
): Promise<void> {
  const sb = admin();
  const bucket = Math.floor(Date.now() / 1000 / windowSec) * windowSec;
  const windowStart = new Date(bucket * 1000).toISOString();

  // Upsert with hits=1; if row exists we'll bump it next.
  const { data, error } = await sb
    .from("abuse_log")
    .upsert(
      { ip, route, window_start: windowStart, hits: 1, updated_at: new Date().toISOString() },
      { onConflict: "ip,route,window_start", ignoreDuplicates: false },
    )
    .select("hits")
    .single();

  // If the upsert didn't increment (existing row kept), read + update manually.
  let hits = data?.hits ?? 1;
  if (!error && data && hits === 1) {
    // First write in this window — already counts.
  } else {
    const { data: row } = await sb
      .from("abuse_log")
      .select("hits")
      .eq("ip", ip)
      .eq("route", route)
      .eq("window_start", windowStart)
      .maybeSingle();
    hits = (row?.hits ?? 0) + 1;
    await sb
      .from("abuse_log")
      .update({ hits, updated_at: new Date().toISOString() })
      .eq("ip", ip)
      .eq("route", route)
      .eq("window_start", windowStart);
  }

  if (hits > max) {
    const retry = bucket + windowSec - Math.floor(Date.now() / 1000);
    throw new RateLimitError(Math.max(1, retry));
  }
}

/** Record that a webhook event was processed. Returns false if duplicate. */
export async function markWebhookProcessed(
  eventId: string,
  source: string,
): Promise<boolean> {
  const sb = admin();
  const { error } = await sb
    .from("processed_webhook_events")
    .insert({ event_id: eventId, source });
  if (!error) return true;
  // Unique violation = replay
  if ((error as any).code === "23505") return false;
  throw new Error(error.message);
}
