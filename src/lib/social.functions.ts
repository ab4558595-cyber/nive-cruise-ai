import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLATFORMS = [
  "instagram",
  "twitter",
  "linkedin",
  "facebook",
  "tiktok",
  "youtube",
] as const;
type Platform = (typeof PLATFORMS)[number];

const TONES = [
  "professional",
  "friendly",
  "bold",
  "playful",
  "inspirational",
  "witty",
  "minimal",
] as const;

async function callLLM(system: string, user: string, json = true) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Please add funds to your Lovable AI workspace.");
    }
    if (res.status === 429) {
      throw new Error("AI rate limit exceeded. Please try again in a moment.");
    }
    throw new Error(`AI error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!json) return { raw: content };
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  }
}

/* ---------------- 1. Generate post ---------------- */

export type SocialPost = {
  platform: Platform;
  caption: string;
  hashtags: string[];
  variants: string[];
  bestTime: string;
  imagePrompt: string;
  cta: string;
};


export const generateSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        topic: z.string().trim().min(2).max(400),
        platform: z.enum(PLATFORMS),
        tone: z.enum(TONES),
        audience: z.string().trim().max(200).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<SocialPost> => {
    const sys = `You are a senior social media manager. Output strictly valid JSON:
{ "caption": string, "hashtags": string[8], "variants": string[3], "bestTime": string, "imagePrompt": string, "cta": string }
- caption: tuned to ${data.platform} length and style
- hashtags: 8 relevant hashtags WITHOUT the leading #
- variants: 3 alt captions
- bestTime: a short suggested posting time (e.g. "Tue 7pm IST")
- imagePrompt: a vivid 1-sentence prompt for an AI image to pair with the post
- cta: one strong call-to-action line
No markdown, JSON only.`;
    const usr = `Topic: ${data.topic}
Platform: ${data.platform}
Tone: ${data.tone}
Audience: ${data.audience || "general"}`;
    const parsed = (await callLLM(sys, usr)) as any;
    return {
      platform: data.platform,
      caption: String(parsed.caption ?? "").slice(0, 2000),
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.slice(0, 12).map((h: any) => String(h).replace(/^#/, "").slice(0, 40))
        : [],
      variants: Array.isArray(parsed.variants)
        ? parsed.variants.slice(0, 5).map((v: any) => String(v).slice(0, 800))
        : [],
      bestTime: String(parsed.bestTime ?? "").slice(0, 80),
      imagePrompt: String(parsed.imagePrompt ?? "").slice(0, 400),
      cta: String(parsed.cta ?? "").slice(0, 200),
    };
  });


/* ---------------- 2. Reply / DM assistant ---------------- */

export type ReplyResult = { replies: string[] };

export const generateSocialReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        message: z.string().trim().min(1).max(2000),
        tone: z.enum(TONES),
        intent: z.enum(["thank", "answer", "deescalate", "redirect", "convert"]),
        brand: z.string().trim().max(200).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ReplyResult> => {
    const sys = `You draft on-brand replies to social comments and DMs. Output strictly valid JSON:
{ "replies": string[3] }
- 3 reply options, each <= 280 chars, no emojis unless tone is playful/friendly
- Match the intent: ${data.intent}
JSON only.`;
    const usr = `Incoming message: """${data.message}"""
Tone: ${data.tone}
Brand voice: ${data.brand || "neutral, helpful"}`;
    const parsed = (await callLLM(sys, usr)) as any;
    return {
      replies: Array.isArray(parsed.replies)
        ? parsed.replies.slice(0, 5).map((r: any) => String(r).slice(0, 600))
        : [],
    };
  });

/* ---------------- 3. Analytics suggestions ---------------- */

export type AnalyticsInsights = {
  summary: string;
  wins: string[];
  issues: string[];
  recommendations: string[];
};

export const analyzeSocialMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        platform: z.enum(PLATFORMS),
        metrics: z.string().trim().min(5).max(4000),
        goal: z.string().trim().max(200).optional().default("grow engagement"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<AnalyticsInsights> => {
    const sys = `You are a growth analyst. Given raw metrics, return strictly valid JSON:
{ "summary": string, "wins": string[3], "issues": string[3], "recommendations": string[5] }
- summary: 2-3 sentences
- wins/issues: short bullets
- recommendations: concrete next actions
JSON only.`;
    const usr = `Platform: ${data.platform}
Goal: ${data.goal}
Metrics:
${data.metrics}`;
    const parsed = (await callLLM(sys, usr)) as any;
    const arr = (v: any, n: number) =>
      Array.isArray(v) ? v.slice(0, n).map((x: any) => String(x).slice(0, 400)) : [];
    return {
      summary: String(parsed.summary ?? "").slice(0, 1200),
      wins: arr(parsed.wins, 5),
      issues: arr(parsed.issues, 5),
      recommendations: arr(parsed.recommendations, 8),
    };
  });

/* ---------------- 4. Content calendar ---------------- */

export type CalendarItem = {
  day: number;
  date: string;
  platform: Platform;
  format: string;
  hook: string;
  caption: string;
  hashtags: string[];
};

export const generateContentCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        brand: z.string().trim().min(2).max(200),
        niche: z.string().trim().max(200).optional().default(""),
        platforms: z.array(z.enum(PLATFORMS)).min(1).max(6),
        days: z.union([z.literal(7), z.literal(14), z.literal(30)]),
        tone: z.enum(TONES),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ items: CalendarItem[] }> => {
    const sys = `You are a content calendar strategist. Output strictly valid JSON:
{ "items": [ { "day": number, "platform": string, "format": string, "hook": string, "caption": string, "hashtags": string[5] } ] }
- One item per day per chosen platform (rotate platforms if multiple)
- ${data.days} days total
- format examples: reel, carousel, single image, thread, story, short video
- hook <= 90 chars, caption <= 400 chars
- hashtags WITHOUT leading #
JSON only.`;
    const usr = `Brand: ${data.brand}
Niche: ${data.niche || "general"}
Platforms: ${data.platforms.join(", ")}
Tone: ${data.tone}
Days: ${data.days}`;
    const parsed = (await callLLM(sys, usr)) as any;
    const today = new Date();
    const items: CalendarItem[] = Array.isArray(parsed.items)
      ? parsed.items.slice(0, data.days * data.platforms.length).map((it: any, i: number) => {
          const day = Number(it.day) || i + 1;
          const date = new Date(today.getTime() + (day - 1) * 86400000)
            .toISOString()
            .slice(0, 10);
          const platform = (PLATFORMS as readonly string[]).includes(String(it.platform))
            ? (it.platform as Platform)
            : data.platforms[i % data.platforms.length];
          return {
            day,
            date,
            platform,
            format: String(it.format ?? "post").slice(0, 40),
            hook: String(it.hook ?? "").slice(0, 200),
            caption: String(it.caption ?? "").slice(0, 800),
            hashtags: Array.isArray(it.hashtags)
              ? it.hashtags.slice(0, 8).map((h: any) => String(h).replace(/^#/, "").slice(0, 40))
              : [],
          };
        })
      : [];
    return { items };
  });

/* ---------------- 5. Hashtag research ---------------- */

export type HashtagGroup = {
  niche: string[];
  trending: string[];
  broad: string[];
  branded: string[];
};

export const researchHashtags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      topic: z.string().trim().min(2).max(300),
      platform: z.enum(PLATFORMS),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<HashtagGroup> => {
    const sys = `You are a hashtag researcher. Output strictly valid JSON:
{ "niche": string[10], "trending": string[8], "broad": string[6], "branded": string[4] }
- All hashtags WITHOUT leading #
- niche: very specific to the topic
- trending: currently popular and relevant
- broad: high-volume, wide reach
- branded: suggested brandable tags
JSON only.`;
    const usr = `Topic: ${data.topic}\nPlatform: ${data.platform}`;
    const p = (await callLLM(sys, usr)) as any;
    const clean = (v: any, n: number) =>
      Array.isArray(v) ? v.slice(0, n).map((h: any) => String(h).replace(/^#/, "").slice(0, 40)) : [];
    return {
      niche: clean(p.niche, 15),
      trending: clean(p.trending, 12),
      broad: clean(p.broad, 10),
      branded: clean(p.branded, 8),
    };
  });

/* ---------------- 6. Profile bio generator ---------------- */

export type BioResult = { bios: string[] };

export const generateBio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      name: z.string().trim().min(1).max(120),
      platform: z.enum(PLATFORMS),
      about: z.string().trim().min(2).max(600),
      keywords: z.string().trim().max(300).optional().default(""),
      tone: z.enum(TONES),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<BioResult> => {
    const limit =
      data.platform === "twitter" ? 160 :
      data.platform === "instagram" ? 150 :
      data.platform === "tiktok" ? 80 :
      data.platform === "linkedin" ? 220 : 200;
    const sys = `You write punchy social media profile bios. Output strictly valid JSON:
{ "bios": string[5] }
- Each bio <= ${limit} characters, tuned to ${data.platform}
- Include emoji bullets if platform supports them (not for LinkedIn)
- Include a clear value prop + call-to-action
JSON only.`;
    const usr = `Name/Brand: ${data.name}
About: ${data.about}
Keywords: ${data.keywords || "n/a"}
Tone: ${data.tone}`;
    const p = (await callLLM(sys, usr)) as any;
    return {
      bios: Array.isArray(p.bios) ? p.bios.slice(0, 8).map((b: any) => String(b).slice(0, 400)) : [],
    };
  });

/* ---------------- 7. Content ideas / hooks ---------------- */

export type IdeasResult = {
  ideas: Array<{ format: string; hook: string; angle: string }>;
};

export const generateIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      niche: z.string().trim().min(2).max(300),
      platform: z.enum(PLATFORMS),
      audience: z.string().trim().max(200).optional().default(""),
      goal: z.string().trim().max(200).optional().default("grow reach"),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<IdeasResult> => {
    const sys = `You are a viral content strategist. Output strictly valid JSON:
{ "ideas": [ { "format": string, "hook": string, "angle": string } ] }
- Return 10 distinct content ideas tuned for ${data.platform}
- format: reel, carousel, thread, story, short, photo, livestream, etc.
- hook: scroll-stopping first line <= 90 chars
- angle: 1-sentence explanation of the angle/payoff
JSON only.`;
    const usr = `Niche: ${data.niche}\nAudience: ${data.audience || "general"}\nGoal: ${data.goal}`;
    const p = (await callLLM(sys, usr)) as any;
    return {
      ideas: Array.isArray(p.ideas)
        ? p.ideas.slice(0, 15).map((i: any) => ({
            format: String(i.format ?? "post").slice(0, 40),
            hook: String(i.hook ?? "").slice(0, 200),
            angle: String(i.angle ?? "").slice(0, 400),
          }))
        : [],
    };
  });

/* ---------------- 8. Cross-platform repurpose ---------------- */

export type RepurposeResult = {
  outputs: Array<{ platform: Platform; content: string; notes: string }>;
};

export const repurposePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      source: z.string().trim().min(5).max(4000),
      sourcePlatform: z.enum(PLATFORMS),
      targets: z.array(z.enum(PLATFORMS)).min(1).max(6),
      tone: z.enum(TONES),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<RepurposeResult> => {
    const sys = `You repurpose social content across platforms while preserving the core message. Output strictly valid JSON:
{ "outputs": [ { "platform": string, "content": string, "notes": string } ] }
- One output per target platform
- Adapt length, formatting, hashtags, emoji density and CTA to each platform's norms
- notes: 1 short sentence on format/structure choice (e.g. "split into 4-tweet thread")
JSON only.`;
    const usr = `Source platform: ${data.sourcePlatform}
Targets: ${data.targets.join(", ")}
Tone: ${data.tone}
Original content:
"""${data.source}"""`;
    const p = (await callLLM(sys, usr)) as any;
    const valid = (s: any): Platform | null =>
      (PLATFORMS as readonly string[]).includes(String(s)) ? (s as Platform) : null;
    return {
      outputs: Array.isArray(p.outputs)
        ? p.outputs
            .map((o: any) => {
              const pl = valid(o.platform);
              return pl
                ? {
                    platform: pl,
                    content: String(o.content ?? "").slice(0, 4000),
                    notes: String(o.notes ?? "").slice(0, 300),
                  }
                : null;
            })
            .filter(Boolean)
            .slice(0, 8)
        : [],
    };
  });
