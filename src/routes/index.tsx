import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send, Sparkles, Trash2, Cpu, Smartphone, Globe, Terminal, Square, Tag,
  LogIn, LogOut, Shield, PlayCircle, Download, Mic, MicOff, SlidersHorizontal,
  PanelLeftOpen, Plus, MessageSquare, Sun,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, type Msg } from "@/components/ChatMessage";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { LivePreview, detectPreview, type PreviewSpec } from "@/components/LivePreview";
import { FileTree } from "@/components/FileTree";
import { parseFiles } from "@/lib/parseFiles";
import { ConversationsSidebar } from "@/components/ConversationsSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette, type PaletteCommand } from "@/components/CommandPalette";
import { useChatStore } from "@/lib/chatStore";
import { PRESETS } from "@/lib/presets";
import { createVoiceInput, isVoiceSupported } from "@/lib/voiceInput";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Ribbon } from "@/components/Ribbon";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nive AI — Elite coding copilot for any platform" },
      { name: "description", content: "Chat with Nive AI to generate production-quality code for web, mobile, embedded, and ML projects — with live preview and multi-file output." },
      { property: "og:title", content: "Nive AI — Elite coding copilot for any platform" },
      { property: "og:description", content: "Chat with Nive AI to generate production-quality code for web, mobile, embedded, and ML projects — with live preview and multi-file output." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-code`;

const SUGGESTIONS = [
  { icon: Cpu,       label: "ESP32 Wi-Fi relay",     prompt: "Write Arduino code for ESP32 that hosts a tiny web server to toggle a relay on GPIO 26, with HTML controls." },
  { icon: Smartphone,label: "SwiftUI login screen",  prompt: "Create a polished SwiftUI login screen with email/password validation and a sign-in button." },
  { icon: Globe,     label: "React + TS todo app",   prompt: "Build a React + TypeScript todo app with add, complete, delete, filters, and localStorage persistence." },
  { icon: Terminal,  label: "Python scraper",        prompt: "Write a Python script using requests + BeautifulSoup to scrape Hacker News front page into a CSV." },
];

function Index() {
  const navigate = useNavigate();
  const store = useChatStore();
  const messages = store.active.messages;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [previewSpec, setPreviewSpec] = useState<PreviewSpec | null>(null);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [sideTab, setSideTab] = useState<"files" | "preview">("files");
  const [sideDismissed, setSideDismissed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [preset, setPreset] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem("cruise-ai-preset") || "default";
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const voiceRef = useRef<ReturnType<typeof createVoiceInput>>(null);

  useEffect(() => { try { localStorage.setItem("cruise-ai-preset", preset); } catch {} }, [preset]);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.content || "",
    [messages],
  );
  const parsedFiles = useMemo(() => parseFiles(latestAssistant), [latestAssistant]);
  useEffect(() => {
    if (previewDismissed) return;
    const spec = detectPreview(latestAssistant);
    if (spec) setPreviewSpec(spec); else setPreviewSpec(null);
  }, [latestAssistant, previewDismissed]);
  useEffect(() => {
    if (previewSpec) setSideTab("preview");
    else if (parsedFiles.length >= 1) setSideTab("files");
  }, [parsedFiles.length, previewSpec]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { window.location.replace("/welcome"); return; }
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

  // Keyboard shortcuts: ⌘/Ctrl+N new chat, ⌘/Ctrl+/ focus composer, Esc stops voice
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "n") { e.preventDefault(); store.newChat(); }
      else if (meta && e.key === "/") { e.preventDefault(); composerRef.current?.focus(); }
      else if (e.key === "Escape" && voiceOn) { stopVoice(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOn, store.newChat]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    store.setActiveMessages(() => next);
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
        body: JSON.stringify({ messages: next, preset }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        let msg = "Failed to get response";
        try { const j = await resp.json(); if (j?.error) msg = j.error; } catch {}
        if (resp.status === 401) toast.error(msg, { action: { label: "Sign in", onClick: () => (window.location.href = "/auth") } });
        else if (resp.status === 429) toast.error(msg, { action: { label: "Upgrade", onClick: () => (window.location.href = "/pricing") } });
        else if (resp.status === 402) toast.error(msg);
        else toast.error(msg);
        store.setActiveMessages((m) => m.slice(0, -1));
        setIsLoading(false);
        return;
      }

      store.setActiveMessages((m) => [...m, { role: "assistant", content: "" }]);

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
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              store.setActiveMessages((m) => {
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
      if (e.name !== "AbortError") { console.error(e); toast.error("Something went wrong"); }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => { abortRef.current?.abort(); setIsLoading(false); };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const startVoice = () => {
    if (!isVoiceSupported()) { toast.error("Voice input is not supported in this browser."); return; }
    const v = createVoiceInput({
      onPartial: (t) => setInput((prev) => (prev ? prev.replace(/\s*\(listening…\).*$/, "") : "") + " " + t),
      onFinal: (t) => {
        setInput((prev) => (prev ? prev.trim() + " " : "") + t);
        setVoiceOn(false);
      },
      onError: (m) => { toast.error(`Voice: ${m}`); setVoiceOn(false); },
    });
    if (!v) return;
    voiceRef.current = v;
    v.start();
    setVoiceOn(true);
  };
  const stopVoice = () => { voiceRef.current?.stop(); setVoiceOn(false); };

  const exportMarkdown = () => {
    const md = messages.map((m) => `### ${m.role === "user" ? "You" : "Nive AI"}\n\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(store.active.title || "cruise-chat").replace(/[^\w]+/g, "-")}-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  };

  const palette: PaletteCommand[] = [
    { id: "new", label: "New chat", group: "Chat", icon: Plus, shortcut: "⌘N", run: () => store.newChat() },
    { id: "clear", label: "Clear current chat", group: "Chat", icon: Trash2, run: () => store.clearActive() },
    { id: "export", label: "Export chat as Markdown", group: "Chat", icon: Download, run: exportMarkdown },
    { id: "focus", label: "Focus composer", group: "Chat", icon: MessageSquare, shortcut: "⌘/", run: () => composerRef.current?.focus() },
    { id: "voice", label: voiceOn ? "Stop voice input" : "Start voice input", group: "Chat", icon: voiceOn ? MicOff : Mic, run: () => (voiceOn ? stopVoice() : startVoice()) },
    { id: "theme", label: "Toggle theme", group: "App", icon: Sun, run: () => {
      const m = (localStorage.getItem("cruise-ai-theme") || "dark") as "dark" | "light" | "system";
      const next = m === "dark" ? "light" : m === "light" ? "system" : "dark";
      localStorage.setItem("cruise-ai-theme", next);
      window.location.reload();
    } },
    { id: "sidebar", label: sidebarCollapsed ? "Show sidebar" : "Hide sidebar", group: "App", icon: PanelLeftOpen, run: () => setSidebarCollapsed((v) => !v) },
    { id: "pricing", label: "Go to Pricing", group: "Navigate", icon: Tag, run: () => navigate({ to: "/pricing" }) },
    { id: "welcome", label: "Go to Welcome", group: "Navigate", icon: Sparkles, run: () => navigate({ to: "/welcome" }) },
    ...(isAdmin ? [{ id: "admin", label: "Open Admin", group: "Navigate", icon: Shield, run: () => navigate({ to: "/admin" }) } as PaletteCommand] : []),
    ...(user ? [{ id: "signout", label: "Sign out", group: "Account", icon: LogOut, run: () => supabase.auth.signOut() } as PaletteCommand] : []),
  ];

  const presetMeta = PRESETS.find((p) => p.id === preset) ?? PRESETS[0];
  const PresetIcon = presetMeta.icon;

  return (
    <div className="relative flex h-screen overflow-hidden bg-white text-[#0a2540]" style={{ fontFamily: "Inter, 'Sohne', system-ui, sans-serif" }}>
      <Toaster richColors position="top-center" />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={palette} />

      <ConversationsSidebar
        conversations={store.conversations}
        activeId={store.active.id}
        onSelect={store.select}
        onNew={store.newChat}
        onRename={store.rename}
        onTogglePin={store.togglePin}
        onDelete={store.remove}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <Ribbon />

        <header className="flex items-center justify-between border-b border-border/60 px-3 py-2.5 backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-3 min-w-0">
            {sidebarCollapsed && (
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(false)} className="hidden md:inline-flex h-8 w-8 p-0 text-muted-foreground hover:text-foreground" aria-label="Show sidebar">
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-lg" style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight tracking-tight">
                {store.active.title || "Nive AI — Elite coding copilot"}
              </h1>
              <p className="text-[11px] text-muted-foreground">Nive AI · ⌘K for commands</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPaletteOpen(true)} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground" aria-label="Open command palette">
              <kbd className="hidden rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] sm:inline-block">⌘K</kbd>
            </Button>
            <ThemeToggle />
            {messages.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={exportMarkdown} aria-label="Export conversation as Markdown" className="text-muted-foreground hover:text-foreground">
                  <Download className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={store.clearActive} aria-label="Clear current chat" className="text-muted-foreground hover:text-foreground">
                  <Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Clear</span>
                </Button>
              </>
            )}
            {previewDismissed && detectPreview(latestAssistant) && (
              <Button variant="ghost" size="sm" onClick={() => { setPreviewDismissed(false); setSideDismissed(false); setPreviewSpec(detectPreview(latestAssistant)); }} aria-label="Show live preview" className="text-muted-foreground hover:text-foreground">
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
              <h1 className="sr-only">Nive AI — Elite AI coding copilot for any platform</h1>
              {messages.length === 0 ? (
                <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
                  <div className="mb-8 h-20 w-20 rounded-2xl p-[1px]" style={{ background: "var(--gradient-brand)" }}>
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-background/80 backdrop-blur-md">
                      <Sparkles className="h-9 w-9 text-foreground" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h2 className="mb-5 text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl" style={{ fontFamily: "var(--font-serif)" }}>
                    What are we{" "}
                    <span className="italic bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-brand)" }}>
                      building
                    </span>{" "}
                    today?
                  </h2>
                  <p className="mb-12 max-w-md text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
                    Tell me what you need — a firmware sketch, a web app, a Python script. I'll write it, organise the files, and run the web ones live on the right.
                  </p>
                  <div className="grid w-full gap-4 text-left sm:grid-cols-2">
                    {SUGGESTIONS.map((s, idx) => {
                      const Icon = s.icon;
                      const accents = ["#6c5ce7", "#e84393", "#f7931e", "#ff6b35"];
                      const accent = accents[idx % accents.length];
                      return (
                        <button
                          key={s.label}
                          onClick={() => send(s.prompt)}
                          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-6 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.06]"
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="relative flex flex-col gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-sm font-medium text-foreground/90">{s.label}</div>
                            <div className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{s.prompt}</div>
                          </div>
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
                          store.setActiveMessages(() => messages.slice(0, i));
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
                      Nive AI is thinking…
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border/60 bg-background/80 px-3 py-3 backdrop-blur-md sm:px-4">
              <div className="mx-auto max-w-3xl">
                <div className="relative flex items-end gap-2 rounded-2xl border border-border/70 bg-card/70 p-2 shadow-[var(--shadow-elegant)] transition-all focus-within:border-primary/50 focus-within:shadow-[var(--shadow-glow)]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground" title={`Style: ${presetMeta.label}`} aria-label="Style preset">
                        <PresetIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-1">
                      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Style preset</div>
                      {PRESETS.map((p) => {
                        const Icon = p.icon;
                        const active = p.id === preset;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPreset(p.id)}
                            className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${active ? "bg-primary/15 text-primary" : "hover:bg-muted"}`}
                          >
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium">{p.label}</div>
                              <div className="truncate text-[11px] text-muted-foreground">{p.hint}</div>
                            </div>
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>

                  <Textarea
                    ref={composerRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={voiceOn ? "Listening…" : "Describe what you want to code… (⌘/ to focus)"}
                    className="min-h-[44px] max-h-48 flex-1 resize-none border-0 bg-transparent text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                    disabled={isLoading}
                  />

                  {isVoiceSupported() && (
                    <Button
                      size="icon"
                      variant={voiceOn ? "default" : "ghost"}
                      onClick={() => (voiceOn ? stopVoice() : startVoice())}
                      className={`h-9 w-9 shrink-0 rounded-xl ${voiceOn ? "animate-pulse bg-destructive text-destructive-foreground hover:bg-destructive/90" : "text-muted-foreground hover:text-foreground"}`}
                      aria-label={voiceOn ? "Stop voice input" : "Start voice input"}
                      title={voiceOn ? "Stop voice input (Esc)" : "Voice input"}
                    >
                      {voiceOn ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}

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
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Style: <span className="text-foreground/80">{presetMeta.label}</span></span>
                    <span className="hidden sm:inline">· Enter to send · Shift+Enter for newline</span>
                  </span>
                  <span className={input.length > 4000 ? "text-destructive" : ""}>{input.length} chars</span>
                </div>
              </div>
            </div>
          </div>

          {(parsedFiles.length > 0 || previewSpec) && !sideDismissed && (
            <div className="hidden w-[48%] min-w-[400px] max-w-[760px] flex-col md:flex">
              <div className="flex items-center gap-1 border-b border-l border-border/60 bg-card/40 px-2 py-1.5">
                {parsedFiles.length > 0 && (
                  <button onClick={() => setSideTab("files")} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${sideTab === "files" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    Files <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px] text-muted-foreground">{parsedFiles.length}</span>
                  </button>
                )}
                {previewSpec && (
                  <button onClick={() => setSideTab("preview")} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${sideTab === "preview" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
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
    </div>
  );
}
