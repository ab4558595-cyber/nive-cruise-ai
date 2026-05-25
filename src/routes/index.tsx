import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Code2 } from "lucide-react";
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
  { label: "Arduino LED blink on ESP32", prompt: "Write Arduino code for ESP32 to blink an LED on GPIO 2 every 500ms." },
  { label: "React todo app", prompt: "Build a React + TypeScript todo app with add, complete, and delete." },
  { label: "Python web scraper", prompt: "Write a Python script using requests + BeautifulSoup to scrape article titles from Hacker News." },
  { label: "SwiftUI login screen", prompt: "Create a SwiftUI login screen with email, password, and a sign-in button." },
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Toaster richColors position="top-center" />
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">AI Coder</h1>
            <p className="text-xs text-muted-foreground">Write any code — Arduino, apps, scripts, anything</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold">What do you want to build?</h2>
            <p className="mb-8 text-sm text-muted-foreground">
              From Arduino sketches to full-stack apps — describe it and I'll write the code.
            </p>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-accent"
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{s.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe what you want to code... (e.g. 'ESP32 web server that toggles a relay')"
              className="min-h-[44px] max-h-48 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            AI can make mistakes — always review code before deploying to hardware.
          </p>
        </div>
      </div>
    </div>
  );
}
