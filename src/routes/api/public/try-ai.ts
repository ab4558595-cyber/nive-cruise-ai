import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/try-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "AI is not configured" }, { status: 500 });
        }

        let body: { prompt?: string } = {};
        try {
          body = (await request.json()) as { prompt?: string };
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const prompt = String(body.prompt ?? "").trim().slice(0, 600);
        if (prompt.length < 3) {
          return Response.json({ error: "Please enter a prompt." }, { status: 400 });
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
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!res.ok) {
          if (res.status === 429) {
            return Response.json({ error: "Demo is busy right now. Please try again in a moment." }, { status: 429 });
          }
          if (res.status === 402) {
            return Response.json({ error: "Demo capacity reached. Please sign up to continue." }, { status: 402 });
          }
          return Response.json({ error: "AI request failed." }, { status: 502 });
        }

        const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const text = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ text });
      },
    },
  },
});
