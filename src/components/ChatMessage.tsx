import ReactMarkdown from "react-markdown";
import { Bot, User, Copy, RefreshCcw, Check } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type Msg = { role: "user" | "assistant"; content: string };

export function ChatMessage({
  message,
  onRegenerate,
}: {
  message: Msg;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className={cn("group flex gap-3 px-4 py-5 transition-colors", !isUser && "bg-muted/40")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "text-primary-foreground",
        )}
        style={!isUser ? { background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" } : undefined}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2 overflow-hidden text-sm leading-relaxed">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground">
            {isUser ? "You" : "Nive AI"}
          </div>
          {message.content && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={copy}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Copy message"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {!isUser && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Regenerate"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {message.content ? (
          <ReactMarkdown
            components={{
              code({ className, children, ...props }: any) {
                const inline = !className;
                const match = /language-(\w+)/.exec(className || "");
                if (inline) {
                  return (
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]" {...props}>
                      {children}
                    </code>
                  );
                }
                return <CodeBlock language={match?.[1] || ""} value={String(children)} />;
              },
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="my-2 list-disc pl-6">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 list-decimal pl-6">{children}</ol>,
              h1: ({ children }) => <h1 className="mb-2 mt-3 text-lg font-semibold">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-2 mt-3 text-base font-semibold">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-2 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <span className="inline-flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
          </span>
        )}
      </div>
    </div>
  );
}
