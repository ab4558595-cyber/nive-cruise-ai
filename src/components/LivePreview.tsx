import { useMemo } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PreviewSpec = {
  template: "static" | "react" | "vanilla";
  files: Record<string, string>;
};

/** Detect HTML / React / JS in an assistant message and produce a Sandpack spec. */
export function detectPreview(content: string): PreviewSpec | null {
  if (!content) return null;
  const blocks = [...content.matchAll(/```(\w+)?\n([\s\S]*?)```/g)].map((m) => ({
    lang: (m[1] || "").toLowerCase(),
    code: m[2],
  }));
  if (blocks.length === 0) return null;

  // Full HTML doc
  const html = blocks.find((b) => /^html?$/.test(b.lang) && /<html[\s>]/i.test(b.code))
    || blocks.find((b) => /^html?$/.test(b.lang));
  if (html) {
    const css = blocks.find((b) => b.lang === "css")?.code;
    const js = blocks.find((b) => ["js", "javascript"].includes(b.lang))?.code;
    let code = html.code;
    if (css && !/<style/i.test(code)) code = code.replace(/<\/head>/i, `<style>${css}</style></head>`);
    if (js && !/<script[^>]*>[\s\S]+?<\/script>/i.test(code)) code = code.replace(/<\/body>/i, `<script>${js}</script></body>`);
    return { template: "static", files: { "/index.html": code } };
  }

  // React component
  const jsx = blocks.find((b) => ["jsx", "tsx"].includes(b.lang));
  if (jsx) {
    const ext = jsx.lang === "tsx" ? "tsx" : "jsx";
    return {
      template: "react",
      files: {
        [`/App.${ext}`]: jsx.code,
      },
    };
  }

  // Plain CSS+JS or JS that looks like a snippet -> wrap in HTML
  const js = blocks.find((b) => ["js", "javascript"].includes(b.lang));
  const css = blocks.find((b) => b.lang === "css");
  if (js || css) {
    const code = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Preview</title>${css ? `<style>${css.code}</style>` : ""}</head><body><div id="app"></div>${js ? `<script>${js.code}</script>` : ""}</body></html>`;
    return { template: "static", files: { "/index.html": code } };
  }
  return null;
}

export function LivePreview({ spec, onClose }: { spec: PreviewSpec; onClose: () => void }) {
  const key = useMemo(() => JSON.stringify(spec.files).length + ":" + spec.template, [spec]);
  return (
    <div className="flex h-full flex-col border-l border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium">Live preview</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
            {spec.template === "react" ? "React" : "HTML/JS"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              const file = spec.files["/index.html"] || Object.values(spec.files)[0];
              const blob = new Blob([file], { type: "text/html" });
              window.open(URL.createObjectURL(blob), "_blank");
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" aria-label="Close preview">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
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
      </div>
    </div>
  );
}
