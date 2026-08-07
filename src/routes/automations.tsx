import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import {
  Workflow, Loader2, Play, Plus, Trash2, Check, GripVertical, Save, RotateCcw, Bot, Zap,
} from "lucide-react";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { StudioShell, Card, ErrorNote } from "@/components/StudioShell";
import { runAutomationStep } from "@/lib/studio.functions";
import { runAutopilot, AUTOPILOT_COST, type AutopilotRun } from "@/lib/autopilot.functions";
import { safeStorage } from "@/lib/safeStorage";

export const Route = createFileRoute("/automations")({
  head: () => ({
    meta: [
      { title: "Automations — chain Nive tools into workflows | Nive AI" },
      {
        name: "description",
        content:
          "Chain Nive steps into a workflow: brief → copy → schedule → report. Each step feeds the next, and runs are saved in your browser.",
      },
      { property: "og:title", content: "Automations — Nive AI" },
      {
        property: "og:description",
        content: "Build multi-step AI workflows where every step reads the output of the one before it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/automations" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <AutomationsPage />
    </BusinessAuthGate>
  ),
});

const STEP_LIBRARY = [
  { key: "brief", label: "Brief" },
  { key: "copy", label: "Copy" },
  { key: "seo", label: "SEO pass" },
  { key: "email", label: "Email" },
  { key: "schedule", label: "Schedule" },
  { key: "qa", label: "QA review" },
  { key: "report", label: "Report" },
] as const;

const TEMPLATES: Array<{ name: string; steps: string[]; brief: string }> = [
  {
    name: "Launch campaign",
    steps: ["brief", "copy", "schedule", "report"],
    brief: "Launch our new AI invoicing tool to Indian SMB accountants.",
  },
  {
    name: "Content engine",
    steps: ["brief", "copy", "seo", "schedule"],
    brief: "Weekly blog + social content for a fintech newsletter.",
  },
  {
    name: "Outbound sprint",
    steps: ["brief", "email", "qa", "report"],
    brief: "Cold outbound to 200 D2C founders for our logistics API.",
  },
];

type StepRun = { key: string; label: string; status: "idle" | "running" | "done" | "error"; output: string };

const LS_KEY = "nive.automations.v1";

function AutomationsPage() {
  const run = useServerFn(runAutomationStep);
  const [brief, setBrief] = useState(TEMPLATES[0].brief);
  const [steps, setSteps] = useState<string[]>([...TEMPLATES[0].steps]);
  const [runs, setRuns] = useState<StepRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Array<{ name: string; brief: string; steps: string[] }>>([]);

  // --- Autopilot: the agent plans and runs the whole job itself ---
  const autopilot = useServerFn(runAutopilot);
  const [goal, setGoal] = useState("");
  const [depth, setDepth] = useState<3 | 4 | 5>(4);
  const [apBusy, setApBusy] = useState(false);
  const [apError, setApError] = useState("");
  const [apRun, setApRun] = useState<AutopilotRun | null>(null);

  const launchAutopilot = async () => {
    if (goal.trim().length < 10) {
      setApError("Describe the outcome you want in a sentence or two.");
      return;
    }
    setApError("");
    setApBusy(true);
    setApRun(null);
    try {
      const res = await autopilot({ data: { goal: goal.trim(), depth } });
      setApRun(res);
    } catch (e) {
      setApError(e instanceof Error ? e.message : "Autopilot run failed");
    } finally {
      setApBusy(false);
    }
  };

  useEffect(() => {
    try {
      const raw = safeStorage.getItem(LS_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persist = (next: Array<{ name: string; brief: string; steps: string[] }>) => {
    setSaved(next);
    safeStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const saveWorkflow = () => {
    const name = window.prompt("Name this workflow", "My workflow");
    if (!name) return;
    persist([...saved.filter((s) => s.name !== name), { name, brief, steps }]);
  };

  const addStep = (key: string) => setSteps((s) => (s.length >= 7 ? s : [...s, key]));
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setSteps((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const execute = async () => {
    if (brief.trim().length < 4) {
      setError("Add a brief for the workflow to work from.");
      return;
    }
    if (steps.length === 0) {
      setError("Add at least one step.");
      return;
    }
    setError("");
    setBusy(true);
    const initial: StepRun[] = steps.map((k) => ({
      key: k,
      label: STEP_LIBRARY.find((s) => s.key === k)?.label ?? k,
      status: "idle",
      output: "",
    }));
    setRuns(initial);

    let prior = "";
    for (let i = 0; i < steps.length; i++) {
      setRuns((r) => r.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)));
      try {
        const res = await run({
          data: { step: steps[i], brief: brief.trim(), prior: prior || undefined },
        });
        prior = `${prior}\n\n### ${res.label}\n${res.text}`.trim().slice(-11000);
        setRuns((r) =>
          r.map((s, idx) => (idx === i ? { ...s, status: "done", output: res.text } : s)),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Step failed";
        setRuns((r) => r.map((s, idx) => (idx === i ? { ...s, status: "error", output: msg } : s)));
        setError(`Stopped at step ${i + 1}: ${msg}`);
        break;
      }
    }
    setBusy(false);
  };

  return (
    <StudioShell
      title="Automations"
      subtitle="Chain Nive tools into workflows: brief → copy → schedule → report. Every step reads the output of the previous one, so the whole run stays on message."
      icon={Workflow}
      accent="#00b3d4"
    >
      {/* Autopilot — one goal in, finished deliverable out */}
      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b3d4]/12 text-[#00b3d4]">
            <Bot className="h-4 w-4" />
          </span>
          <h2 className="text-[17px] font-semibold">Autopilot</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f9fc] px-2.5 py-1 text-[12px] font-semibold text-[#425466]">
            <Zap className="h-3 w-3 text-[#00b3d4]" /> {AUTOPILOT_COST} credits
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-[#425466]">
          Give it an outcome, not a prompt. Autopilot plans the steps itself, executes each one,
          critiques its own work and hands back a single finished deliverable. Failed runs are
          refunded automatically.
        </p>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="e.g. Prepare a 4-week go-to-market plan and launch assets for our AI invoicing tool aimed at Indian SMB accountants."
          className="mt-3 w-full resize-y rounded-xl border border-[#0a2540]/12 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#00b3d4]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[#8792a2]">Depth</span>
          {([3, 4, 5] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDepth(d)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                depth === d
                  ? "bg-[#00b3d4] text-white"
                  : "border border-[#0a2540]/12 text-[#425466] hover:border-[#00b3d4]"
              }`}
            >
              {d} steps
            </button>
          ))}
          <button
            type="button"
            onClick={launchAutopilot}
            disabled={apBusy}
            className="ml-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2540] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#00b3d4] disabled:opacity-50"
          >
            {apBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {apBusy ? "Autopilot working…" : "Run autopilot"}
          </button>
        </div>
        {apError && (
          <div className="mt-4">
            <ErrorNote message={apError} />
          </div>
        )}

        {apRun && (
          <div className="mt-5 border-t border-[#0a2540]/10 pt-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
              Objective
            </p>
            <p className="mt-1 text-[15px] font-medium">{apRun.objective}</p>

            <div className="mt-4 space-y-2">
              {apRun.steps.map((s, i) => (
                <details
                  key={`${s.title}-${i}`}
                  className="rounded-xl border border-[#0a2540]/10 bg-[#f6f9fc] px-3 py-2"
                >
                  <summary className="cursor-pointer text-[14px] font-medium">
                    Step {i + 1} — {s.title}
                  </summary>
                  <div className="prose prose-sm mt-3 max-w-none">
                    <ReactMarkdown>{s.output}</ReactMarkdown>
                  </div>
                </details>
              ))}
              <details className="rounded-xl border border-[#0a2540]/10 px-3 py-2">
                <summary className="cursor-pointer text-[14px] font-medium">Self-critique</summary>
                <div className="prose prose-sm mt-3 max-w-none">
                  <ReactMarkdown>{apRun.critique}</ReactMarkdown>
                </div>
              </details>
            </div>

            <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
              Final deliverable
            </p>
            <div className="prose prose-sm mt-2 max-w-none prose-pre:bg-[#0a2540] prose-pre:text-white">
              <ReactMarkdown>{apRun.deliverable}</ReactMarkdown>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <Card>
          <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
            Workflow brief
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-xl border border-[#0a2540]/12 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#00b3d4]"
          />

          <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
            Templates
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  setBrief(t.brief);
                  setSteps([...t.steps]);
                  setRuns([]);
                }}
                className="rounded-full border border-[#0a2540]/12 px-3.5 py-1.5 text-[13px] font-medium text-[#425466] transition-colors hover:border-[#00b3d4] hover:text-[#00b3d4]"
              >
                {t.name}
              </button>
            ))}
          </div>

          {saved.length > 0 && (
            <>
              <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
                Saved workflows
              </p>
              <div className="mt-2 space-y-2">
                {saved.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-2 rounded-xl border border-[#0a2540]/10 px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setBrief(s.brief);
                        setSteps([...s.steps]);
                        setRuns([]);
                      }}
                      className="flex-1 text-left text-[14px] font-medium"
                    >
                      {s.name}
                      <span className="ml-2 text-[12px] text-[#8792a2]">{s.steps.length} steps</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => persist(saved.filter((x) => x.name !== s.name))}
                      className="text-[#8792a2] hover:text-[#ff4d4f]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
              Pipeline ({steps.length})
            </p>
            <button
              type="button"
              onClick={saveWorkflow}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#425466] hover:text-[#00b3d4]"
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {steps.map((k, i) => (
              <div
                key={`${k}-${i}`}
                className="flex items-center gap-2 rounded-xl border border-[#0a2540]/10 bg-[#f6f9fc] px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-[#c1c9d2]" />
                <span className="text-[14px] font-medium">
                  {i + 1}. {STEP_LIBRARY.find((s) => s.key === k)?.label ?? k}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="px-1 text-[#8792a2] hover:text-[#0a2540]">↑</button>
                  <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="px-1 text-[#8792a2] hover:text-[#0a2540]">↓</button>
                  <button type="button" aria-label="Remove step" onClick={() => removeStep(i)} className="px-1 text-[#8792a2] hover:text-[#ff4d4f]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
            Add step
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STEP_LIBRARY.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => addStep(s.key)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#0a2540]/20 px-3 py-1.5 text-[13px] font-medium text-[#425466] transition-colors hover:border-[#00b3d4] hover:text-[#00b3d4]"
              >
                <Plus className="h-3.5 w-3.5" /> {s.label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={execute}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#00b3d4] px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#0a2540] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {busy ? "Running workflow…" : "Run workflow"}
            </button>
            {runs.length > 0 && !busy && (
              <button
                type="button"
                onClick={() => setRuns([])}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0a2540]/12 px-4 py-3 text-[14px] font-medium"
              >
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
            )}
          </div>
          {error && (
            <div className="mt-4">
              <ErrorNote message={error} />
            </div>
          )}
        </Card>
      </div>

      {runs.length > 0 && (
        <div className="mt-6 space-y-4">
          {runs.map((r, i) => (
            <Card key={`${r.key}-${i}`}>
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${
                    r.status === "done"
                      ? "bg-[#00b3d4] text-white"
                      : r.status === "error"
                        ? "bg-[#ff4d4f] text-white"
                        : "bg-[#f6f9fc] text-[#8792a2]"
                  }`}
                >
                  {r.status === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <h3 className="text-[16px] font-semibold">{r.label}</h3>
                {r.status === "running" && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#00b3d4]" />
                )}
              </div>
              {r.output && (
                <div className="prose prose-sm mt-4 max-w-none prose-pre:bg-[#0a2540] prose-pre:text-white">
                  <ReactMarkdown>{r.output}</ReactMarkdown>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </StudioShell>
  );
}
