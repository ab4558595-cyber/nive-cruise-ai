import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Download, WrapText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EXT: Record<string, string> = {
  javascript: "js", js: "js", typescript: "ts", ts: "ts", tsx: "tsx", jsx: "jsx",
  python: "py", py: "py", bash: "sh", sh: "sh", shell: "sh",
  html: "html", css: "css", json: "json", yaml: "yml", yml: "yml",
  cpp: "cpp", c: "c", arduino: "ino", java: "java", kotlin: "kt", swift: "swift",
  go: "go", rust: "rs", rs: "rs", php: "php", ruby: "rb", sql: "sql", md: "md", markdown: "md",
};

export function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(true);
  const lang = language || "text";
  const lineCount = value.replace(/\n$/, "").split("\n").length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const download = () => {
    const ext = EXT[lang.toLowerCase()] || "txt";
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snippet-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded .${ext}`);
  };

  return (
    <div className="relative my-3 overflow-hidden rounded-lg border border-border bg-[#282c34]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="font-mono uppercase tracking-wide">{lang}</span>
          <span className="text-zinc-500">· {lineCount} line{lineCount === 1 ? "" : "s"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setWrap((w) => !w)} className="h-7 px-2 text-zinc-300 hover:bg-white/10 hover:text-white" title={wrap ? "Disable wrap" : "Enable wrap"}>
            <WrapText className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={download} className="h-7 px-2 text-zinc-300 hover:bg-white/10 hover:text-white" title="Download">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={copy} className="h-7 text-zinc-300 hover:bg-white/10 hover:text-white">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.85rem" }}
        showLineNumbers={lineCount > 3}
        lineNumberStyle={{ color: "#4b5263", minWidth: "2.25em", paddingRight: "0.75em", userSelect: "none" }}
        wrapLongLines={wrap}
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}
