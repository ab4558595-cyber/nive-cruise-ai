import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  loadUsage,
  todayUtc,
  requireBusinessPlan,
  type UsageSnapshot,
} from "./businessUsage.functions";

// ---------- Shared helpers ----------

async function callApiFreeLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = process.env.APIFREELLM_API_KEY;
  if (!key) return "";
  try {
    const res = await fetch("https://apifreellm.com/api/v1/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `[SYSTEM]\n${systemPrompt}\n\n[USER]\n${userPrompt}` }),
    });
    if (!res.ok) {
      console.error("ApiFreeLLM failed:", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return "";
    }
    const data: any = await res.json();
    return (
      data?.response ?? data?.message ?? data?.content ?? data?.choices?.[0]?.message?.content ?? ""
    );
  } catch (e) {
    console.error("ApiFreeLLM threw:", e);
    return "";
  }
}

async function callOpenRouterFallback(
  systemPrompt: string,
  userPrompt: string,
  json: boolean,
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return "";
  const models = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
  ];
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nive-ai.co.in",
          "X-Title": "Nive AI Marketing",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          ...(json ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (!res.ok) {
        console.error(`OpenRouter ${model} failed:`, res.status, (await res.text().catch(() => "")).slice(0, 200));
        continue;
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content ?? "";
      if (content) return content;
    } catch (e) {
      console.error(`OpenRouter ${model} threw:`, e);
    }
  }
  return "";
}

const HF_PROXY_URL = "https://4idn-my-lovable-api.hf.space";

async function callHfProxy(
  systemPrompt: string,
  userPrompt: string,
  json: boolean,
): Promise<string> {
  try {
    const res = await fetch(`${HF_PROXY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      console.error("HF proxy failed:", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return "";
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      response?: string;
      content?: string;
      message?: string;
    };
    return (
      data.choices?.[0]?.message?.content ??
      data.response ??
      data.content ??
      data.message ??
      ""
    );
  } catch (e) {
    console.error("HF proxy threw:", e);
    return "";
  }
}

async function callOpenRouter(systemPrompt: string, userPrompt: string, json = true) {
  // For JSON-shaped tasks we skip the HF proxy entirely: its upstream is a
  // reasoning model that (a) times out (30s read limit) on response_format
  // json_object and (b) emits the answer in `reasoning_content` with an empty
  // `content`, so it can't serve our structured-output endpoints.
  // Order: Lovable AI Gateway → OpenRouter (free) → HF proxy (text only) → ApiFreeLLM.
  const apiKey = process.env.LOVABLE_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          ...(json ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content ?? "";
        if (content) return content;
        console.error("Lovable AI returned empty content, trying fallback.");
      } else {
        console.error("Lovable AI failed, trying fallback:", res.status, (await res.text().catch(() => "")).slice(0, 200));
      }
    } catch (e) {
      console.error("Lovable AI threw, trying fallback:", e);
    }
  }
  const or = await callOpenRouterFallback(systemPrompt, userPrompt, json);
  if (or) return or;
  if (!json) {
    const hf = await callHfProxy(systemPrompt, userPrompt, false);
    if (hf) return hf;
  }
  const fb = await callApiFreeLLM(systemPrompt, userPrompt);
  if (fb) return fb;
  throw new Error("All AI providers are unavailable right now. Please try again in a moment.");
}

function parseJsonLoose<T = any>(s: string): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error("Model returned invalid JSON");
  }
}

async function recordUsage(
  supabase: any,
  userId: string,
  cost: number,
  metadata: Record<string, any>,
): Promise<UsageSnapshot> {
  const planId = await requireBusinessPlan(supabase, userId);
  const current = await loadUsage(supabase, userId, "marketing", planId);
  if (current.used + cost > current.limit) {
    throw new Error(
      `Not enough marketing credits (need ${cost}, have ${current.remaining}/${current.limit}). Top up or wait until midnight UTC.`,
    );
  }
  const day = todayUtc();
  const nextCount = current.used + cost;
  const { error: upErr } = await supabase
    .from("business_tool_usage")
    .upsert(
      {
        user_id: userId,
        tool: "marketing",
        day,
        count: nextCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tool,day" },
    );
  if (upErr) throw new Error(upErr.message);

  await supabase.from("business_tool_events").insert({
    user_id: userId,
    tool: "marketing",
    credits: cost,
    metadata,
  });

  return {
    ...current,
    used: nextCount,
    remaining: Math.max(0, current.limit - nextCount),
  };
}

async function loadBrand(supabase: any, userId: string) {
  const { data } = await supabase
    .from("brand_profiles")
    .select("brand_name, voice, audience, usp, keywords, forbidden_words")
    .eq("user_id", userId)
    .maybeSingle();
  return data as null | {
    brand_name: string | null;
    voice: string | null;
    audience: string | null;
    usp: string | null;
    keywords: string[] | null;
    forbidden_words: string[] | null;
  };
}

function brandBlock(b: Awaited<ReturnType<typeof loadBrand>>): string {
  if (!b) return "";
  const lines: string[] = [];
  if (b.brand_name) lines.push(`Brand name: ${b.brand_name}`);
  if (b.voice) lines.push(`Brand voice: ${b.voice}`);
  if (b.audience) lines.push(`Default audience: ${b.audience}`);
  if (b.usp) lines.push(`Unique selling point: ${b.usp}`);
  if (b.keywords?.length) lines.push(`Preferred keywords: ${b.keywords.join(", ")}`);
  if (b.forbidden_words?.length) lines.push(`AVOID these words: ${b.forbidden_words.join(", ")}`);
  return lines.length ? `\n\nBRAND CONTEXT:\n${lines.join("\n")}\n` : "";
}

// ---------- 1. Quick copy (existing) ----------

const QuickInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  tone: z.enum([
    "professional", "friendly", "bold", "playful", "luxurious", "minimal", "urgent",
  ]),
  channel: z.enum(["ad", "email", "social", "landing"]),
});

export type MarketingResult = {
  headline: string;
  variants: string[];
  body: string;
  cta: string;
  channel: string;
  tone: string;
  usage: UsageSnapshot;
};

export const generateMarketing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => QuickInput.parse(input))
  .handler(async ({ data, context }): Promise<MarketingResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior brand copywriter. Output strictly valid JSON matching:
{ "headline": string, "variants": string[5], "body": string, "cta": string }
- headline: <=80 chars
- variants: 5 alternative headlines, each <=80 chars
- body: 2-4 short sentences suited to the channel
- cta: imperative call-to-action, <=5 words
Respect tone, channel, and brand context. JSON only.`;

    const user = `Product / service: ${data.product}
Target audience: ${data.audience || "broad consumer audience"}
Tone: ${data.tone}
Channel: ${data.channel}${brandBlock(brand)}

Return only the JSON object.`;

    const content = await callOpenRouter(system, user);
    const parsed = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 1, {
      mode: "quick", channel: data.channel, tone: data.tone,
    });

    return {
      headline: String(parsed.headline ?? "").slice(0, 120),
      variants: Array.isArray(parsed.variants)
        ? parsed.variants.slice(0, 5).map((v: any) => String(v).slice(0, 120))
        : [],
      body: String(parsed.body ?? "").slice(0, 1200),
      cta: String(parsed.cta ?? "Get started").slice(0, 40),
      channel: data.channel,
      tone: data.tone,
      usage,
    };
  });

// ---------- 2. Campaign pack ----------

const CampaignInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  tone: z.string().trim().max(40).default("professional"),
});

export type CampaignResult = {
  ad_headlines: string[];
  ad_bodies: string[];
  email_subjects: string[];
  email_body: string;
  twitter_post: string;
  linkedin_post: string;
  instagram_caption: string;
  instagram_hashtags: string[];
  landing: { h1: string; subhead: string; bullets: string[]; cta: string };
  usage: UsageSnapshot;
};

export const generateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CampaignInput.parse(input))
  .handler(async ({ data, context }): Promise<CampaignResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior brand campaign strategist. Output strictly valid JSON matching this schema:
{
  "ad_headlines": string[5],            // each <=40 chars
  "ad_bodies": string[3],               // each 80-130 chars (Google/Meta ad sized)
  "email_subjects": string[5],          // each <=55 chars
  "email_body": string,                 // 80-180 words plain text, friendly newsletter style
  "twitter_post": string,               // <=270 chars, no link
  "linkedin_post": string,              // 400-900 chars, 1 line breaks ok
  "instagram_caption": string,          // 150-300 chars
  "instagram_hashtags": string[8],      // each starts with #
  "landing": {
    "h1": string,                       // <=70 chars
    "subhead": string,                  // <=140 chars
    "bullets": string[3],               // each <=90 chars
    "cta": string                       // <=20 chars
  }
}
Match the tone and brand context exactly. JSON only, no markdown.`;

    const user = `Product / service: ${data.product}
Audience: ${data.audience || "broad consumer audience"}
Tone: ${data.tone}${brandBlock(brand)}`;

    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "campaign", tone: data.tone });

    const arr = (v: any, n: number, max: number) =>
      Array.isArray(v) ? v.slice(0, n).map((x: any) => String(x).slice(0, max)) : [];

    return {
      ad_headlines: arr(p.ad_headlines, 5, 60),
      ad_bodies: arr(p.ad_bodies, 3, 200),
      email_subjects: arr(p.email_subjects, 5, 80),
      email_body: String(p.email_body ?? "").slice(0, 2000),
      twitter_post: String(p.twitter_post ?? "").slice(0, 280),
      linkedin_post: String(p.linkedin_post ?? "").slice(0, 1500),
      instagram_caption: String(p.instagram_caption ?? "").slice(0, 400),
      instagram_hashtags: arr(p.instagram_hashtags, 8, 30),
      landing: {
        h1: String(p.landing?.h1 ?? "").slice(0, 100),
        subhead: String(p.landing?.subhead ?? "").slice(0, 200),
        bullets: arr(p.landing?.bullets, 3, 120),
        cta: String(p.landing?.cta ?? "Get started").slice(0, 30),
      },
      usage,
    };
  });

// ---------- 3. SEO blog ----------

const BlogInput = z.object({
  topic: z.string().trim().min(3).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  tone: z.string().trim().max(40).default("professional"),
  keywords: z.string().trim().max(200).optional().default(""),
});

export type BlogResult = {
  title: string;
  slug: string;
  meta_description: string;
  outline: string[];
  body_markdown: string;
  faqs: { q: string; a: string }[];
  internal_links: string[];
  usage: UsageSnapshot;
};

export const generateBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BlogInput.parse(input))
  .handler(async ({ data, context }): Promise<BlogResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior SEO content writer. Output strictly valid JSON matching:
{
  "title": string,                  // <=65 chars, includes primary keyword
  "slug": string,                   // lowercase, hyphenated, <=60 chars
  "meta_description": string,       // 140-155 chars
  "outline": string[],              // 5-8 H2/H3 headings
  "body_markdown": string,          // 700-1000 words, valid markdown with ## headings
  "faqs": [{"q": string, "a": string}, {"q": string, "a": string}, {"q": string, "a": string}],
  "internal_links": string[]        // 4-6 suggested anchor text phrases
}
Use natural keyword placement, scannable structure, short paragraphs. JSON only.`;

    const user = `Blog topic: ${data.topic}
Target audience: ${data.audience || "general readers"}
Tone: ${data.tone}
Target keywords (comma-separated): ${data.keywords || "natural keywords from the topic"}${brandBlock(brand)}`;

    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "blog" });

    return {
      title: String(p.title ?? "").slice(0, 120),
      slug: String(p.slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80),
      meta_description: String(p.meta_description ?? "").slice(0, 200),
      outline: Array.isArray(p.outline) ? p.outline.slice(0, 10).map((s: any) => String(s).slice(0, 120)) : [],
      body_markdown: String(p.body_markdown ?? "").slice(0, 20000),
      faqs: Array.isArray(p.faqs)
        ? p.faqs.slice(0, 5).map((f: any) => ({
            q: String(f.q ?? "").slice(0, 200),
            a: String(f.a ?? "").slice(0, 800),
          }))
        : [],
      internal_links: Array.isArray(p.internal_links)
        ? p.internal_links.slice(0, 8).map((s: any) => String(s).slice(0, 80))
        : [],
      usage,
    };
  });

// ---------- 4. Marketing strategy ----------

const StrategyInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  goal: z.string().trim().max(200).optional().default("acquire first 1000 customers"),
  budget: z.string().trim().max(80).optional().default("lean"),
});

export type StrategyResult = {
  positioning: string;
  segments: { name: string; description: string; pain: string }[];
  channels: { name: string; weekly_cadence: string; why: string }[];
  content_pillars: string[];
  kpis: { metric: string; target: string }[];
  week_plan: { week: number; focus: string; actions: string[] }[];
  usage: UsageSnapshot;
};

export const generateStrategy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => StrategyInput.parse(input))
  .handler(async ({ data, context }): Promise<StrategyResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior go-to-market strategist. Output strictly valid JSON:
{
  "positioning": string,                                                  // 1-2 sentences
  "segments": [{"name": string, "description": string, "pain": string}],  // exactly 3
  "channels": [{"name": string, "weekly_cadence": string, "why": string}],// 3-5 channels
  "content_pillars": string[],                                            // exactly 5
  "kpis": [{"metric": string, "target": string}],                         // 4-6 KPIs
  "week_plan": [
    {"week": 1, "focus": string, "actions": string[]},
    {"week": 2, "focus": string, "actions": string[]},
    {"week": 3, "focus": string, "actions": string[]},
    {"week": 4, "focus": string, "actions": string[]}
  ]
}
Be concrete and actionable. JSON only.`;

    const user = `Product: ${data.product}
Audience: ${data.audience || "broad consumer audience"}
30-day goal: ${data.goal}
Budget level: ${data.budget}${brandBlock(brand)}`;

    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 2, { mode: "strategy" });

    return {
      positioning: String(p.positioning ?? "").slice(0, 600),
      segments: Array.isArray(p.segments)
        ? p.segments.slice(0, 3).map((s: any) => ({
            name: String(s.name ?? "").slice(0, 80),
            description: String(s.description ?? "").slice(0, 300),
            pain: String(s.pain ?? "").slice(0, 300),
          }))
        : [],
      channels: Array.isArray(p.channels)
        ? p.channels.slice(0, 6).map((c: any) => ({
            name: String(c.name ?? "").slice(0, 60),
            weekly_cadence: String(c.weekly_cadence ?? "").slice(0, 100),
            why: String(c.why ?? "").slice(0, 200),
          }))
        : [],
      content_pillars: Array.isArray(p.content_pillars)
        ? p.content_pillars.slice(0, 6).map((s: any) => String(s).slice(0, 100))
        : [],
      kpis: Array.isArray(p.kpis)
        ? p.kpis.slice(0, 8).map((k: any) => ({
            metric: String(k.metric ?? "").slice(0, 80),
            target: String(k.target ?? "").slice(0, 80),
          }))
        : [],
      week_plan: Array.isArray(p.week_plan)
        ? p.week_plan.slice(0, 4).map((w: any, i: number) => ({
            week: Number(w.week) || i + 1,
            focus: String(w.focus ?? "").slice(0, 200),
            actions: Array.isArray(w.actions)
              ? w.actions.slice(0, 6).map((s: any) => String(s).slice(0, 200))
              : [],
          }))
        : [],
      usage,
    };
  });

// ---------- 5. Hero image + landing wireframe ----------

const HeroInput = z.object({
  product: z.string().trim().min(2).max(300),
  style: z.enum(["minimal", "vibrant", "luxury", "techy", "warm", "editorial"]).default("minimal"),
});

export type HeroWireframeResult = {
  image_base64: string | null;
  image_mime: string;
  image_error: string | null;
  wireframe: {
    hero: { h1: string; subhead: string; cta_primary: string; cta_secondary: string };
    social_proof: string;
    features: { title: string; body: string }[];
    pricing_teaser: string;
    faq: { q: string; a: string }[];
    footer_cta: string;
  };
  usage: UsageSnapshot;
};

async function generateImage(prompt: string): Promise<{ b64: string | null; mime: string; error: string | null }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { b64: null, mime: "image/png", error: "Image generation not configured" };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return { b64: null, mime: "image/png", error: `Image error ${res.status}` };
    const data = (await res.json()) as any;
    const images = data.choices?.[0]?.message?.images;
    const url = images?.[0]?.image_url?.url ?? "";
    if (url.startsWith("data:")) {
      const m = url.match(/^data:([^;]+);base64,(.+)$/);
      if (m) return { b64: m[2], mime: m[1], error: null };
    }
    return { b64: null, mime: "image/png", error: "No image returned" };
  } catch (e) {
    return { b64: null, mime: "image/png", error: e instanceof Error ? e.message : "Image failed" };
  }
}

export const generateHeroWireframe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => HeroInput.parse(input))
  .handler(async ({ data, context }): Promise<HeroWireframeResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior landing-page designer. Output strictly valid JSON:
{
  "hero": {"h1": string, "subhead": string, "cta_primary": string, "cta_secondary": string},
  "social_proof": string,
  "features": [{"title": string, "body": string}, ...],  // exactly 3
  "pricing_teaser": string,
  "faq": [{"q": string, "a": string}, ...],              // exactly 3
  "footer_cta": string
}
Keep copy tight and conversion-focused. JSON only.`;
    const user = `Product: ${data.product}
Visual style: ${data.style}${brandBlock(brand)}`;

    const [wireframeContent, image] = await Promise.all([
      callOpenRouter(system, user),
      generateImage(
        `Premium ${data.style} marketing hero image for: ${data.product}. ` +
          `Cinematic lighting, clean composition, web-hero aspect, no text overlay, photographic quality.`,
      ),
    ]);

    const w = parseJsonLoose<any>(wireframeContent);
    const usage = await recordUsage(supabase, userId, 2, { mode: "hero", style: data.style });

    return {
      image_base64: image.b64,
      image_mime: image.mime,
      image_error: image.error,
      wireframe: {
        hero: {
          h1: String(w.hero?.h1 ?? "").slice(0, 120),
          subhead: String(w.hero?.subhead ?? "").slice(0, 240),
          cta_primary: String(w.hero?.cta_primary ?? "Get started").slice(0, 30),
          cta_secondary: String(w.hero?.cta_secondary ?? "Learn more").slice(0, 30),
        },
        social_proof: String(w.social_proof ?? "").slice(0, 240),
        features: Array.isArray(w.features)
          ? w.features.slice(0, 3).map((f: any) => ({
              title: String(f.title ?? "").slice(0, 80),
              body: String(f.body ?? "").slice(0, 240),
            }))
          : [],
        pricing_teaser: String(w.pricing_teaser ?? "").slice(0, 200),
        faq: Array.isArray(w.faq)
          ? w.faq.slice(0, 3).map((f: any) => ({
              q: String(f.q ?? "").slice(0, 160),
              a: String(f.a ?? "").slice(0, 400),
            }))
          : [],
        footer_cta: String(w.footer_cta ?? "Start your free trial").slice(0, 80),
      },
      usage,
    };
  });

// ---------- Brand profile ----------

const BrandInput = z.object({
  brand_name: z.string().trim().max(100).optional().default(""),
  voice: z.string().trim().max(300).optional().default(""),
  audience: z.string().trim().max(300).optional().default(""),
  usp: z.string().trim().max(400).optional().default(""),
  keywords: z.array(z.string().trim().max(60)).max(20).optional().default([]),
  forbidden_words: z.array(z.string().trim().max(60)).max(20).optional().default([]),
});

export type BrandProfile = z.infer<typeof BrandInput>;

export const getBrandProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BrandProfile | null> => {
    const { supabase, userId } = context as any;
    const { data } = await supabase
      .from("brand_profiles")
      .select("brand_name, voice, audience, usp, keywords, forbidden_words")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      brand_name: data.brand_name ?? "",
      voice: data.voice ?? "",
      audience: data.audience ?? "",
      usp: data.usp ?? "",
      keywords: data.keywords ?? [],
      forbidden_words: data.forbidden_words ?? [],
    };
  });

export const saveBrandProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BrandInput.parse(input))
  .handler(async ({ data, context }): Promise<BrandProfile> => {
    const { supabase, userId } = context as any;
    const { error } = await supabase
      .from("brand_profiles")
      .upsert(
        {
          user_id: userId,
          brand_name: data.brand_name || null,
          voice: data.voice || null,
          audience: data.audience || null,
          usp: data.usp || null,
          keywords: data.keywords,
          forbidden_words: data.forbidden_words,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return data;
  });

// ============================================================
//  v2 expansion — Competitor research / Email drip / Ad pack / Landing HTML
// ============================================================

// ---------- 6. Competitor + SEO keyword research ----------

const CompetitorInput = z.object({
  competitor_url: z.string().trim().url("Enter a valid URL").max(500),
  niche: z.string().trim().min(2).max(200),
  audience: z.string().trim().max(200).optional().default(""),
});

export type CompetitorResult = {
  competitor_summary: string;
  strengths: string[];
  weaknesses: string[];
  positioning_gap: string;
  keyword_gaps: { keyword: string; intent: string; estimated_difficulty: "low" | "medium" | "high" }[];
  long_tail_ideas: { keyword: string; intent: string; angle: string }[];
  usage: UsageSnapshot;
};

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NiveAI/1.0 (+https://nive-ai.co.in)" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Page returned ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) {
      throw new Error("URL did not return HTML");
    }
    // Cap at 200KB to protect against huge pages.
    const raw = (await res.text()).slice(0, 200_000);
    // Strip scripts/styles/tags
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } finally {
    clearTimeout(t);
  }
}

export const generateCompetitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CompetitorInput.parse(input))
  .handler(async ({ data, context }): Promise<CompetitorResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    let pageText = "";
    let fetchError = "";
    try {
      pageText = await fetchPageText(data.competitor_url);
    } catch (e) {
      fetchError = e instanceof Error ? e.message : "Could not fetch page";
    }

    const system = `You are a senior SEO and competitive-research analyst. Output strictly valid JSON:
{
  "competitor_summary": string,                       // 2-3 sentences
  "strengths": string[3],
  "weaknesses": string[3],
  "positioning_gap": string,                          // 1-2 sentences
  "keyword_gaps": [
    {"keyword": string, "intent": "informational"|"commercial"|"transactional"|"navigational",
     "estimated_difficulty": "low"|"medium"|"high"}
  ],                                                  // exactly 5
  "long_tail_ideas": [
    {"keyword": string, "intent": "informational"|"commercial"|"transactional"|"navigational",
     "angle": string}
  ]                                                   // exactly 20
}
Base findings on the supplied page text when available. JSON only.`;

    const user = `Competitor URL: ${data.competitor_url}
Your niche: ${data.niche}
Your audience: ${data.audience || "general"}${brandBlock(brand)}

${pageText ? `Page content (cleaned, truncated):\n"""${pageText}"""` : `Could not load the page (${fetchError}). Use general knowledge about the URL's likely positioning.`}`;

    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "competitor", url: data.competitor_url });

    const arr = (v: any, n: number) => (Array.isArray(v) ? v.slice(0, n) : []);
    return {
      competitor_summary: String(p.competitor_summary ?? "").slice(0, 800),
      strengths: arr(p.strengths, 5).map((s: any) => String(s).slice(0, 200)),
      weaknesses: arr(p.weaknesses, 5).map((s: any) => String(s).slice(0, 200)),
      positioning_gap: String(p.positioning_gap ?? "").slice(0, 400),
      keyword_gaps: arr(p.keyword_gaps, 8).map((k: any) => ({
        keyword: String(k.keyword ?? "").slice(0, 100),
        intent: ["informational", "commercial", "transactional", "navigational"].includes(k.intent) ? k.intent : "informational",
        estimated_difficulty: ["low", "medium", "high"].includes(k.estimated_difficulty) ? k.estimated_difficulty : "medium",
      })),
      long_tail_ideas: arr(p.long_tail_ideas, 25).map((k: any) => ({
        keyword: String(k.keyword ?? "").slice(0, 120),
        intent: ["informational", "commercial", "transactional", "navigational"].includes(k.intent) ? k.intent : "informational",
        angle: String(k.angle ?? "").slice(0, 200),
      })),
      usage,
    };
  });

// ---------- 7. Email drip (5-step) ----------

const EmailDripInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  goal: z.enum(["onboarding", "reengagement", "launch", "nurture"]).default("onboarding"),
  tone: z.string().trim().max(40).default("friendly"),
});

export type EmailDripResult = {
  goal: string;
  emails: {
    step: number;
    send_day_offset: number;
    subject: string;
    preview_text: string;
    body_markdown: string;
    cta_label: string;
  }[];
  usage: UsageSnapshot;
};

export const generateEmailDrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => EmailDripInput.parse(input))
  .handler(async ({ data, context }): Promise<EmailDripResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior lifecycle email copywriter. Output strictly valid JSON:
{
  "emails": [
    {
      "step": number,                  // 1..5
      "send_day_offset": number,       // days from trigger (0 = same day)
      "subject": string,               // <=55 chars
      "preview_text": string,          // 40-90 chars
      "body_markdown": string,         // 90-200 words, conversational, single CTA
      "cta_label": string              // <=24 chars, imperative
    }
  ]                                    // EXACTLY 5 emails, ordered by step
}
Sequence pacing for goal:
- onboarding: 0, 1, 3, 7, 14
- reengagement: 0, 3, 7, 14, 28
- launch: -3, -1, 0, 1, 3
- nurture: 0, 7, 14, 21, 30
JSON only.`;

    const user = `Product / service: ${data.product}
Audience: ${data.audience || "general"}
Sequence goal: ${data.goal}
Tone: ${data.tone}${brandBlock(brand)}`;

    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "email_drip", goal: data.goal });

    const emails = Array.isArray(p.emails)
      ? p.emails.slice(0, 5).map((e: any, i: number) => ({
          step: Number(e.step) || i + 1,
          send_day_offset: Number(e.send_day_offset ?? i),
          subject: String(e.subject ?? "").slice(0, 80),
          preview_text: String(e.preview_text ?? "").slice(0, 150),
          body_markdown: String(e.body_markdown ?? "").slice(0, 3000),
          cta_label: String(e.cta_label ?? "Open").slice(0, 40),
        }))
      : [];

    return { goal: data.goal, emails, usage };
  });

// ---------- 8. Ad pack with platform specs ----------

const AdPackInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  offer: z.string().trim().max(200).optional().default(""),
  tone: z.string().trim().max(40).default("bold"),
});

type AdVariant = { id: string; text: string; chars: number; max: number; ok: boolean };

export type AdPackResult = {
  google: { headlines: AdVariant[]; descriptions: AdVariant[] };
  meta: { headlines: AdVariant[]; bodies: AdVariant[] };
  linkedin: { intro: AdVariant; headline: AdVariant };
  x: { posts: AdVariant[] };
  usage: UsageSnapshot;
};

function ad(text: string, max: number, id: string): AdVariant {
  const t = String(text ?? "").trim().slice(0, max + 50);
  return { id, text: t, chars: t.length, max, ok: t.length <= max && t.length > 0 };
}

export const generateAdPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AdPackInput.parse(input))
  .handler(async ({ data, context }): Promise<AdPackResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior performance-marketing copywriter. Output strictly valid JSON:
{
  "google_headlines": string[3],          // each <=30 chars
  "google_descriptions": string[2],       // each <=90 chars
  "meta_headlines": string[5],            // each <=40 chars
  "meta_bodies": string[5],               // each <=125 chars
  "linkedin_intro": string,               // <=150 chars
  "linkedin_headline": string,            // <=70 chars
  "x_posts": string[3]                    // each <=270 chars (leaves room for link)
}
Hard limits. JSON only.`;

    const user = `Product: ${data.product}
Audience: ${data.audience || "general"}
Offer / hook: ${data.offer || "none"}
Tone: ${data.tone}${brandBlock(brand)}`;

    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "ad_pack" });

    const arr = (v: any, n: number) => (Array.isArray(v) ? v.slice(0, n) : []);
    return {
      google: {
        headlines: arr(p.google_headlines, 3).map((t: any, i: number) => ad(t, 30, `g-h-${i + 1}`)),
        descriptions: arr(p.google_descriptions, 2).map((t: any, i: number) => ad(t, 90, `g-d-${i + 1}`)),
      },
      meta: {
        headlines: arr(p.meta_headlines, 5).map((t: any, i: number) => ad(t, 40, `m-h-${i + 1}`)),
        bodies: arr(p.meta_bodies, 5).map((t: any, i: number) => ad(t, 125, `m-b-${i + 1}`)),
      },
      linkedin: {
        intro: ad(p.linkedin_intro ?? "", 150, "li-intro"),
        headline: ad(p.linkedin_headline ?? "", 70, "li-headline"),
      },
      x: {
        posts: arr(p.x_posts, 3).map((t: any, i: number) => ad(t, 270, `x-${i + 1}`)),
      },
      usage,
    };
  });

// ---------- 9. Landing page → HTML export ----------

const LandingHtmlInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  style: z.enum(["minimal", "vibrant", "dark", "warm", "techy"]).default("minimal"),
  primary_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #635bff").default("#635bff"),
});

export type LandingHtmlResult = {
  html: string;
  sections: {
    hero: { h1: string; subhead: string; cta_primary: string; cta_secondary: string };
    features: { title: string; body: string }[];
    faq: { q: string; a: string }[];
    footer_note: string;
  };
  usage: UsageSnapshot;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLandingHtml(
  product: string,
  primaryColor: string,
  sections: LandingHtmlResult["sections"],
): string {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : "#635bff";
  const title = escapeHtml(sections.hero.h1 || product);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>:root{--brand:${safeColor};} body{font-family:Inter,system-ui,-apple-system,Sans-serif;}</style>
</head>
<body class="bg-white text-slate-900">
<header class="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
  <div class="font-bold text-lg">${escapeHtml(product).slice(0, 40)}</div>
  <a href="#cta" class="rounded-full px-4 py-2 text-white text-sm font-semibold" style="background:var(--brand);">${escapeHtml(sections.hero.cta_primary)}</a>
</header>
<section class="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
  <h1 class="text-4xl md:text-6xl font-bold tracking-tight">${escapeHtml(sections.hero.h1)}</h1>
  <p class="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">${escapeHtml(sections.hero.subhead)}</p>
  <div class="mt-8 flex justify-center gap-3">
    <a id="cta" href="#" class="rounded-full px-6 py-3 text-white text-base font-semibold" style="background:var(--brand);">${escapeHtml(sections.hero.cta_primary)}</a>
    <a href="#features" class="rounded-full px-6 py-3 text-base font-semibold ring-1 ring-slate-200">${escapeHtml(sections.hero.cta_secondary)}</a>
  </div>
</section>
<section id="features" class="bg-slate-50 border-y border-slate-200">
  <div class="max-w-6xl mx-auto px-6 py-20 grid gap-8 md:grid-cols-3">
    ${sections.features
      .map(
        (f) => `<div class="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <h3 class="text-lg font-semibold">${escapeHtml(f.title)}</h3>
      <p class="mt-2 text-sm text-slate-600 leading-relaxed">${escapeHtml(f.body)}</p>
    </div>`,
      )
      .join("\n    ")}
  </div>
</section>
<section class="max-w-3xl mx-auto px-6 py-20">
  <h2 class="text-3xl font-bold text-center">Frequently asked</h2>
  <div class="mt-10 space-y-4">
    ${sections.faq
      .map(
        (q) => `<details class="group rounded-xl bg-white ring-1 ring-slate-200 p-5">
      <summary class="flex justify-between cursor-pointer text-base font-semibold">${escapeHtml(q.q)}<span class="ml-4 text-slate-400 group-open:rotate-45 transition-transform">+</span></summary>
      <p class="mt-3 text-sm text-slate-600 leading-relaxed">${escapeHtml(q.a)}</p>
    </details>`,
      )
      .join("\n    ")}
  </div>
</section>
<section class="text-white" style="background:var(--brand);">
  <div class="max-w-5xl mx-auto px-6 py-16 text-center">
    <h2 class="text-3xl md:text-4xl font-bold">${escapeHtml(sections.hero.h1)}</h2>
    <a href="#" class="mt-6 inline-block rounded-full bg-white px-6 py-3 text-base font-semibold" style="color:var(--brand);">${escapeHtml(sections.hero.cta_primary)}</a>
  </div>
</section>
<footer class="max-w-6xl mx-auto px-6 py-10 text-center text-xs text-slate-500">
  ${escapeHtml(sections.footer_note)}
</footer>
</body>
</html>`;
}

export const generateLandingHtml = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => LandingHtmlInput.parse(input))
  .handler(async ({ data, context }): Promise<LandingHtmlResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior landing-page copywriter. Output strictly valid JSON:
{
  "hero": {"h1": string, "subhead": string, "cta_primary": string, "cta_secondary": string},
  "features": [{"title": string, "body": string}, ...],   // exactly 3
  "faq": [{"q": string, "a": string}, ...],               // exactly 4
  "footer_note": string                                   // short legal/footer line
}
JSON only.`;
    const user = `Product: ${data.product}
Audience: ${data.audience || "general"}
Style: ${data.style}${brandBlock(brand)}`;

    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "landing_html", style: data.style });

    const sections: LandingHtmlResult["sections"] = {
      hero: {
        h1: String(p.hero?.h1 ?? "").slice(0, 140),
        subhead: String(p.hero?.subhead ?? "").slice(0, 280),
        cta_primary: String(p.hero?.cta_primary ?? "Get started").slice(0, 30),
        cta_secondary: String(p.hero?.cta_secondary ?? "Learn more").slice(0, 30),
      },
      features: Array.isArray(p.features)
        ? p.features.slice(0, 3).map((f: any) => ({
            title: String(f.title ?? "").slice(0, 80),
            body: String(f.body ?? "").slice(0, 240),
          }))
        : [],
      faq: Array.isArray(p.faq)
        ? p.faq.slice(0, 4).map((f: any) => ({
            q: String(f.q ?? "").slice(0, 160),
            a: String(f.a ?? "").slice(0, 400),
          }))
        : [],
      footer_note: String(p.footer_note ?? `© ${new Date().getFullYear()} ${data.product}`).slice(0, 200),
    };

    return {
      html: buildLandingHtml(data.product, data.primary_color, sections),
      sections,
      usage,
    };
  });

// =====================================================================
// ====================== 10 NEW MODES (10–19) =========================
// =====================================================================

function clip(s: any, n: number) { return String(s ?? "").slice(0, n); }
function arrMap<T>(v: any, n: number, fn: (x: any, i: number) => T): T[] {
  return Array.isArray(v) ? v.slice(0, n).map(fn) : [];
}

// ---------- 10. Social Calendar (30-day) ----------

const SocialCalendarInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  platforms: z.array(z.enum(["instagram","linkedin","x","tiktok","facebook"])).min(1).max(5),
  tone: z.string().trim().max(40).default("friendly"),
});

export type SocialCalendarResult = {
  days: { day: number; date_offset: number; platform: string; hook: string; caption: string; hashtags: string[]; best_time: string; cta: string }[];
  usage: UsageSnapshot;
};

export const generateSocialCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SocialCalendarInput.parse(input))
  .handler(async ({ data, context }): Promise<SocialCalendarResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior social-media strategist. Output strictly valid JSON:
{ "days": [ {"day": 1..30, "date_offset": number, "platform": one of the chosen platforms, "hook": string (<=80 chars), "caption": string (60-280 chars), "hashtags": string[3..6], "best_time": e.g. "Tue 9:00 AM", "cta": string (<=24 chars) } ] }
Return EXACTLY 30 entries. Rotate across the chosen platforms. JSON only.`;
    const user = `Product: ${data.product}
Audience: ${data.audience || "general"}
Tone: ${data.tone}
Platforms: ${data.platforms.join(", ")}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "social_calendar" });
    return {
      days: arrMap(p.days, 30, (d: any, i: number) => ({
        day: Number(d.day) || i + 1,
        date_offset: Number(d.date_offset ?? i),
        platform: clip(d.platform, 20),
        hook: clip(d.hook, 100),
        caption: clip(d.caption, 320),
        hashtags: Array.isArray(d.hashtags) ? d.hashtags.slice(0, 8).map((h: any) => clip(h, 40)) : [],
        best_time: clip(d.best_time, 40),
        cta: clip(d.cta, 40),
      })),
      usage,
    };
  });

// ---------- 11. Video / Reels script ----------

const VideoScriptInput = z.object({
  topic: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  length: z.enum(["30s", "60s", "3min"]).default("60s"),
  tone: z.string().trim().max(40).default("energetic"),
});

export type VideoScriptResult = {
  length: string;
  hook: string;
  beats: { time: string; shot: string; voiceover: string; on_screen_text: string; b_roll: string }[];
  thumbnail_concept: string;
  cta: string;
  usage: UsageSnapshot;
};

export const generateVideoScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VideoScriptInput.parse(input))
  .handler(async ({ data, context }): Promise<VideoScriptResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const beatCount = data.length === "30s" ? 5 : data.length === "60s" ? 8 : 16;
    const system = `You are a senior short-form video writer. Output strictly valid JSON:
{ "hook": string (<=80 chars, first 2 seconds), "beats": [ {"time": "0:00-0:03", "shot": string, "voiceover": string, "on_screen_text": string (<=40 chars), "b_roll": string} ] (EXACTLY ${beatCount} beats covering the full duration), "thumbnail_concept": string, "cta": string (<=24 chars) }
JSON only.`;
    const user = `Topic: ${data.topic}
Audience: ${data.audience || "general"}
Length: ${data.length}
Tone: ${data.tone}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 2, { mode: "video_script", length: data.length });
    return {
      length: data.length,
      hook: clip(p.hook, 120),
      beats: arrMap(p.beats, beatCount, (b: any) => ({
        time: clip(b.time, 20),
        shot: clip(b.shot, 200),
        voiceover: clip(b.voiceover, 400),
        on_screen_text: clip(b.on_screen_text, 60),
        b_roll: clip(b.b_roll, 200),
      })),
      thumbnail_concept: clip(p.thumbnail_concept, 300),
      cta: clip(p.cta, 40),
      usage,
    };
  });

// ---------- 12. Press release ----------

const PressReleaseInput = z.object({
  company: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional().default(""),
  announcement: z.string().trim().min(5).max(500),
  spokesperson: z.string().trim().max(120).optional().default(""),
  spokesperson_title: z.string().trim().max(120).optional().default(""),
  contact_email: z.string().trim().max(120).optional().default(""),
});

export type PressReleaseResult = {
  headline: string;
  subhead: string;
  dateline: string;
  body_paragraphs: string[];
  quote: { text: string; attribution: string };
  boilerplate: string;
  contact_block: string;
  html: string;
  usage: UsageSnapshot;
};

export const generatePressRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PressReleaseInput.parse(input))
  .handler(async ({ data, context }): Promise<PressReleaseResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const system = `You are a senior PR writer. Write a press release in AP style. Output strictly valid JSON:
{ "headline": string (<=100 chars, title case), "subhead": string (<=160 chars), "body_paragraphs": string[4..6] (inverted pyramid, 5W1H in first paragraph), "quote_text": string (1-3 sentences), "boilerplate": string (1-2 sentences "About <company>") }
JSON only.`;
    const user = `Company: ${data.company}
Announcement: ${data.announcement}
Spokesperson: ${data.spokesperson || "CEO"} (${data.spokesperson_title || "Chief Executive"})${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 2, { mode: "press_release" });
    const dateline = `${(data.city || "REMOTE").toUpperCase()} — ${today}`;
    const headline = clip(p.headline, 140);
    const subhead = clip(p.subhead, 200);
    const body = arrMap(p.body_paragraphs, 6, (s: any) => clip(s, 800));
    const quoteText = clip(p.quote_text, 500);
    const attribution = `${data.spokesperson || "Spokesperson"}, ${data.spokesperson_title || "Company representative"}`;
    const boilerplate = clip(p.boilerplate, 500);
    const contactBlock = data.contact_email ? `Media contact: ${data.contact_email}` : "";
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(headline)}</title>
<style>body{font:15px/1.6 Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#222}h1{font-size:26px;line-height:1.2}h2{font-size:17px;color:#444;font-weight:normal;font-style:italic}.dateline{font-weight:bold}.quote{border-left:3px solid #635bff;padding-left:14px;margin:18px 0;font-style:italic;color:#333}.b{margin-top:30px;padding-top:18px;border-top:1px solid #ddd;color:#555;font-size:14px}</style></head><body>
<p style="text-transform:uppercase;letter-spacing:.1em;font-size:11px;color:#888">FOR IMMEDIATE RELEASE</p>
<h1>${escapeHtml(headline)}</h1>
<h2>${escapeHtml(subhead)}</h2>
<p><span class="dateline">${escapeHtml(dateline)}</span> — ${escapeHtml(body[0] || "")}</p>
${body.slice(1, -1).map((b) => `<p>${escapeHtml(b)}</p>`).join("\n")}
<div class="quote">"${escapeHtml(quoteText)}"<br/><small>— ${escapeHtml(attribution)}</small></div>
${body.length > 1 ? `<p>${escapeHtml(body[body.length - 1])}</p>` : ""}
<div class="b"><strong>About ${escapeHtml(data.company)}</strong><br/>${escapeHtml(boilerplate)}${contactBlock ? `<br/><br/>${escapeHtml(contactBlock)}` : ""}</div>
<p style="text-align:center;color:#999;margin-top:30px">###</p>
</body></html>`;
    return {
      headline, subhead, dateline, body_paragraphs: body,
      quote: { text: quoteText, attribution },
      boilerplate, contact_block: contactBlock, html, usage,
    };
  });

// ---------- 13. Cold outreach (email + LinkedIn) ----------

const ColdOutreachInput = z.object({
  product: z.string().trim().min(2).max(300),
  target_persona: z.string().trim().min(2).max(200),
  value_prop: z.string().trim().min(2).max(300),
  sender_name: z.string().trim().max(120).optional().default(""),
});

export type ColdOutreachResult = {
  emails: { variant: string; subject: string; body: string }[];
  follow_ups: { day_offset: number; subject: string; body: string }[];
  linkedin: { connection_note: string; first_message: string; follow_up: string };
  usage: UsageSnapshot;
};

export const generateColdOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ColdOutreachInput.parse(input))
  .handler(async ({ data, context }): Promise<ColdOutreachResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior B2B SDR copywriter. Output strictly valid JSON:
{
  "emails": [
    {"variant": "A: pain-led" | "B: social-proof" | "C: question-led", "subject": string (<=50 chars, no spam-triggers), "body": string (60-130 words, single CTA, personalized opener placeholder {{first_name}})}
  ] (exactly 3),
  "follow_ups": [
    {"day_offset": 3, "subject": string, "body": string (40-80 words)},
    {"day_offset": 7, "subject": string, "body": string (40-80 words)}
  ],
  "linkedin": { "connection_note": string (<=300 chars), "first_message": string (<=600 chars), "follow_up": string (<=400 chars) }
}
JSON only.`;
    const user = `Product: ${data.product}
Target persona: ${data.target_persona}
Value prop: ${data.value_prop}
Sender: ${data.sender_name || "Sales rep"}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "cold_outreach" });
    return {
      emails: arrMap(p.emails, 3, (e: any) => ({
        variant: clip(e.variant, 40),
        subject: clip(e.subject, 80),
        body: clip(e.body, 2000),
      })),
      follow_ups: arrMap(p.follow_ups, 2, (e: any, i: number) => ({
        day_offset: Number(e.day_offset) || (i === 0 ? 3 : 7),
        subject: clip(e.subject, 80),
        body: clip(e.body, 1500),
      })),
      linkedin: {
        connection_note: clip(p.linkedin?.connection_note, 320),
        first_message: clip(p.linkedin?.first_message, 700),
        follow_up: clip(p.linkedin?.follow_up, 500),
      },
      usage,
    };
  });

// ---------- 14. Brand voice guidelines ----------

const BrandVoiceInput = z.object({
  sample_or_description: z.string().trim().min(10).max(2000),
});

export type BrandVoiceResult = {
  voice_summary: string;
  attributes: string[];
  do_words: string[];
  dont_words: string[];
  sample_rewrites: { before: string; after: string }[];
  style_guide_markdown: string;
  usage: UsageSnapshot;
};

export const generateBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BrandVoiceInput.parse(input))
  .handler(async ({ data, context }): Promise<BrandVoiceResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior brand strategist. Output strictly valid JSON:
{
  "voice_summary": string (2-3 sentences),
  "attributes": string[5] (e.g. "Warm", "Direct"),
  "do_words": string[10],
  "dont_words": string[10],
  "sample_rewrites": [ {"before": string, "after": string} ] (exactly 3),
  "style_guide_markdown": string (a 300-500 word one-page style guide in Markdown)
}
JSON only.`;
    const user = `Sample text or brand description:
"""${data.sample_or_description}"""${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 2, { mode: "brand_voice" });
    return {
      voice_summary: clip(p.voice_summary, 600),
      attributes: arrMap(p.attributes, 6, (s: any) => clip(s, 40)),
      do_words: arrMap(p.do_words, 15, (s: any) => clip(s, 40)),
      dont_words: arrMap(p.dont_words, 15, (s: any) => clip(s, 40)),
      sample_rewrites: arrMap(p.sample_rewrites, 4, (r: any) => ({ before: clip(r.before, 400), after: clip(r.after, 400) })),
      style_guide_markdown: clip(p.style_guide_markdown, 6000),
      usage,
    };
  });

// ---------- 15. Personas ----------

const PersonasInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience_hint: z.string().trim().max(300).optional().default(""),
});

export type PersonasResult = {
  personas: {
    name: string; role: string; age_range: string;
    demographics: string;
    jobs_to_be_done: string[];
    pains: string[]; gains: string[];
    channels: string[]; objections: string[];
    quote: string;
  }[];
  usage: UsageSnapshot;
};

export const generatePersonas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PersonasInput.parse(input))
  .handler(async ({ data, context }): Promise<PersonasResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior product researcher. Output strictly valid JSON:
{ "personas": [ {"name": string, "role": string, "age_range": string, "demographics": string, "jobs_to_be_done": string[3], "pains": string[3], "gains": string[3], "channels": string[4], "objections": string[3], "quote": string} ] (exactly 3 distinct personas) }
JSON only.`;
    const user = `Product: ${data.product}
Audience hint: ${data.audience_hint || "infer from product"}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 2, { mode: "personas" });
    return {
      personas: arrMap(p.personas, 3, (x: any) => ({
        name: clip(x.name, 80),
        role: clip(x.role, 120),
        age_range: clip(x.age_range, 40),
        demographics: clip(x.demographics, 400),
        jobs_to_be_done: arrMap(x.jobs_to_be_done, 5, (s: any) => clip(s, 200)),
        pains: arrMap(x.pains, 5, (s: any) => clip(s, 200)),
        gains: arrMap(x.gains, 5, (s: any) => clip(s, 200)),
        channels: arrMap(x.channels, 6, (s: any) => clip(s, 80)),
        objections: arrMap(x.objections, 5, (s: any) => clip(s, 200)),
        quote: clip(x.quote, 300),
      })),
      usage,
    };
  });

// ---------- 16. A/B variants ----------

const ABVariantsInput = z.object({
  original: z.string().trim().min(2).max(500),
  asset_type: z.enum(["headline", "ad", "subject_line", "cta", "tagline"]),
  audience: z.string().trim().max(200).optional().default(""),
});

export type ABVariantsResult = {
  variants: { rank: number; text: string; angle: string; rationale: string }[];
  hypothesis: string;
  usage: UsageSnapshot;
};

export const generateABVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ABVariantsInput.parse(input))
  .handler(async ({ data, context }): Promise<ABVariantsResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior CRO copywriter. Output strictly valid JSON:
{ "variants": [ {"rank": 1..8, "text": string (same asset type as input, respecting its natural length), "angle": one of "benefit"|"curiosity"|"urgency"|"social-proof"|"contrarian"|"specificity"|"question"|"loss-aversion", "rationale": string (1 sentence)} ] (exactly 8, ranked best-to-worst), "hypothesis": string (1-2 sentences: which variant should win and why) }
JSON only.`;
    const user = `Asset type: ${data.asset_type}
Original: "${data.original}"
Audience: ${data.audience || "general"}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 1, { mode: "ab_variants", asset_type: data.asset_type });
    return {
      variants: arrMap(p.variants, 8, (v: any, i: number) => ({
        rank: Number(v.rank) || i + 1,
        text: clip(v.text, 400),
        angle: clip(v.angle, 40),
        rationale: clip(v.rationale, 300),
      })),
      hypothesis: clip(p.hypothesis, 500),
      usage,
    };
  });

// ---------- 17. SEO meta pack ----------

const SeoMetaInput = z.object({
  topic_or_url: z.string().trim().min(2).max(400),
  primary_keyword: z.string().trim().max(80).optional().default(""),
  audience: z.string().trim().max(200).optional().default(""),
});

export type SeoMetaResult = {
  titles: { text: string; chars: number; ok: boolean }[];
  descriptions: { text: string; chars: number; ok: boolean }[];
  open_graph: { title: string; description: string; type: string; image_alt: string };
  twitter_card: { card: string; title: string; description: string };
  json_ld: string;
  usage: UsageSnapshot;
};

export const generateSeoMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SeoMetaInput.parse(input))
  .handler(async ({ data, context }): Promise<SeoMetaResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior SEO specialist. Output strictly valid JSON:
{
  "titles": string[10] (each <=60 chars, primary keyword near the front when possible),
  "descriptions": string[10] (each 140-160 chars, benefit-led, end with CTA),
  "og": {"title": string (<=70 chars), "description": string (<=200 chars), "type": "website"|"article", "image_alt": string},
  "twitter": {"card": "summary_large_image"|"summary", "title": string (<=70 chars), "description": string (<=200 chars)},
  "json_ld_type": "Article"|"Product"|"FAQPage"|"Organization",
  "json_ld_payload": object (matching the chosen type, schema.org-compliant)
}
JSON only.`;
    const user = `Topic / URL: ${data.topic_or_url}
Primary keyword: ${data.primary_keyword || "infer"}
Audience: ${data.audience || "general"}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 2, { mode: "seo_meta" });
    const titles = arrMap(p.titles, 10, (t: any) => {
      const tt = clip(t, 80); return { text: tt, chars: tt.length, ok: tt.length > 0 && tt.length <= 60 };
    });
    const descriptions = arrMap(p.descriptions, 10, (t: any) => {
      const tt = clip(t, 200); return { text: tt, chars: tt.length, ok: tt.length >= 120 && tt.length <= 160 };
    });
    const jsonLdObj = {
      "@context": "https://schema.org",
      "@type": clip(p.json_ld_type, 40) || "Article",
      ...(typeof p.json_ld_payload === "object" && p.json_ld_payload !== null ? p.json_ld_payload : {}),
    };
    return {
      titles, descriptions,
      open_graph: {
        title: clip(p.og?.title, 100),
        description: clip(p.og?.description, 240),
        type: clip(p.og?.type, 20) || "website",
        image_alt: clip(p.og?.image_alt, 200),
      },
      twitter_card: {
        card: clip(p.twitter?.card, 40) || "summary_large_image",
        title: clip(p.twitter?.title, 100),
        description: clip(p.twitter?.description, 240),
      },
      json_ld: JSON.stringify(jsonLdObj, null, 2),
      usage,
    };
  });

// ---------- 18. Pricing page copy ----------

const PricingCopyInput = z.object({
  product: z.string().trim().min(2).max(300),
  audience: z.string().trim().max(200).optional().default(""),
  currency: z.string().trim().max(8).default("USD"),
  positioning: z.enum(["value", "premium", "freemium", "enterprise"]).default("value"),
});

export type PricingCopyResult = {
  intro_headline: string;
  intro_subhead: string;
  tiers: {
    name: string; tagline: string; price_monthly: string; price_annual: string;
    badge: string | null; cta: string;
    features: string[];
  }[];
  feature_matrix: { feature: string; tiers: boolean[] }[];
  faq: { q: string; a: string }[];
  usage: UsageSnapshot;
};

export const generatePricingCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PricingCopyInput.parse(input))
  .handler(async ({ data, context }): Promise<PricingCopyResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior pricing-page copywriter. Output strictly valid JSON:
{
  "intro_headline": string (<=80 chars),
  "intro_subhead": string (<=160 chars),
  "tiers": [ {"name": string, "tagline": string (<=80 chars), "price_monthly": string (e.g. "$19"), "price_annual": string (e.g. "$190 / yr"), "badge": "Most popular" | null, "cta": string (<=24 chars), "features": string[5..7]} ] (exactly 3, mark the middle tier "Most popular"),
  "feature_matrix": [ {"feature": string, "tiers": boolean[3]} ] (8 rows summarising what's included per tier),
  "faq": [{"q": string, "a": string}] (exactly 5)
}
Currency: ${data.currency}. Positioning: ${data.positioning}. JSON only.`;
    const user = `Product: ${data.product}
Audience: ${data.audience || "general"}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 2, { mode: "pricing_copy" });
    return {
      intro_headline: clip(p.intro_headline, 120),
      intro_subhead: clip(p.intro_subhead, 240),
      tiers: arrMap(p.tiers, 3, (t: any) => ({
        name: clip(t.name, 40),
        tagline: clip(t.tagline, 120),
        price_monthly: clip(t.price_monthly, 30),
        price_annual: clip(t.price_annual, 40),
        badge: t.badge ? clip(t.badge, 40) : null,
        cta: clip(t.cta, 40),
        features: arrMap(t.features, 10, (f: any) => clip(f, 200)),
      })),
      feature_matrix: arrMap(p.feature_matrix, 12, (row: any) => ({
        feature: clip(row.feature, 200),
        tiers: Array.isArray(row.tiers) ? row.tiers.slice(0, 3).map((b: any) => Boolean(b)) : [false, false, false],
      })),
      faq: arrMap(p.faq, 6, (f: any) => ({ q: clip(f.q, 200), a: clip(f.a, 500) })),
      usage,
    };
  });

// ---------- 19. Case study ----------

const CaseStudyInput = z.object({
  customer: z.string().trim().min(1).max(120),
  industry: z.string().trim().max(120).optional().default(""),
  product: z.string().trim().min(2).max(300),
  outcomes: z.string().trim().min(5).max(1000), // free text bullets
});

export type CaseStudyResult = {
  title: string;
  subtitle: string;
  hero_metric: { value: string; label: string };
  sections: { heading: string; body: string }[]; // Challenge, Solution, Results, What's next
  pull_quote: { text: string; attribution: string };
  metrics: { value: string; label: string }[];
  cta: string;
  markdown: string;
  usage: UsageSnapshot;
};

export const generateCaseStudy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CaseStudyInput.parse(input))
  .handler(async ({ data, context }): Promise<CaseStudyResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `You are a senior B2B case-study writer. Output strictly valid JSON:
{
  "title": string (<=100 chars, includes customer name),
  "subtitle": string (<=160 chars, one-line outcome),
  "hero_metric": {"value": string (e.g. "3.2x"), "label": string (<=60 chars)},
  "sections": [
    {"heading": "Challenge", "body": string (90-160 words)},
    {"heading": "Solution", "body": string (90-160 words)},
    {"heading": "Results", "body": string (90-160 words, cite specific numbers)},
    {"heading": "What's next", "body": string (40-90 words)}
  ],
  "pull_quote": {"text": string (1-2 sentences), "attribution": string (Name, Title)},
  "metrics": [{"value": string, "label": string}] (exactly 3, scannable),
  "cta": string (<=40 chars)
}
JSON only.`;
    const user = `Customer: ${data.customer}
Industry: ${data.industry || "unspecified"}
Product / service used: ${data.product}
Outcomes / wins (free text):
${data.outcomes}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user);
    const p = parseJsonLoose<any>(content);
    const usage = await recordUsage(supabase, userId, 3, { mode: "case_study" });
    const sections = arrMap(p.sections, 4, (s: any) => ({ heading: clip(s.heading, 60), body: clip(s.body, 2000) }));
    const metrics = arrMap(p.metrics, 4, (m: any) => ({ value: clip(m.value, 30), label: clip(m.label, 80) }));
    const pull = { text: clip(p.pull_quote?.text, 400), attribution: clip(p.pull_quote?.attribution, 160) };
    const markdown = `# ${clip(p.title, 200)}\n\n_${clip(p.subtitle, 240)}_\n\n**${clip(p.hero_metric?.value, 30)}** — ${clip(p.hero_metric?.label, 100)}\n\n${sections.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n")}\n\n> "${pull.text}"\n> — ${pull.attribution}\n\n### Highlights\n${metrics.map((m) => `- **${m.value}** ${m.label}`).join("\n")}\n\n**${clip(p.cta, 60)}**\n`;
    return {
      title: clip(p.title, 200),
      subtitle: clip(p.subtitle, 240),
      hero_metric: { value: clip(p.hero_metric?.value, 30), label: clip(p.hero_metric?.label, 100) },
      sections,
      pull_quote: pull,
      metrics,
      cta: clip(p.cta, 60),
      markdown,
      usage,
    };
  });

// ---------- 20. Generic markdown tools (taglines, names, threads, etc.) ----------

export const MARKETING_TOOL_KEYS = [
  "tagline", "slogan", "naming", "domain", "valueprop",
  "journey", "webinar", "podcast", "influencer", "thread",
  "carousel", "youtube", "tiktok", "objections", "promo",
  "referral", "survey", "faq", "affiliate", "event",
] as const;
export type MarketingToolKey = (typeof MARKETING_TOOL_KEYS)[number];

const TOOL_SYSTEM: Record<MarketingToolKey, string> = {
  tagline: "You are a senior brand copywriter. Produce 12 distinctive taglines (<=8 words each) for the product. Group as: Bold, Friendly, Minimal, Witty. Markdown with H3 per group + bullets.",
  slogan: "You are a brand strategist. Produce 10 memorable slogans with a 1-line rationale each. Markdown bullets.",
  naming: "You are a naming consultant. Produce 15 brand/product name ideas grouped: Invented, Descriptive, Evocative, Compound. For each, give the name + a 1-line meaning. Markdown.",
  domain: "You are a domain naming expert. Suggest 15 available-sounding .com domains plus 5 alternatives on .ai, .io, .co. Mark each with short rationale. Markdown bullets.",
  valueprop: "You are a positioning strategist. Output a value proposition canvas in markdown: Customer Jobs, Pains, Gains, Products & Services, Pain Relievers, Gain Creators. Use bullets under H3 headings.",
  journey: "You are a CX strategist. Produce a 5-stage customer journey map (Awareness, Consideration, Decision, Onboarding, Advocacy). For each: Actions, Touchpoints, Emotions, Opportunities. Markdown.",
  webinar: "You are an event marketer. Produce a webinar promo pack in markdown: Title, Subtitle, 3 learning outcomes, 2 email invites (subject + body), 1 LinkedIn post, 1 Twitter post, 1 reminder email.",
  podcast: "You are a PR specialist. Write 3 podcast pitch emails: (1) cold pitch, (2) follow-up, (3) post-recording thank-you. Each with subject + body. Markdown.",
  influencer: "You are a partnerships lead. Write 3 influencer outreach DMs (Instagram, TikTok, LinkedIn), each <=120 words, plus a 1-page collab brief. Markdown.",
  thread: "You are a viral Twitter/X writer. Produce one 9-tweet thread with strong hook, body tweets numbered 1/ to 8/, and a CTA tweet. Each tweet <=270 chars. Markdown.",
  carousel: "You are a LinkedIn carousel designer. Produce a 10-slide carousel script. For each slide: Slide N — Headline + 1-2 line body. End with a CTA slide. Markdown.",
  youtube: "You are a YouTube growth expert. Produce: 5 click-worthy titles, 1 SEO description (~200 words with timestamps placeholders), 20 tags, 3 pinned-comment ideas. Markdown.",
  tiktok: "You are a short-form video writer. Produce 8 TikTok/Reels scripts of 15-30s each: HOOK (3s) / BODY / CTA, plus on-screen text and 5 trending hashtags per script. Markdown.",
  objections: "You are a sales enablement coach. List the 8 most common buyer objections for this product, and for each give a concise rebuttal (2-3 sentences) and a follow-up question. Markdown.",
  promo: "You are a promo copywriter. Produce a discount/promo announcement pack: 1 hero headline, 3 banner variants, 1 email (subject+body), 1 SMS (<=160 chars), 1 social post, 1 urgency line. Markdown.",
  referral: "You are a growth marketer. Produce referral-program copy: program name, 1 hero headline, 3-bullet how-it-works, 1 referrer email, 1 referred-friend email, 1 social share template. Markdown.",
  survey: "You are a research lead. Produce a customer survey: 1 intro paragraph, 1 NPS question, 3 CSAT questions, 5 open-ended discovery questions, 2 demographic questions. Markdown.",
  faq: "You are a website copywriter. Write 12 high-converting FAQs covering pricing, refunds, security, onboarding, support, integrations, and objections. Question + 2-4 sentence answer. Markdown.",
  affiliate: "You are an affiliate program manager. Produce affiliate-program copy: program pitch (150 words), commission structure suggestions (3 tiers), 1 recruiter email, 1 welcome email, 5 swipe-file social posts affiliates can reuse. Markdown.",
  event: "You are an event marketer. Produce event invitation copy: 1 hero invite (date/venue placeholders), 2 email invites (save-the-date + RSVP reminder), 1 LinkedIn post, 1 Twitter post, 1 calendar event description. Markdown.",
};

const MarketingToolInput = z.object({
  tool: z.enum(MARKETING_TOOL_KEYS),
  product: z.string().trim().min(2).max(400),
  audience: z.string().trim().max(200).optional().default(""),
  extra: z.string().trim().max(800).optional().default(""),
});

export type MarketingToolResult = { tool: MarketingToolKey; markdown: string; usage: UsageSnapshot };

export const generateMarketingTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => MarketingToolInput.parse(input))
  .handler(async ({ data, context }): Promise<MarketingToolResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);
    const system = `${TOOL_SYSTEM[data.tool]}\n\nReturn clean markdown only (no JSON, no code fences around the whole answer). Keep it tight, scannable, and on-brand.`;
    const user = `Product / service: ${data.product}
Audience: ${data.audience || "general"}
Extra context: ${data.extra || "(none)"}${brandBlock(brand)}`;
    const content = await callOpenRouter(system, user, false);
    const usage = await recordUsage(supabase, userId, 2, { mode: `tool:${data.tool}` });
    return { tool: data.tool, markdown: clip(content, 12000), usage };
  });

// ============================================================
//  Mega Pack — one prompt → entire marketing system
// ============================================================

const MegaPackInput = z.object({
  product: z.string().trim().min(2).max(400),
  audience: z.string().trim().max(200).optional().default(""),
  goal: z.string().trim().max(200).optional().default("acquire first 1000 customers"),
  budget: z.enum(["bootstrapped", "lean", "funded", "enterprise"]).optional().default("lean"),
  region: z.string().trim().max(80).optional().default("global"),
});

export type MegaPackResult = {
  brief: { product: string; audience: string; goal: string; budget: string; region: string };
  positioning: string;
  brand_voice: { adjectives: string[]; do: string[]; dont: string[]; sample_paragraph: string };
  personas: { name: string; role: string; goals: string[]; pains: string[]; channels: string[] }[];
  channel_mix: { name: string; weekly_cadence: string; why: string }[];
  ads: { platform: string; headline: string; primary_text: string; cta: string }[];
  email_drip: { day: number; subject: string; preview: string; body: string }[];
  social_calendar: { day: number; platform: string; hook: string; body: string; hashtags: string[] }[];
  seo: { primary_keywords: string[]; meta_title: string; meta_description: string; faqs: { q: string; a: string }[] };
  landing_copy: { hero: string; subhero: string; bullets: string[]; cta: string; testimonial_template: string };
  thirty_day_plan: { week: number; focus: string; actions: string[] }[];
  kpis: { metric: string; target: string }[];
  usage: UsageSnapshot;
};

function megaPackMarkdown(p: MegaPackResult): string {
  const lines: string[] = [];
  lines.push(`# Marketing Mega Pack — ${p.brief.product}`);
  lines.push(`\n_Audience: ${p.brief.audience || "general"} · Goal: ${p.brief.goal} · Budget: ${p.brief.budget} · Region: ${p.brief.region}_\n`);
  lines.push(`## Positioning\n${p.positioning}\n`);
  lines.push(`## Brand voice`);
  lines.push(`**Adjectives:** ${p.brand_voice.adjectives.join(", ")}`);
  lines.push(`\n**Do:**\n${p.brand_voice.do.map(d => `- ${d}`).join("\n")}`);
  lines.push(`\n**Don't:**\n${p.brand_voice.dont.map(d => `- ${d}`).join("\n")}`);
  lines.push(`\n**Sample:**\n> ${p.brand_voice.sample_paragraph}\n`);
  lines.push(`## Personas`);
  for (const x of p.personas) {
    lines.push(`### ${x.name} — ${x.role}`);
    lines.push(`- Goals: ${x.goals.join("; ")}`);
    lines.push(`- Pains: ${x.pains.join("; ")}`);
    lines.push(`- Channels: ${x.channels.join(", ")}\n`);
  }
  lines.push(`## Channel mix`);
  for (const c of p.channel_mix) lines.push(`- **${c.name}** (${c.weekly_cadence}) — ${c.why}`);
  lines.push(`\n## Ads`);
  for (const a of p.ads) lines.push(`### ${a.platform}\n**${a.headline}**\n\n${a.primary_text}\n\n_CTA:_ ${a.cta}\n`);
  lines.push(`## Email drip`);
  for (const e of p.email_drip) lines.push(`### Day ${e.day} — ${e.subject}\n_Preview:_ ${e.preview}\n\n${e.body}\n`);
  lines.push(`## Social calendar`);
  for (const s of p.social_calendar) lines.push(`- **Day ${s.day} · ${s.platform}** — *${s.hook}* — ${s.body} ${s.hashtags.map(h => `#${h.replace(/^#/, "")}`).join(" ")}`);
  lines.push(`\n## SEO\n**Primary keywords:** ${p.seo.primary_keywords.join(", ")}\n\n**Meta title:** ${p.seo.meta_title}\n\n**Meta description:** ${p.seo.meta_description}\n`);
  lines.push(`### FAQs`);
  for (const f of p.seo.faqs) lines.push(`**Q:** ${f.q}\n\n**A:** ${f.a}\n`);
  lines.push(`## Landing page copy\n**Hero:** ${p.landing_copy.hero}\n\n**Subhero:** ${p.landing_copy.subhero}\n\n**Bullets:**\n${p.landing_copy.bullets.map(b => `- ${b}`).join("\n")}\n\n**CTA:** ${p.landing_copy.cta}\n\n**Testimonial template:** ${p.landing_copy.testimonial_template}\n`);
  lines.push(`## 30-day plan`);
  for (const w of p.thirty_day_plan) lines.push(`### Week ${w.week} — ${w.focus}\n${w.actions.map(a => `- ${a}`).join("\n")}\n`);
  lines.push(`## KPIs`);
  for (const k of p.kpis) lines.push(`- **${k.metric}**: ${k.target}`);
  return lines.join("\n");
}

export { megaPackMarkdown };

export const generateMegaPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => MegaPackInput.parse(input))
  .handler(async ({ data, context }): Promise<MegaPackResult> => {
    const { supabase, userId } = context as any;
    const brand = await loadBrand(supabase, userId);

    const system = `You are a senior CMO and growth strategist. Produce a complete, on-brand marketing system as STRICT JSON only (no prose, no code fences). All arrays must be filled — no empty lists. Be concrete, specific, and concise. Schema:
{
  "positioning": string,
  "brand_voice": { "adjectives": string[5], "do": string[5], "dont": string[5], "sample_paragraph": string },
  "personas": [{ "name": string, "role": string, "goals": string[3], "pains": string[3], "channels": string[3] }] (3 personas),
  "channel_mix": [{ "name": string, "weekly_cadence": string, "why": string }] (5 items),
  "ads": [{ "platform": "Google Search"|"Meta"|"LinkedIn"|"X"|"YouTube", "headline": string<=60, "primary_text": string<=240, "cta": string<=20 }] (5 items),
  "email_drip": [{ "day": number, "subject": string<=60, "preview": string<=90, "body": string }] (5 emails for days 1,3,7,14,21),
  "social_calendar": [{ "day": number(1-14), "platform": "LinkedIn"|"X"|"Instagram"|"TikTok"|"YouTube", "hook": string, "body": string, "hashtags": string[3] }] (14 entries),
  "seo": { "primary_keywords": string[8], "meta_title": string<=60, "meta_description": string<=160, "faqs": [{ "q": string, "a": string }] (8 faqs) },
  "landing_copy": { "hero": string<=80, "subhero": string<=160, "bullets": string[5], "cta": string<=24, "testimonial_template": string },
  "thirty_day_plan": [{ "week": 1|2|3|4, "focus": string, "actions": string[5] }] (4 weeks),
  "kpis": [{ "metric": string, "target": string }] (6 items)
}`;

    const userMsg = `Brief:
Product/service: ${data.product}
Audience: ${data.audience || "general"}
30-day goal: ${data.goal}
Budget: ${data.budget}
Region: ${data.region}${brandBlock(brand)}

Return the JSON object only.`;

    const content = await callOpenRouter(system, userMsg, true);
    const parsed = parseJsonLoose<any>(content);

    // Defensive normalization — never let one missing array crash the UI.
    const arr = (v: any) => (Array.isArray(v) ? v : []);
    const str = (v: any, d = "") => (typeof v === "string" ? v : d);

    const usage = await recordUsage(supabase, userId, 8, { mode: "megapack" });

    return {
      brief: {
        product: data.product,
        audience: data.audience,
        goal: data.goal,
        budget: data.budget,
        region: data.region,
      },
      positioning: str(parsed.positioning),
      brand_voice: {
        adjectives: arr(parsed.brand_voice?.adjectives).map(String).slice(0, 8),
        do: arr(parsed.brand_voice?.do).map(String).slice(0, 8),
        dont: arr(parsed.brand_voice?.dont).map(String).slice(0, 8),
        sample_paragraph: str(parsed.brand_voice?.sample_paragraph),
      },
      personas: arr(parsed.personas).slice(0, 5).map((p: any) => ({
        name: str(p?.name, "Persona"),
        role: str(p?.role),
        goals: arr(p?.goals).map(String).slice(0, 5),
        pains: arr(p?.pains).map(String).slice(0, 5),
        channels: arr(p?.channels).map(String).slice(0, 5),
      })),
      channel_mix: arr(parsed.channel_mix).slice(0, 8).map((c: any) => ({
        name: str(c?.name), weekly_cadence: str(c?.weekly_cadence), why: str(c?.why),
      })),
      ads: arr(parsed.ads).slice(0, 8).map((a: any) => ({
        platform: str(a?.platform, "Meta"),
        headline: str(a?.headline),
        primary_text: str(a?.primary_text),
        cta: str(a?.cta, "Learn more"),
      })),
      email_drip: arr(parsed.email_drip).slice(0, 8).map((e: any, i: number) => ({
        day: Number.isFinite(e?.day) ? Number(e.day) : i + 1,
        subject: str(e?.subject),
        preview: str(e?.preview),
        body: str(e?.body),
      })),
      social_calendar: arr(parsed.social_calendar).slice(0, 30).map((s: any, i: number) => ({
        day: Number.isFinite(s?.day) ? Number(s.day) : i + 1,
        platform: str(s?.platform, "LinkedIn"),
        hook: str(s?.hook),
        body: str(s?.body),
        hashtags: arr(s?.hashtags).map(String).slice(0, 8),
      })),
      seo: {
        primary_keywords: arr(parsed.seo?.primary_keywords).map(String).slice(0, 20),
        meta_title: str(parsed.seo?.meta_title),
        meta_description: str(parsed.seo?.meta_description),
        faqs: arr(parsed.seo?.faqs).slice(0, 12).map((f: any) => ({
          q: str(f?.q), a: str(f?.a),
        })),
      },
      landing_copy: {
        hero: str(parsed.landing_copy?.hero),
        subhero: str(parsed.landing_copy?.subhero),
        bullets: arr(parsed.landing_copy?.bullets).map(String).slice(0, 8),
        cta: str(parsed.landing_copy?.cta, "Get started"),
        testimonial_template: str(parsed.landing_copy?.testimonial_template),
      },
      thirty_day_plan: arr(parsed.thirty_day_plan).slice(0, 6).map((w: any, i: number) => ({
        week: Number.isFinite(w?.week) ? Number(w.week) : i + 1,
        focus: str(w?.focus),
        actions: arr(w?.actions).map(String).slice(0, 8),
      })),
      kpis: arr(parsed.kpis).slice(0, 10).map((k: any) => ({
        metric: str(k?.metric), target: str(k?.target),
      })),
      usage,
    };
  });
