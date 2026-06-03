import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MarketingInput = z.object({
  product: z.string().trim().min(2).max(200),
  audience: z.string().trim().max(200).optional().default(""),
  tone: z.enum([
    "professional",
    "friendly",
    "bold",
    "playful",
    "luxurious",
    "minimal",
    "urgent",
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
};

const SYSTEM = `You are a senior brand copywriter. Output strictly valid JSON matching:
{ "headline": string, "variants": string[5], "body": string, "cta": string }
- headline: punchy, <= 80 chars
- variants: 5 alternative headlines, each <= 80 chars
- body: 2-4 short sentences suited to the channel
- cta: imperative call-to-action, <= 5 words
Match the requested tone and channel. No markdown, no commentary — JSON only.`;

export const generateMarketing = createServerFn({ method: "POST" })
  .inputValidator((input) => MarketingInput.parse(input))
  .handler(async ({ data }): Promise<MarketingResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OpenRouter API key not configured");

    const userPrompt = `Product / service: ${data.product}
Target audience: ${data.audience || "broad consumer audience"}
Tone: ${data.tone}
Channel: ${data.channel} (${
      data.channel === "ad"
        ? "short paid ad copy"
        : data.channel === "email"
        ? "marketing email subject + body"
        : data.channel === "social"
        ? "single social post"
        : "landing-page hero copy"
    })

Return only the JSON object.`;

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
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`OpenRouter error ${res.status}: ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { headline?: string; variants?: string[]; body?: string; cta?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      // fallback: try to extract JSON block
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    return {
      headline: (parsed.headline ?? "").toString().slice(0, 120),
      variants: Array.isArray(parsed.variants)
        ? parsed.variants.slice(0, 5).map((v) => String(v).slice(0, 120))
        : [],
      body: (parsed.body ?? "").toString().slice(0, 1200),
      cta: (parsed.cta ?? "Get started").toString().slice(0, 40),
      channel: data.channel,
      tone: data.tone,
    };
  });
