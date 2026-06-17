import { useEffect, useMemo, useRef, useState } from "react";
import { X, ExternalLink, Code2, Eye, FileCode, Lock, RefreshCw } from "lucide-react";
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
  const fenceCount = (content.match(/```/g) || []).length;
  const text = fenceCount % 2 === 1 ? content + "\n```" : content;

  const re = /```(\w+)?\n?([\s\S]*?)```/g;
  const blocks: { lang: string; code: string; name?: string }[] = [];
  let m: RegExpExecArray | null;
  let cursor = 0;
  while ((m = re.exec(text)) !== null) {
    const preceding = text.slice(cursor, m.index).split("\n").slice(-4).join("\n");
    const nameMatch = preceding.match(FILENAME_RE);
    blocks.push({ lang: (m[1] || "").toLowerCase(), code: m[2] || "", name: nameMatch?.[1] });
    cursor = re.lastIndex;
  }
  if (blocks.length === 0) return null;

  const named = blocks.filter((b) => b.name);
  const reactish = named.filter((b) =>
    /\.(tsx|jsx)$/i.test(b.name!) || /^src\//i.test(b.name!.replace(/^\/+/, "")),
  );
  if (reactish.length >= 1 && named.length >= 2) {
    const files: Record<string, string> = {};
    for (const b of named) files[normalizePath(b.name!)] = b.code;
    if (!files["/App.tsx"] && !files["/App.jsx"] && !files["/src/App.tsx"] && !files["/src/App.jsx"]) {
      const firstTsx = Object.keys(files).find((k) => /\.(tsx|jsx)$/.test(k));
      if (firstTsx && firstTsx !== "/App.tsx") files["/App.tsx"] = files[firstTsx];
    }
    return { template: "react", files };
  }

  if (named.some((b) => /index\.html?$/i.test(b.name!))) {
    const files: Record<string, string> = {};
    for (const b of named) files[normalizePath(b.name!)] = b.code;
    return { template: "static", files, entry: "/index.html" };
  }

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

  const jsx = blocks.find(
    (b) => ["jsx", "tsx"].includes(b.lang) && /(export\s+default|function\s+App|=>\s*\()/.test(b.code),
  );
  if (jsx) {
    const ext = jsx.lang === "tsx" ? "tsx" : "jsx";
    return { template: "react", files: { [`/App.${ext}`]: jsx.code } };
  }

  const js = blocks.find((b) => ["js", "javascript"].includes(b.lang));
  const css = blocks.find((b) => b.lang === "css");
  if (js && /document\.|window\.|getElementById|querySelector/.test(js.code)) {
    const code = `<!DOCTYPE html><html><head><meta charset="utf-8"/>${css ? `<style>${css.code}</style>` : ""}</head><body><div id="app"></div><script>${js.code}</script></body></html>`;
    return { template: "static", files: { "/index.html": code } };
  }
  return null;
}

const PAID_PLANS = new Set(["starter", "pro"]);

/** Build a single HTML document from a spec so we can render it inside a plain <iframe srcDoc>. */
function buildIframeDoc(spec: PreviewSpec): string {
  // ---- Static / vanilla: prefer the entry HTML, inline any sibling css/js by name.
  if (spec.template !== "react") {
    const entry =
      spec.files[spec.entry ?? "/index.html"] ||
      spec.files["/index.html"] ||
      Object.values(spec.files)[0] ||
      "";
    let doc = entry;
    // Inline same-folder assets referenced by <link href> / <script src>.
    for (const [path, content] of Object.entries(spec.files)) {
      const name = path.replace(/^\//, "");
      if (/\.css$/i.test(name)) {
        const tag = new RegExp(`<link[^>]+href=["']\\.?/?${name}["'][^>]*>`, "i");
        doc = doc.replace(tag, `<style>${content}</style>`);
      } else if (/\.js$/i.test(name)) {
        const tag = new RegExp(`<script[^>]+src=["']\\.?/?${name}["'][^>]*></script>`, "i");
        doc = doc.replace(tag, `<script>${content}</script>`);
      }
    }
    return doc;
  }

  // ---- React: bundle the user's files into one Babel-transpiled in-browser module.
  const reactFiles: Record<string, string> = {};
  for (const [k, v] of Object.entries(spec.files)) {
    reactFiles[k.replace(/^\//, "")] = v;
  }
  const entry =
    reactFiles["src/App.tsx"] ||
    reactFiles["src/App.jsx"] ||
    reactFiles["App.tsx"] ||
    reactFiles["App.jsx"] ||
    Object.values(reactFiles)[0] ||
    "export default function App(){return null}";

  // Strip imports/exports so Babel can run the file as a script that defines `App`.
  const cleaned = entry
    .replace(/^\s*import[^;]+;?\s*$/gm, "")
    .replace(/^\s*export\s+default\s+/gm, "var App = ")
    .replace(/^\s*export\s+/gm, "");

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>html,body,#root{height:100%;margin:0;font-family:system-ui,sans-serif}</style>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="env,react,typescript">
${cleaned}
try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(typeof App !== 'undefined' ? App : (() => 'No <App /> export found')));
} catch (e) {
  document.getElementById('root').innerText = String(e);
}
</script>
</body></html>`;
}

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
  const [reloadKey, setReloadKey] = useState(0);
  const fileNames = useMemo(() => Object.keys(spec.files), [spec.files]);
  const [activeFile, setActiveFile] = useState<string>(fileNames[0] ?? "");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const doc = useMemo(() => buildIframeDoc(spec), [spec]);

  // Build a real hosted blob: URL so the iframe loads from src (not srcDoc).
  // This gives React apps a proper document origin, working relative URLs,
  // history, and devtools navigation.
  const blobUrl = useMemo(() => {
    const blob = new Blob([doc], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [doc]);

  useEffect(() => {
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  const tryCode = () => {
    if (!isPaid) return;
    setMode("code");
  };

  const openInTab = () => {
    window.open(blobUrl, "_blank");
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
          {mode === "preview" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReloadKey((k) => k + 1)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Reload preview"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={openInTab}
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
      <div className="flex-1 overflow-hidden bg-white">
        {mode === "preview" ? (
          <iframe
            ref={iframeRef}
            key={`${blobUrl}-${reloadKey}`}
            title="Live preview"
            src={blobUrl}
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
            className="h-full w-full border-0 bg-white"
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
