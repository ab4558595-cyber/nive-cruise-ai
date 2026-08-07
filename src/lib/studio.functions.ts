import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREDIT_COSTS } from "./credit-costs";
import {
  callModel,
  parseJsonLoose,
  VOICE_OUTPUTS,
  AUTOMATION_STEP_PROMPTS,
  type VoiceOutput,
} from "./studio.server";

export type { VoiceOutput };

/** Charge the shared credit wallet before running a model. */
async function charge(userId: string, action: keyof typeof CREDIT_COSTS, meta: Record<string, unknown> = {}) {
  const { chargeCredits } = await import("./credits.server");
  return chargeCredits(userId, CREDIT_COSTS[action], `${action}_run`, action, meta);
}

export type DesignConcept = {
  name: string;
  tagline: string;
  vibe: string;
  palette: Array<{ name: string; hex: string; usage: string }>;
  typography: { heading: string; body: string; rationale: string };
  hero: { headline: string; subhead: string; cta: string; art: string };
  sections: Array<{ title: string; purpose: string; layout: string }>;
  components: Array<{ name: string; notes: string }>;
  cssTokens: string;
};

export const runVoiceBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        transcript: z.string().min(4).max(6000),
        output: z.enum(["code", "copy", "script", "notes"]),
        context: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const balance = await charge(userId, "voice_brief", { output: data.output });
    const cfg = VOICE_OUTPUTS[data.output as VoiceOutput];
    const user = [
      `Spoken transcript:\n"""${data.transcript}"""`,
      data.context ? `Extra context: ${data.context}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const text = await callModel(cfg.system, user, false);
    return { text, label: cfg.label, creditsLeft: balance };
  });

export const runDesignConcept = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        brief: z.string().min(6).max(3000),
        style: z.string().max(80).optional(),
        brandVoice: z.string().max(1500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    await charge(userId, "design_concept", {});
    const system = `You are Nive Design Studio, a senior product designer and brand strategist.
Return STRICT JSON matching this TypeScript type, nothing else:
{ name: string; tagline: string; vibe: string;
  palette: { name: string; hex: string; usage: string }[]; // 5-6 entries, hex like "#0a2540"
  typography: { heading: string; body: string; rationale: string }; // real Google Font names
  hero: { headline: string; subhead: string; cta: string; art: string }; // art = 1-sentence image direction
  sections: { title: string; purpose: string; layout: string }[]; // 5-7 entries
  components: { name: string; notes: string }[]; // 4-6 entries
  cssTokens: string; // ready-to-paste :root{--token:value} CSS block using the palette
}
Avoid generic purple-on-white AI aesthetics unless the brief asks for it. Commit to one distinctive direction.`;
    const user = [
      `Brief: ${data.brief}`,
      data.style ? `Requested style direction: ${data.style}` : "",
      data.brandVoice ? `Existing brand voice to stay consistent with: ${data.brandVoice}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const raw = await callModel(system, user, true);
    const concept = parseJsonLoose<DesignConcept>(raw);
    if (!Array.isArray(concept.palette) || concept.palette.length === 0) {
      throw new Error("Design model returned an incomplete concept — try again");
    }
    return concept;
  });

export const runAutomationStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        step: z.string().min(2).max(40),
        brief: z.string().min(4).max(3000),
        prior: z.string().max(12000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const balance = await charge(userId, "automation_step", { step: data.step });
    const cfg = AUTOMATION_STEP_PROMPTS[data.step];
    if (!cfg) throw new Error(`Unknown workflow step: ${data.step}`);
    const user = [
      `Original brief: ${data.brief}`,
      data.prior ? `Output of previous steps:\n"""${data.prior}"""` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const text = await callModel(cfg.system, user, false);
    return { text, label: cfg.label, creditsLeft: balance };
  });

export const runCustomAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(60),
        instructions: z.string().min(4).max(4000),
        brandContext: z.string().max(3000).optional(),
        tools: z.array(z.string().max(40)).max(8).optional(),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(8000),
            }),
          )
          .min(1)
          .max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const balance = await charge(userId, "custom_agent", { agent: data.name });
    const skills = (data.tools ?? []).join(", ");
    const system = [
      `You are "${data.name}", a custom agent inside Nive AI.`,
      `Operating instructions from your owner:\n${data.instructions}`,
      data.brandContext ? `Brand context you must respect:\n${data.brandContext}` : "",
      skills ? `Enabled skills: ${skills}. Use them when relevant and say which one you applied.` : "",
      "Answer in markdown. Be concrete and skip disclaimers.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const transcript = data.messages
      .map((m) => `${m.role === "user" ? "User" : "You"}: ${m.content}`)
      .join("\n\n");

    const text = await callModel(system, `${transcript}\n\nYou:`, false);
    return { text, creditsLeft: balance };
  });

export const runStudioMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        mode: z.string().min(2).max(60),
        input: z.string().min(4).max(20000),
        context: z.string().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const balance = await charge(userId, "studio_mode", { mode: data.mode });
    const { STUDIO_MODE_PROMPTS } = await import("./studio.server");
    const cfg = STUDIO_MODE_PROMPTS[data.mode];
    if (!cfg) throw new Error(`Unknown mode: ${data.mode}`);
    const user = [
      `Input:\n"""${data.input}"""`,
      data.context ? `Extra context / constraints: ${data.context}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const text = await callModel(cfg.system, user, false);
    return { text, label: cfg.label };
  });
