import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { cn } from "@/lib/utils";

export type Msg = { role: "user" | "assistant"; content: string };

export function ChatMessage({ message }: { message: Msg }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 px-4 py-5", !isUser && "bg-muted/30")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2 overflow-hidden text-sm leading-relaxed">
        <div className="text-xs font-medium text-muted-foreground">{isUser ? "You" : "AI Coder"}</div>
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
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-muted-foreground/40" />
        )}
      </div>
    </div>
  );
}
