// Server-only autopilot engine: a real multi-step agent run.
// Plan → execute each step → critique → finalise, all server-side.

import { callModel, parseJsonLoose } from "./studio.server";

export type AutopilotStep = { title: string; instruction: string; output: string };

export type AutopilotRun = {
  objective: string;
  steps: AutopilotStep[];
  critique: string;
  deliverable: string;
};

type PlanShape = {
  objective: string;
  steps: Array<{ title: string; instruction: string; deliverable?: string }>;
};

const PLANNER_SYSTEM = `You are Nive Autopilot's planner. You decompose a business goal into an
executable plan that an AI worker can complete alone, with no human in the loop.
Return STRICT JSON only:
{ "objective": string, "steps": [{ "title": string, "instruction": string, "deliverable": string }] }
Rules: 3-5 steps. Each instruction must be self-contained, specific, and produce a concrete artifact
(research notes, draft, dataset spec, checklist, schedule, email, report section). Never include
steps that require credentials, browsing, or human approval.`;

const WORKER_SYSTEM = `You are a Nive Autopilot worker executing ONE step of an approved plan.
Do the work fully — do not describe how you would do it. Output only the finished artifact in
markdown. No preamble, no "here is", no apologies. Use tables and checklists where useful.`;

const CRITIC_SYSTEM = `You are Nive Autopilot's critic. Review the executed work against the objective.
Output markdown with two short sections: "## Gaps" (specific, actionable, max 5 bullets) and
"## Keep" (what is already strong, max 3 bullets). Be blunt and concrete. No filler.`;

const FINALISER_SYSTEM = `You are Nive Autopilot's finaliser. Merge the step outputs and apply the
critic's fixes into ONE polished, ready-to-use deliverable in markdown. Start with a 2-line executive
summary, then the full deliverable, then a "## Next actions" checklist. Do not mention the process,
the steps, or the critic.`;

export async function runAutopilotPipeline(
  goal: string,
  context: string | undefined,
  depth: 3 | 4 | 5,
): Promise<AutopilotRun> {
  const briefing = [`Goal: ${goal}`, context ? `Context and constraints: ${context}` : ""]
    .filter(Boolean)
    .join("\n");

  const planRaw = await callModel(
    PLANNER_SYSTEM,
    `${briefing}\n\nProduce exactly ${depth} steps.`,
    true,
  );
  const plan = parseJsonLoose<PlanShape>(planRaw);
  const planned = (plan.steps ?? []).slice(0, depth);
  if (planned.length === 0) throw new Error("Autopilot could not plan this goal — add more detail");

  const steps: AutopilotStep[] = [];
  for (const [i, step] of planned.entries()) {
    const prior = steps
      .map((s, idx) => `### Step ${idx + 1} — ${s.title}\n${s.output}`)
      .join("\n\n")
      .slice(-12000);
    const user = [
      briefing,
      `You are executing step ${i + 1} of ${planned.length}: ${step.title}`,
      `Instruction: ${step.instruction}`,
      step.deliverable ? `Expected artifact: ${step.deliverable}` : "",
      prior ? `Work already completed:\n${prior}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const output = await callModel(WORKER_SYSTEM, user, false);
    steps.push({ title: step.title, instruction: step.instruction, output });
  }

  const allWork = steps
    .map((s, i) => `### Step ${i + 1} — ${s.title}\n${s.output}`)
    .join("\n\n")
    .slice(-24000);

  const critique = await callModel(CRITIC_SYSTEM, `${briefing}\n\nExecuted work:\n${allWork}`, false);

  const deliverable = await callModel(
    FINALISER_SYSTEM,
    `${briefing}\n\nExecuted work:\n${allWork}\n\nCritic feedback:\n${critique}`,
    false,
  );

  return {
    objective: plan.objective || goal,
    steps,
    critique,
    deliverable,
  };
}
