import { useMemo, useState } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { X, ExternalLink, Code2, Eye, FileCode, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export type PreviewSpec = {
  template: "static" | "react" | "vanilla";
  files: Record<string, string>;
  entry?: string;
};

const FILENAME_RE = /(?:\*\*|##\s*|`)([\w./-]+\.(?:html?|css|jsx?|tsx?|json|md|svg))(?:\*\*|`)?/i;

function guessLangFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return { ts: "ts", tsx: "tsx", js: "js", jsx: "jsx", css: "css", html: "html", json: "json", md: "md" }[ext] ?? "text";
}

function normalizePath(p: string): string {
  let out = p.trim().replace(/^\.?\/+/, "");
  if (!out.startsWith("/")) out = "/" + out;
  return out;
}

/** Detect HTML / React / multi-file projects in an assistant message. */
export function detectPreview(content: string): PreviewSpec | null {
  if (!content) return null;

  // Walk the content sequentially so we can attach a filename header that
  // appears immediately before a fenced code block (Cruise AI convention).
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { lang: string; code: string; name?: string }[] = [];
  let m: RegExpExecArray | null;
  let cursor = 0;
  while ((m = re.exec(content)) !== null) {
    const preceding = content.slice(cursor, m.index).split("\n").slice(-4).join("\n");
    const nameMatch = preceding.match(FILENAME_RE);
    blocks.push({
      lang: (m[1] || "").toLowerCase(),
      code: m[2],
      name: nameMatch?.[1],
    });
    cursor = re.lastIndex;
  }
  if (blocks.length === 0) return null;

  // ---- Multi-file React-style project (any block has a /src or App.* filename)
  const named = blocks.filter((b) => b.name);
  const reactish = named.filter((b) =>
    /\.(tsx|jsx)$/i.test(b.name!) || /^src\//i.test(b.name!.replace(/^\/+/, "")),
  );
  if (reactish.length >= 1 && named.length >= 2) {
    const files: Record<string, string> = {};
    for (const b of named) files[normalizePath(b.name!)] = b.code;
    // Ensure an entry exists
    if (!files["/App.tsx"] && !files["/App.jsx"] && !files["/src/App.tsx"] && !files["/src/App.jsx"]) {
      const firstTsx = Object.keys(files).find((k) => /\.(tsx|jsx)$/.test(k));
      if (firstTsx && firstTsx !== "/App.tsx") files["/App.tsx"] = files[firstTsx];
    }
    return { template: "react", files };
  }

  // ---- Multi-file static (index.html + others)
  if (named.some((b) => /index\.html?$/i.test(b.name!))) {
    const files: Record<string, string> = {};
    for (const b of named) files[normalizePath(b.name!)] = b.code;
    return { template: "static", files, entry: "/index.html" };
  }

  // ---- Single full HTML doc
  const htmlBlock =
    blocks.find((b) => /^html?$/.test(b.lang) && /<html[\s>]/i.test(b.code)) ||
    blocks.find((b) => /^html?$/.test(b.lang)) ||
    blocks.find((b) => /<!doctype html|<html[\s>]/i.test(b.code));
  if (htmlBlock) {
    const css = blocks.find((b) => b.lang === "css")?.code;
    const js = blocks.find((b) => ["js", "javascript"].includes(b.lang))?.code;
    let code = htmlBlock.code;
    if (!/<html[\s>]/i.test(code)) {
      code = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body>${code}</body></html>`;
    }
    if (css && !/<style/i.test(code)) code = code.replace(/<\/head>/i, `<style>${css}</style></head>`);
    if (js && !/<script[^>]*>[\s\S]+?<\/script>/i.test(code)) code = code.replace(/<\/body>/i, `<script>${js}</script></body>`);
    return { template: "static", files: { "/index.html": code } };
  }

  // ---- Single React component
  const jsx = blocks.find(
    (b) => ["jsx", "tsx"].includes(b.lang) && /(export\s+default|function\s+App|=>\s*\()/.test(b.code),
  );
  if (jsx) {
    const ext = jsx.lang === "tsx" ? "tsx" : "jsx";
    return { template: "react", files: { [`/App.${ext}`]: jsx.code } };
  }

  // ---- JS that touches the DOM → wrap
  const js = blocks.find((b) => ["js", "javascript"].includes(b.lang));
  const css = blocks.find((b) => b.lang === "css");
  if (js && /document\.|window\.|getElementById|querySelector/.test(js.code)) {
    const code = `<!DOCTYPE html><html><head><meta charset="utf-8"/>${css ? `<style>${css.code}</style>` : ""}</head><body><div id="app"></div><script>${js.code}</script></body></html>`;
    return { template: "static", files: { "/index.html": code } };
  }
  return null;
}

const PAID_PLANS = new Set(["starter", "pro"]);

export function LivePreview({
  spec,
  onClose,
  plan,
}: {
  spec: PreviewSpec;
  onClose: () => void;
  plan?: string | null;
}) {
  const isPaid = plan ? PAID_PLANS.has(plan) : false;
  const [mode, setMode] = useState<"preview" | "code">("preview");
  const fileNames = useMemo(() => Object.keys(spec.files), [spec.files]);
  const [activeFile, setActiveFile] = useState<string>(fileNames[0] ?? "");
  const key = useMemo(
    () => JSON.stringify(spec.files).length + ":" + spec.template + ":" + mode,
    [spec, mode],
  );

  const tryCode = () => {
    if (!isPaid) return;
    setMode("code");
  };

  return (
    <div className="flex h-full flex-col border-l border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium tracking-tight">Live preview</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {spec.template === "react" ? "React" : "HTML"}
          </span>
          {fileNames.length > 1 && (
            <span className="text-[10px] text-muted-foreground">· {fileNames.length} files</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="mr-1 flex rounded-md border border-border/60 p-0.5">
            <button
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${
                mode === "preview" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
            <button
              onClick={tryCode}
              title={isPaid ? "View source" : "Source view is a Starter / Pro feature"}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${
                mode === "code"
                  ? "bg-primary/15 text-primary"
                  : isPaid
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/60"
              }`}
            >
              {isPaid ? <Code2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />} Code
            </button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              const file = spec.files[spec.entry ?? "/index.html"] || Object.values(spec.files)[0];
              const blob = new Blob([file], { type: "text/html" });
              window.open(URL.createObjectURL(blob), "_blank");
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {mode === "preview" ? (
          <Sandpack
            key={key}
            template={spec.template === "react" ? "react" : "static"}
            files={spec.files}
            theme="dark"
            options={{
              showNavigator: true,
              showTabs: false,
              showLineNumbers: false,
              editorHeight: "100%",
              layout: "preview",
            }}
          />
        ) : isPaid ? (
          <div className="flex h-full">
            {fileNames.length > 1 && (
              <aside className="w-48 shrink-0 overflow-auto border-r border-border/60 bg-card/40 p-2">
                <div className="mb-1 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">Files</div>
                {fileNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveFile(name)}
                    className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12px] transition-colors ${
                      activeFile === name
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <FileCode className="h-3 w-3 shrink-0" />
                    <span className="truncate font-mono">{name.replace(/^\//, "")}</span>
                  </button>
                ))}
              </aside>
            )}
            <div className="flex-1 overflow-auto bg-[#0b0b12] p-3">
              <div className="mb-1 font-mono text-[11px] text-muted-foreground">
                {activeFile} · {guessLangFromName(activeFile)}
              </div>
              <pre className="overflow-auto rounded-md border border-border/40 bg-black/40 p-3 font-mono text-[12px] leading-relaxed text-foreground">
                <code>{spec.files[activeFile]}</code>
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Source view is paid</div>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Browsing the generated file tree and copying individual files is part of Starter and Pro. Free plan keeps the live preview.
              </p>
            </div>
            <Button asChild size="sm" className="mt-1">
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
