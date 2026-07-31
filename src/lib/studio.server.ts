// Server-only helpers for the Nive Studio tools (voice, design, automations, agents).

export async function callModel(
  systemPrompt: string,
  userPrompt: string,
  json = false,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("AI is not configured on this deployment");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://nive-ai.co.in",
      "X-Title": "Nive AI Studio",
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
    throw new Error(`AI error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const out = data.choices?.[0]?.message?.content ?? "";
  if (!out.trim()) throw new Error("The model returned an empty response");
  return out;
}

export function parseJsonLoose<T = unknown>(s: string): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error("Model returned invalid JSON");
  }
}

export const VOICE_OUTPUTS = {
  code: {
    label: "Code",
    system:
      "You are Nive, a senior engineer. The user spoke a brief out loud, so the transcript may be messy. Infer intent, then reply with a short plan (max 3 bullets) followed by complete, runnable code in fenced blocks with file paths as comments. No filler.",
  },
  copy: {
    label: "Marketing copy",
    system:
      "You are Nive, a sharp brand copywriter. The user spoke a brief out loud. Return polished copy: a headline, subhead, 3 body variants and one CTA. Use markdown headings. No preamble, no disclaimers.",
  },
  script: {
    label: "Call script",
    system:
      "You are Nive, a sales-enablement expert. Turn the spoken brief into a call script: opener, discovery questions, value framing, 3 objection handles with responses, and a close. Use markdown. Keep lines speakable.",
  },
  notes: {
    label: "Structured notes",
    system:
      "You are Nive, a meeting-notes assistant. Turn the rambling spoken transcript into clean structured notes: Summary, Decisions, Action items (with owners if named), Open questions. Markdown only.",
  },
} as const;

export type VoiceOutput = keyof typeof VOICE_OUTPUTS;

export const AUTOMATION_STEP_PROMPTS: Record<string, { label: string; system: string }> = {
  brief: {
    label: "Brief",
    system:
      "You are Nive. Expand the input into a tight creative brief: objective, audience, key message, tone, success metric. Max 160 words, markdown.",
  },
  copy: {
    label: "Copy",
    system:
      "You are Nive, a copywriter. Using the prior step output, write the campaign copy: headline, subhead, 3 short posts. Markdown, no preamble.",
  },
  schedule: {
    label: "Schedule",
    system:
      "You are Nive, a content planner. Using the prior step output, produce a 7-day posting schedule as a markdown table: Day | Channel | Asset | Time (IST) | Note.",
  },
  report: {
    label: "Report",
    system:
      "You are Nive, a growth analyst. Using the prior steps, produce a measurement plan: KPIs, tracking setup, review cadence and a simple weekly report template. Markdown.",
  },
  seo: {
    label: "SEO pass",
    system:
      "You are Nive, an SEO specialist. Using the prior step output, produce primary/secondary keywords, meta title (<60 chars), meta description (<160 chars) and 5 internal-link ideas. Markdown.",
  },
  email: {
    label: "Email",
    system:
      "You are Nive, an email marketer. Using the prior step output, write one launch email: subject lines (3), preview text, body, CTA. Markdown.",
  },
  qa: {
    label: "QA review",
    system:
      "You are Nive, a critical reviewer. Review the prior steps for weak claims, unclear CTAs, tone drift and factual risk. Output a prioritised fix list. Markdown.",
  },
};
