import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, Plus, Trash2, Send, Pencil, X } from "lucide-react";
import { BusinessAuthGate } from "@/components/BusinessAuthGate";
import { StudioShell, Card, ErrorNote } from "@/components/StudioShell";
import { runCustomAgent } from "@/lib/studio.functions";
import { safeStorage } from "@/lib/safeStorage";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Custom Agents — reusable AI agents for your team | Nive AI" },
      {
        name: "description",
        content:
          "Save prompts, skills and brand context as a reusable agent, then chat with it. Agents are stored in your browser and run on Nive's models.",
      },
      { property: "og:title", content: "Custom Agents — Nive AI" },
      {
        property: "og:description",
        content: "Turn a prompt plus brand context into a reusable agent your whole team can run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/agents" }],
  }),
  component: () => (
    <BusinessAuthGate>
      <AgentsPage />
    </BusinessAuthGate>
  ),
});

type Msg = { role: "user" | "assistant"; content: string };
type Agent = {
  id: string;
  name: string;
  instructions: string;
  brandContext: string;
  tools: string[];
  messages: Msg[];
};

const SKILLS = ["Copywriting", "Code review", "SEO", "Data analysis", "Sales", "Support", "Research", "Planning"];

const STARTERS: Array<Omit<Agent, "id" | "messages">> = [
  {
    name: "Launch Copy Chief",
    instructions:
      "You write launch copy for B2B SaaS. Always give 3 headline options, then body copy, then a CTA. Push back on vague claims.",
    brandContext: "Plainspoken, confident, no hype words, Indian market first.",
    tools: ["Copywriting", "SEO"],
  },
  {
    name: "Code Reviewer",
    instructions:
      "Review pasted code for correctness, security and readability. Output: blocking issues, then nits, then a patched snippet.",
    brandContext: "React + TypeScript codebase, strict typing, no any.",
    tools: ["Code review"],
  },
  {
    name: "Support Deflector",
    instructions:
      "Draft support replies. Be warm, specific, offer the exact next step, and never promise timelines you cannot verify.",
    brandContext: "Product: Nive AI. Tone: helpful, concise, human.",
    tools: ["Support"],
  },
];

const LS_KEY = "nive.agents.v1";
const uid = () => Math.random().toString(36).slice(2, 10);

function AgentsPage() {
  const run = useServerFn(runCustomAgent);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Agent | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let list: Agent[] = [];
    try {
      const raw = safeStorage.getItem(LS_KEY);
      if (raw) list = JSON.parse(raw);
    } catch {
      /* ignore corrupt storage */
    }
    if (list.length === 0) {
      list = STARTERS.map((s) => ({ ...s, id: uid(), messages: [] }));
      safeStorage.setItem(LS_KEY, JSON.stringify(list));
    }
    setAgents(list);
    setActiveId(list[0]?.id ?? null);
  }, []);

  const persist = (next: Agent[]) => {
    setAgents(next);
    safeStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const active = agents.find((a) => a.id === activeId) ?? null;

  const newAgent = () => {
    const a: Agent = {
      id: uid(),
      name: "New agent",
      instructions: "",
      brandContext: "",
      tools: [],
      messages: [],
    };
    persist([a, ...agents]);
    setActiveId(a.id);
    setDraft(a);
    setEditing(true);
  };

  const saveDraft = () => {
    if (!draft) return;
    if (!draft.name.trim() || draft.instructions.trim().length < 4) {
      setError("Give the agent a name and at least a sentence of instructions.");
      return;
    }
    setError("");
    persist(agents.map((a) => (a.id === draft.id ? draft : a)));
    setEditing(false);
  };

  const send = async () => {
    if (!active || !input.trim()) return;
    if (active.instructions.trim().length < 4) {
      setError("This agent has no instructions yet — edit it first.");
      return;
    }
    setError("");
    const nextMsgs: Msg[] = [...active.messages, { role: "user", content: input.trim() }];
    persist(agents.map((a) => (a.id === active.id ? { ...a, messages: nextMsgs } : a)));
    setInput("");
    setBusy(true);
    try {
      const res = await run({
        data: {
          name: active.name,
          instructions: active.instructions,
          brandContext: active.brandContext || undefined,
          tools: active.tools,
          messages: nextMsgs.slice(-20),
        },
      });
      persist(
        agents.map((a) =>
          a.id === active.id
            ? { ...a, messages: [...nextMsgs, { role: "assistant", content: res.text }] }
            : a,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent run failed");
      persist(agents.map((a) => (a.id === active.id ? { ...a, messages: nextMsgs } : a)));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <StudioShell
      title="Custom Agents"
      subtitle="Save prompts, skills and brand context as a reusable agent your whole team can run. Agents live in this browser; every run uses Nive's models server-side."
      icon={Bot}
      accent="#0a2540"
    >
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Agent list */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={newAgent}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0a2540] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#635bff]"
          >
            <Plus className="h-4 w-4" /> New agent
          </button>
          {agents.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-3.5 transition-all ${
                a.id === activeId
                  ? "border-[#635bff] bg-white shadow-[0_0_0_3px_rgba(99,91,255,0.10)]"
                  : "border-[#0a2540]/10 bg-white hover:border-[#0a2540]/25"
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(a.id);
                    setEditing(false);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[14px] font-semibold">{a.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-[#425466]">
                    {a.instructions || "No instructions yet"}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${a.name}`}
                  onClick={() => {
                    setActiveId(a.id);
                    setDraft(a);
                    setEditing(true);
                  }}
                  className="text-[#8792a2] hover:text-[#635bff]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${a.name}`}
                  onClick={() => {
                    const next = agents.filter((x) => x.id !== a.id);
                    persist(next);
                    if (activeId === a.id) setActiveId(next[0]?.id ?? null);
                  }}
                  className="text-[#8792a2] hover:text-[#ff4d4f]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {a.tools.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.tools.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#f6f9fc] px-2 py-0.5 text-[11px] font-medium text-[#425466]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editor / chat */}
        <div className="space-y-4">
          {editing && draft ? (
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-semibold">Edit agent</h3>
                <button
                  type="button"
                  aria-label="Close editor"
                  onClick={() => setEditing(false)}
                  className="text-[#8792a2] hover:text-[#0a2540]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-4 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
                Name
              </label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-2 w-full rounded-xl border border-[#0a2540]/12 px-4 py-2.5 text-[15px] outline-none focus:border-[#635bff]"
              />
              <label className="mt-4 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
                Instructions
              </label>
              <textarea
                value={draft.instructions}
                onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                rows={5}
                placeholder="How should this agent behave? What format should it answer in?"
                className="mt-2 w-full resize-y rounded-xl border border-[#0a2540]/12 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#635bff]"
              />
              <label className="mt-4 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
                Brand context
              </label>
              <textarea
                value={draft.brandContext}
                onChange={(e) => setDraft({ ...draft, brandContext: e.target.value })}
                rows={3}
                placeholder="Product, audience, tone rules, things to never say…"
                className="mt-2 w-full resize-y rounded-xl border border-[#0a2540]/12 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#635bff]"
              />
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8792a2]">
                Skills
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SKILLS.map((s) => {
                  const on = draft.tools.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          tools: on ? draft.tools.filter((t) => t !== s) : [...draft.tools, s],
                        })
                      }
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                        on
                          ? "border-[#635bff] bg-[#635bff]/8 text-[#635bff]"
                          : "border-[#0a2540]/12 text-[#425466] hover:border-[#0a2540]/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={saveDraft}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#635bff] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#0a2540]"
              >
                Save agent
              </button>
              {error && (
                <div className="mt-4">
                  <ErrorNote message={error} />
                </div>
              )}
            </Card>
          ) : active ? (
            <Card className="flex min-h-[480px] flex-col">
              <div className="border-b border-[#0a2540]/8 pb-3">
                <h3 className="text-[17px] font-semibold">{active.name}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] text-[#425466]">{active.instructions}</p>
              </div>

              <div className="flex-1 space-y-4 py-4">
                {active.messages.length === 0 && (
                  <p className="text-[14px] text-[#8792a2]">
                    Send this agent a task to get started.
                  </p>
                )}
                {active.messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                    {m.role === "user" ? (
                      <p className="max-w-[80%] rounded-2xl bg-[#635bff] px-4 py-2.5 text-[15px] text-white">
                        {m.content}
                      </p>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-pre:bg-[#0a2540] prose-pre:text-white">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
                {busy && (
                  <p className="inline-flex items-center gap-2 text-[14px] text-[#8792a2]">
                    <Loader2 className="h-4 w-4 animate-spin" /> {active.name} is thinking…
                  </p>
                )}
              </div>

              {error && !editing && (
                <div className="mb-3">
                  <ErrorNote message={error} />
                </div>
              )}

              <div className="flex items-end gap-2 border-t border-[#0a2540]/8 pt-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={2}
                  placeholder={`Ask ${active.name}…`}
                  className="flex-1 resize-none rounded-xl border border-[#0a2540]/12 px-4 py-3 text-[15px] outline-none focus:border-[#635bff]"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a2540] text-white transition-colors hover:bg-[#635bff] disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-[15px] text-[#425466]">Create your first agent to get started.</p>
            </Card>
          )}
        </div>
      </div>
    </StudioShell>
  );
}
