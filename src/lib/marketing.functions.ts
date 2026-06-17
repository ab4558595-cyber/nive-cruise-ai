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

async function callOpenRouter(systemPrompt: string, userPrompt: string, json = true) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://nive-ai.co.in",
      "X-Title": "Nive AI for Business",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
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
