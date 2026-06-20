import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  loadUsage,
  todayUtc,
  requireBusinessPlan,
  type UsageSnapshot,
} from "./businessUsage.functions";

// ============================================================
//  Synthetic data — server-side advanced features
// ============================================================

// ----- Usage helper for synthetic tool -----
async function recordSyntheticUsage(
  supabase: any,
  userId: string,
  cost: number,
  metadata: Record<string, any>,
): Promise<UsageSnapshot> {
  const planId = await requireBusinessPlan(supabase, userId);
  const current = await loadUsage(supabase, userId, "synthetic", planId);
  if (current.used + cost > current.limit) {
    throw new Error(
      `Not enough synthetic credits (need ${cost}, have ${current.remaining}/${current.limit}). Top up or wait until midnight UTC.`,
    );
  }
  const day = todayUtc();
  const nextCount = current.used + cost;
  const { error: upErr } = await supabase
    .from("business_tool_usage")
    .upsert(
      {
        user_id: userId,
        tool: "synthetic",
        day,
        count: nextCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tool,day" },
    );
  if (upErr) throw new Error(upErr.message);
  await supabase.from("business_tool_events").insert({
    user_id: userId,
    tool: "synthetic",
    credits: cost,
    metadata,
  });
  return {
    ...current,
    used: nextCount,
    remaining: Math.max(0, current.limit - nextCount),
  };
}

const HF_PROXY_URL = "https://4idn-my-lovable-api.hf.space";

async function callGeminiJson(systemPrompt: string, userPrompt: string): Promise<any> {
  const parseLoose = (content: string) => {
    try { return JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error("AI returned invalid JSON");
    }
  };

  // Primary: HF proxy
  try {
    const res = await fetch(`${HF_PROXY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (res.ok) {
      const data: any = await res.json();
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.response ?? data?.content ?? data?.message ?? "";
      if (content) return parseLoose(content);
    } else {
      console.error("HF proxy failed, falling back to Lovable AI:", res.status);
    }
  } catch (e) {
    console.error("HF proxy threw, falling back to Lovable AI:", e);
  }

  // Fallback: Lovable AI Gateway
  const apiKey = process.env.LOVABLE_API_KEY;
  if (apiKey) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content ?? "";
      if (content) return parseLoose(content);
    } else {
      console.error("Lovable AI failed, falling back to ApiFreeLLM:", res.status);
    }
  }

  // Last resort: ApiFreeLLM
  const fbKey = process.env.APIFREELLM_API_KEY;
  if (!fbKey) throw new Error("AI not configured");
  const res = await fetch("https://apifreellm.com/api/v1/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${fbKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: `[SYSTEM]\n${systemPrompt}\n\n[USER]\n${userPrompt}` }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data: any = await res.json();
  const content =
    data?.response ?? data?.message ?? data?.content ?? data?.choices?.[0]?.message?.content ?? "";
  return parseLoose(content);
}

// ---------- AI-described schema ----------

const ALLOWED_FIELD_TYPES = [
  "id", "uuid", "first_name", "last_name", "full_name", "username", "email",
  "phone", "age", "company", "job_title",
  "city", "state", "country", "zip", "street", "lat", "lng",
  "amount", "currency_inr", "currency_usd", "currency_eur",
  "percent", "rating_1_5", "int_range",
  "product", "status", "ticket_status", "priority", "plan_name",
  "date", "iso_datetime", "boolean", "url", "ipv4", "paragraph", "tag",
] as const;

const AISchemaInput = z.object({
  description: z.string().trim().min(8).max(600),
});

export type AISchemaResult = {
  name: string;
  fields: { name: string; type: string; config?: { enumValues?: string; intMin?: number; intMax?: number; nullablePct?: number } }[];
  notes: string;
  usage: UsageSnapshot;
};

export const generateAISchema = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AISchemaInput.parse(input))
  .handler(async ({ data, context }): Promise<AISchemaResult> => {
    const { supabase, userId } = context as any;
    const system = `You design synthetic-data schemas. Output strictly valid JSON:
{
  "name": string,                   // short dataset name, snake_case, <=40 chars
  "fields": [
    {
      "name": string,               // snake_case, <=40 chars
      "type": one of [${ALLOWED_FIELD_TYPES.join(", ")}],
      "config": { "enumValues"?: string, "intMin"?: number, "intMax"?: number, "nullablePct"?: number }
    }
  ],                                // 5-15 fields, sensible for the description
  "notes": string                   // 1-2 sentence note about distributions/edge cases
}
Use enumValues only with type="tag". Use intMin/intMax only with type="int_range". JSON only.`;
    const userMsg = `Describe the dataset I want:\n"""${data.description}"""\n\nReturn the schema JSON.`;

    const p = await callGeminiJson(system, userMsg);
    const usage = await recordSyntheticUsage(supabase, userId, 2, { mode: "ai_schema" });

    const safeName = String(p.name ?? "dataset")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .slice(0, 40);
    const fields = Array.isArray(p.fields)
      ? p.fields
          .slice(0, 24)
          .map((f: any) => {
            const type = ALLOWED_FIELD_TYPES.includes(f.type) ? f.type : "paragraph";
            const cfg: any = {};
            if (typeof f.config?.enumValues === "string") cfg.enumValues = f.config.enumValues.slice(0, 200);
            if (Number.isFinite(f.config?.intMin)) cfg.intMin = Math.max(-1e9, Math.min(1e9, Number(f.config.intMin)));
            if (Number.isFinite(f.config?.intMax)) cfg.intMax = Math.max(-1e9, Math.min(1e9, Number(f.config.intMax)));
            if (Number.isFinite(f.config?.nullablePct)) cfg.nullablePct = Math.max(0, Math.min(100, Number(f.config.nullablePct)));
            return {
              name: String(f.name ?? "field").toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40) || "field",
              type,
              ...(Object.keys(cfg).length ? { config: cfg } : {}),
            };
          })
          .filter((f: any) => f.name.length > 0)
      : [];

    return {
      name: safeName,
      fields,
      notes: String(p.notes ?? "").slice(0, 400),
      usage,
    };
  });

// ---------- Saved schemas ----------

const SaveSchemaInput = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["tabular", "relational", "timeseries"]).default("tabular"),
  schema_json: z.record(z.string(), z.any()),
});

export type SavedSchema = {
  id: string;
  name: string;
  kind: string;
  schema_json: any;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

export const listSavedSchemas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedSchema[]> => {
    const { supabase, userId } = context as any;
    const { data, error } = await supabase
      .from("saved_schemas")
      .select("id, name, kind, schema_json, share_token, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedSchema[];
  });

export const saveSchema = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SaveSchemaInput.parse(input))
  .handler(async ({ data, context }): Promise<SavedSchema> => {
    const { supabase, userId } = context as any;
    const { data: row, error } = await supabase
      .from("saved_schemas")
      .insert({
        user_id: userId,
        name: data.name,
        kind: data.kind,
        schema_json: data.schema_json,
      })
      .select("id, name, kind, schema_json, share_token, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row as SavedSchema;
  });

export const deleteSavedSchema = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase
      .from("saved_schemas")
      .delete()
      .eq("user_id", userId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Time-series / event stream ----------

const TimeSeriesInput = z.object({
  entity: z.string().trim().max(40).default("user"),
  user_count: z.number().int().min(10).max(2000).default(200),
  days: z.number().int().min(1).max(180).default(30),
  events_per_user_max: z.number().int().min(1).max(50).default(8),
  event_types: z.array(z.string().trim().min(1).max(40)).min(2).max(10),
  funnel: z.boolean().default(true),
  seed: z.number().int().default(42),
});

export type TimeSeriesEvent = {
  event_id: string;
  user_id: number;
  event_type: string;
  occurred_at: string;
  session_id: string;
  properties: Record<string, any>;
};

export type TimeSeriesResult = {
  events: TimeSeriesEvent[];
  summary: {
    user_count: number;
    total_events: number;
    by_type: Record<string, number>;
    days: number;
  };
  usage: UsageSnapshot;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const generateTimeSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TimeSeriesInput.parse(input))
  .handler(async ({ data, context }): Promise<TimeSeriesResult> => {
    const { supabase, userId } = context as any;
    const r = mulberry32(data.seed);
    const events: TimeSeriesEvent[] = [];
    const byType: Record<string, number> = Object.fromEntries(data.event_types.map((t) => [t, 0]));
    const start = Date.now() - data.days * 86400_000;

    let eid = 1;
    for (let u = 1; u <= data.user_count; u++) {
      const sessionCount = Math.max(1, Math.floor(r() * data.events_per_user_max) + 1);
      for (let s = 0; s < sessionCount; s++) {
        const sessionId = `sess_${u}_${s}_${Math.floor(r() * 1e6)}`;
        const sessionStart = start + Math.floor(r() * data.days * 86400_000);
        // funnel: drop a fraction at each step
        let stepIdx = 0;
        for (const type of data.event_types) {
          if (data.funnel && stepIdx > 0 && r() > 0.7 - stepIdx * 0.08) break;
          const ts = sessionStart + stepIdx * Math.floor(r() * 5 * 60_000);
          events.push({
            event_id: `evt_${eid++}`,
            user_id: u,
            event_type: type,
            occurred_at: new Date(ts).toISOString(),
            session_id: sessionId,
            properties: {
              source: ["organic", "paid", "referral", "direct"][Math.floor(r() * 4)],
              device: ["desktop", "mobile", "tablet"][Math.floor(r() * 3)],
            },
          });
          byType[type] = (byType[type] ?? 0) + 1;
          stepIdx++;
        }
      }
      // hard cap to keep response size safe
      if (events.length > 50_000) break;
    }

    const usage = await recordSyntheticUsage(supabase, userId, 2, {
      mode: "timeseries",
      users: data.user_count,
      days: data.days,
      total: events.length,
    });

    return {
      events,
      summary: {
        user_count: data.user_count,
        total_events: events.length,
        by_type: byType,
        days: data.days,
      },
      usage,
    };
  });
