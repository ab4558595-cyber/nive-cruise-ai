import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getClientIp, rateLimit, RateLimitError } from "@/lib/rate-limit.server";

const Body = z.object({
  // No control chars, reasonable length, trimmed.
  prompt: z
    .string()
    .trim()
    .min(3, "Please enter a prompt.")
    .max(600, "Prompt too long.")
    .refine((s) => !/[\u0000-\u0008\u000B-\u001F\u007F]/.test(s), "Invalid characters."),
});

export const Route = createFileRoute("/api/public/try-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "AI is not configured" }, { status: 500 });
        }

        // Per-IP rate limit: 10 requests / hour
        const ip = getClientIp(request);
        try {
          await rateLimit(ip, "try-ai", 10, 3600);
        } catch (e) {
          if (e instanceof RateLimitError) {
            return Response.json(
              { error: "You've hit the free demo limit. Sign up free to keep building." },
              { status: 429, headers: { "Retry-After": String(e.retryAfter) } },
            );
          }
          // Don't fail open silently — log and proceed only if rate-limit infra itself failed.
          console.error("rateLimit failed:", e);
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = Body.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid input" },
            { status: 400 },
          );
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content:
                  "You are Nive AI's free demo assistant. Give a single, useful, concise answer (max 180 words). End with one short line: 'Sign up free to keep building →'.",
              },
              { role: "user", content: parsed.data.prompt },
            ],
          }),
        });

        if (!res.ok) {
          if (res.status === 429) {
            return Response.json(
              { error: "Demo is busy right now. Please try again in a moment." },
              { status: 429 },
            );
          }
          if (res.status === 402) {
            return Response.json(
              { error: "Demo capacity reached. Please sign up to continue." },
              { status: 402 },
            );
          }
          return Response.json({ error: "AI request failed." }, { status: 502 });
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ text });
      },
    },
  },
});
