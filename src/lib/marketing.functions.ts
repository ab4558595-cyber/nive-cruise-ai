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
