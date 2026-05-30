import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Cpu, Smartphone, Globe, Terminal, Square, Tag, LogIn, LogOut, Shield, PlayCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, type Msg } from "@/components/ChatMessage";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { LivePreview, detectPreview, type PreviewSpec } from "@/components/LivePreview";
import { FileTree } from "@/components/FileTree";
import { parseFiles } from "@/lib/parseFiles";


export const Route = createFileRoute("/")({
  component: Index,
});

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-code`;

const SUGGESTIONS = [
  {
    icon: Cpu,
    label: "ESP32 Wi-Fi relay",
    prompt: "Write Arduino code for ESP32 that hosts a tiny web server to toggle a relay on GPIO 26, with HTML controls.",
  },
  {
    icon: Smartphone,
    label: "SwiftUI login screen",
    prompt: "Create a polished SwiftUI login screen with email/password validation and a sign-in button.",
  },
  {
    icon: Globe,
    label: "React + TS todo app",
    prompt: "Build a React + TypeScript todo app with add, complete, delete, filters, and localStorage persistence.",
  },
  {
    icon: Terminal,
    label: "Python scraper",
    prompt: "Write a Python script using requests + BeautifulSoup to scrape Hacker News front page into a CSV.",
  },
];

const STORAGE_KEY = "cruise-ai-conversation-v1";

function Index() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Msg[]) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [previewSpec, setPreviewSpec] = useState<PreviewSpec | null>(null);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [sideTab, setSideTab] = useState<"files" | "preview">("files");
  const [sideDismissed, setSideDismissed] = useState(false);

  // Persist conversation
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* quota */ }
  }, [messages]);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.content || "",
    [messages],
  );
  const parsedFiles = useMemo(() => parseFiles(latestAssistant), [latestAssistant]);
  useEffect(() => {
    if (previewDismissed) return;
    const spec = detectPreview(latestAssistant);
    if (spec) setPreviewSpec(spec);
  }, [latestAssistant, previewDismissed]);
  useEffect(() => {
    // auto-pick the most useful tab when content changes
    if (parsedFiles.length >= 2) setSideTab("files");
    else if (previewSpec) setSideTab("preview");
  }, [parsedFiles.length, previewSpec]);


  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.replace("/welcome");
        return;
      }
      setUser({ email: session.user.email });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      const { data: plan } = await supabase
        .from("user_plans").select("plan_id, expires_at").eq("user_id", session.user.id).eq("active", true)
        .gte("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle();
      setActivePlan(plan?.plan_id ?? null);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ? { email: s.user.email } : null);
      if (!s) { setIsAdmin(false); setActivePlan(null); window.location.replace("/welcome"); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        let msg = "Failed to get response";
        try {
          const j = await resp.json();
          if (j?.error) msg = j.error;
        } catch { /* ignore */ }
        if (resp.status === 401) toast.error(msg, { action: { label: "Sign in", onClick: () => (window.location.href = "/auth") } });
        else if (resp.status === 429) toast.error(msg, { action: { label: "Upgrade", onClick: () => (window.location.href = "/pricing") } });
        else if (resp.status === 402) toast.error("AI credits exhausted. Add funds in workspace settings.");
        else toast.error(msg);
        setMessages((m) => m.slice(0, -1));
        setIsLoading(false);
        return;
      }


      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Toaster richColors position="top-center" theme="dark" />

      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-surface)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />

      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg"
            style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight tracking-tight">
              Cruise <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.2_320)] bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">A coding companion for messy real projects.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const md = messages.map((m) => `### ${m.role === "user" ? "You" : "Cruise AI"}\n\n${m.content}`).join("\n\n---\n\n");
                  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `cruise-chat-${Date.now()}.md`; a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Conversation exported");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setMessages([]); setPreviewSpec(null); setPreviewDismissed(false); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </>
          )}
          {previewDismissed && detectPreview(latestAssistant) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setPreviewDismissed(false); setPreviewSpec(detectPreview(latestAssistant)); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <PlayCircle className="h-4 w-4" /><span className="hidden sm:inline">Preview</span>
            </Button>
          )}
          {activePlan && (
            <span className="hidden rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:inline-flex">
              {activePlan.toUpperCase()}
            </span>
          )}
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/pricing"><Tag className="h-4 w-4" /><span className="hidden sm:inline">Pricing</span></Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/admin"><Shield className="h-4 w-4" /><span className="hidden sm:inline">Admin</span></Link>
            </Button>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/auth"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Sign in</span></Link>
            </Button>
          )}
        </div>
      </header>


      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
                <div
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground"
                  style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}
                >
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  What are we <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.2_320)] bg-clip-text text-transparent">building</span> today?
                </h2>
                <p className="mb-10 max-w-md text-sm text-muted-foreground sm:text-base">
                  Tell me what you need — a firmware sketch, a web app, a Python script. I'll write it, organise the files, and run the web ones live on the right.
                </p>
                <div className="grid w-full gap-3 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => send(s.prompt)}
                        className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-[var(--shadow-glow)]"
                      >
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.prompt}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl px-2 pb-4 sm:px-4">
                {messages.map((m, i) => {
                  const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
                  return (
                    <ChatMessage
                      key={i}
                      message={m}
                      onRegenerate={isLastAssistant && !isLoading ? () => {
                        const lastUser = [...messages].slice(0, i).reverse().find((x) => x.role === "user");
                        if (!lastUser) return;
                        setMessages(messages.slice(0, i));
                        send(lastUser.content);
                      } : undefined}
                    />
                  );
                })}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                    </span>
                    Cruise AI is thinking…
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border/60 bg-background/80 px-3 py-3 backdrop-blur-md sm:px-4">
            <div className="mx-auto max-w-3xl">
              <div
                className="relative flex items-end gap-2 rounded-2xl border border-border/70 bg-card/70 p-2 shadow-[var(--shadow-elegant)] transition-all focus-within:border-primary/50 focus-within:shadow-[var(--shadow-glow)]"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Describe what you want to code… (e.g. 'a snake game in HTML/JS')"
                  className="min-h-[44px] max-h-48 flex-1 resize-none border-0 bg-transparent text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                  disabled={isLoading}
                />
                {isLoading ? (
                  <Button size="icon" onClick={stop} variant="secondary" className="h-9 w-9 shrink-0 rounded-xl" aria-label="Stop">
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={() => send(input)}
                    disabled={!input.trim()}
                    className="h-9 w-9 shrink-0 rounded-xl text-primary-foreground transition-opacity hover:opacity-90"
                    style={{ background: "var(--gradient-brand)" }}
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                <span>Enter to send · Shift+Enter for newline</span>
                <span className={input.length > 4000 ? "text-destructive" : ""}>{input.length} chars</span>
              </div>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                Review the code before flashing it to a board or shipping it to prod — I get things wrong too.
              </p>
            </div>
          </div>
        </div>

        {(parsedFiles.length > 0 || previewSpec) && !sideDismissed && (
          <div className="hidden w-[48%] min-w-[400px] max-w-[760px] flex-col md:flex">
            <div className="flex items-center gap-1 border-b border-l border-border/60 bg-card/40 px-2 py-1.5">
              {parsedFiles.length > 0 && (
                <button
                  onClick={() => setSideTab("files")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${sideTab === "files" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Files <span className="ml-1 rounded-full bg-white/5 px-1.5 text-[10px]">{parsedFiles.length}</span>
                </button>
              )}
              {previewSpec && (
                <button
                  onClick={() => setSideTab("preview")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${sideTab === "preview" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Preview
                </button>
              )}
              <div className="ml-auto">
                <Button variant="ghost" size="sm" onClick={() => { setSideDismissed(true); setPreviewDismissed(true); }} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                  Hide
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              {sideTab === "files" && parsedFiles.length > 0 ? (
                <FileTree content={latestAssistant} onClose={() => setSideDismissed(true)} />
              ) : previewSpec ? (
                <LivePreview spec={previewSpec} plan={activePlan} onClose={() => { setPreviewDismissed(true); setPreviewSpec(null); setSideTab("files"); }} />
              ) : null}
            </div>
          </div>
        )}
        {sideDismissed && (parsedFiles.length > 0 || previewSpec) && (
          <button
            onClick={() => { setSideDismissed(false); setPreviewDismissed(false); }}
            className="absolute right-4 top-20 hidden rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary shadow-lg backdrop-blur md:block"
          >
            Show files / preview
          </button>
        )}
      </div>
    </div>
  );
}
