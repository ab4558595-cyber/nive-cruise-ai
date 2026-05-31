import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File as FileIcon, Download, X, FileCode2, Copy, Check } from "lucide-react";
import JSZip from "jszip";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildTree, parseFiles, type ParsedFile, type TreeNode } from "@/lib/parseFiles";

function fileIconColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ({
    ts: "text-blue-400", tsx: "text-blue-400", js: "text-yellow-400", jsx: "text-yellow-400",
    py: "text-emerald-400", html: "text-orange-400", css: "text-sky-400", json: "text-amber-400",
    md: "text-zinc-400", cpp: "text-pink-400", c: "text-pink-400", ino: "text-cyan-400",
    rs: "text-orange-300", go: "text-cyan-300", swift: "text-orange-400", java: "text-red-400",
    sh: "text-green-400", sql: "text-violet-400",
  })[ext] || "text-zinc-400";
}

function TreeRow({ node, depth, openSet, onToggle, onPick, activePath }: {
  node: TreeNode; depth: number; openSet: Set<string>;
  onToggle: (p: string) => void; onPick: (f: ParsedFile) => void; activePath: string;
}) {
  const open = openSet.has(node.path);
  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs text-zinc-300 hover:bg-white/5"
          style={{ paddingLeft: depth * 12 + 6 }}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-sky-400" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-sky-400" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children?.map((c) => (
          <TreeRow key={c.path} node={c} depth={depth + 1} openSet={openSet} onToggle={onToggle} onPick={onPick} activePath={activePath} />
        ))}
      </div>
    );
  }
  const active = activePath === node.path;
  return (
    <button
      onClick={() => onPick(node.file!)}
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs hover:bg-white/5",
        active ? "bg-primary/15 text-foreground" : "text-zinc-300",
      )}
      style={{ paddingLeft: depth * 12 + 22 }}
    >
      <FileIcon className={cn("h-3.5 w-3.5 shrink-0", fileIconColor(node.name))} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({ content, onClose }: { content: string; onClose: () => void }) {
  const files = useMemo(() => parseFiles(content), [content]);
  const tree = useMemo(() => buildTree(files), [files]);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<ParsedFile | null>(null);
  const [copied, setCopied] = useState(false);

  // Expand all folders and pick first file by default
  useEffect(() => {
    const next = new Set<string>();
    const walk = (nodes: TreeNode[]) => nodes.forEach((n) => {
      if (n.type === "folder") { next.add(n.path); walk(n.children || []); }
    });
    walk(tree);
    setOpenSet(next);
    if (!active && files.length > 0) setActive(files[0]);
    if (active && !files.find((f) => f.path === active.path)) setActive(files[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const toggle = (p: string) => setOpenSet((s) => {
    const n = new Set(s);
    n.has(p) ? n.delete(p) : n.add(p);
    return n;
  });

  const downloadZip = async () => {
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cruise-project-${Date.now()}.zip`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${files.length} files`);
  };

  const copyActive = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.content);
    setCopied(true);
    toast.success("File copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadActive = () => {
    if (!active) return;
    const blob = new Blob([active.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = active.path.split("/").pop() || "file.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  if (files.length === 0) return null;

  return (
    <div className="flex h-full flex-col border-l border-border/60 bg-card/95 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <FileCode2 className="h-4 w-4 text-primary" />
          Project files
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">{files.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={downloadZip} className="h-7 px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> ZIP
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-48 shrink-0 overflow-y-auto border-r border-border/60 py-1.5">
          {tree.map((n) => (
            <TreeRow key={n.path} node={n} depth={0} openSet={openSet} onToggle={toggle} onPick={setActive} activePath={active?.path ?? ""} />
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="truncate font-mono">{active.path}</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={copyActive} className="h-7 px-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={downloadActive} className="h-7 px-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <SyntaxHighlighter
                  language={active.language}
                  style={oneDark}
                  customStyle={{ margin: 0, background: "transparent", fontSize: "0.8rem", minHeight: "100%" }}
                  showLineNumbers
                  lineNumberStyle={{ color: "#4b5263", minWidth: "2.5em", paddingRight: "0.75em", userSelect: "none" }}
                  wrapLongLines={false}
                >
                  {active.content.replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            </>
          ) : (
            <div className="m-auto text-sm text-zinc-500">Select a file</div>
          )}
        </div>
      </div>
    </div>
  );
}
