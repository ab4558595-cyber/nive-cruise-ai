import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Cpu, Smartphone, Globe, Terminal, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, type Msg } from "@/components/ChatMessage";
import { Toaster } from "@/components/ui/sonner";

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

function Index() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit reached. Please wait a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Add funds in workspace settings.");
        else toast.error("Failed to get response");
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
            <p className="text-[11px] text-muted-foreground">Elite coding copilot · any language · any platform</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </header>

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
              What do you want to <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.2_320)] bg-clip-text text-transparent">build</span>?
            </h2>
            <p className="mb-10 max-w-md text-sm text-muted-foreground sm:text-base">
              From Arduino firmware to full-stack apps — describe it and Cruise AI will write the code.
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
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}
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
              placeholder="Describe what you want to code… (e.g. 'ESP32 web server that toggles a relay')"
              className="min-h-[44px] max-h-48 flex-1 resize-none border-0 bg-transparent text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                size="icon"
                onClick={stop}
                variant="secondary"
                className="h-9 w-9 shrink-0 rounded-xl"
                aria-label="Stop"
              >
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
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Cruise AI can make mistakes — always review code before deploying to hardware or production.
          </p>
        </div>
      </div>
    </div>
  );
}
