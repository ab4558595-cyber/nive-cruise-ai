// Shared parser: extracts named files from an assistant message.
// Convention: a line like **path/to/file.ext** or `path/to/file.ext`
// immediately before a fenced ```lang block marks that block as a file.

export type ParsedFile = {
  path: string;     // normalized, no leading slash, forward slashes
  language: string; // best-guess prism language id
  content: string;
};

const FILENAME_RE =
  /(?:\*\*|##\s*|`)([\w./\-@]+\.[a-zA-Z0-9]{1,8})(?:\*\*|`)?/;

const EXT_LANG: Record<string, string> = {
  ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx", mjs: "javascript",
  py: "python", rb: "ruby", go: "go", rs: "rust", java: "java", kt: "kotlin",
  swift: "swift", c: "c", h: "c", cpp: "cpp", hpp: "cpp", cc: "cpp", ino: "cpp",
  cs: "csharp", php: "php", sh: "bash", bash: "bash", zsh: "bash",
  html: "html", htm: "html", css: "css", scss: "scss", json: "json",
  yml: "yaml", yaml: "yaml", toml: "toml", md: "markdown", sql: "sql",
  xml: "xml", svg: "xml", dockerfile: "docker", env: "bash",
};

function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANG[ext] || "text";
}

function normalizePath(p: string): string {
  return p.trim().replace(/^\.?\/+/, "").replace(/\\/g, "/");
}

export function parseFiles(content: string): ParsedFile[] {
  if (!content) return [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  const out: ParsedFile[] = [];
  let m: RegExpExecArray | null;
  let cursor = 0;
  let unnamedIdx = 0;
  while ((m = re.exec(content)) !== null) {
    const preceding = content.slice(cursor, m.index).split("\n").slice(-4).join("\n");
    const nameMatch = preceding.match(FILENAME_RE);
    const lang = (m[1] || "").toLowerCase();
    const code = m[2];
    if (nameMatch) {
      const path = normalizePath(nameMatch[1]);
      out.push({ path, language: lang || langFromPath(path), content: code });
    } else if (out.length === 0 && /<html[\s>]|<!doctype/i.test(code)) {
      // single HTML doc → still surface as a file
      out.push({ path: "index.html", language: "html", content: code });
    } else if (lang && code.split("\n").length > 4) {
      // unnamed but substantial — give it a synthetic name so we don't lose it
      unnamedIdx++;
      const ext = Object.entries(EXT_LANG).find(([, v]) => v === lang)?.[0] ?? lang ?? "txt";
      out.push({ path: `snippets/snippet-${unnamedIdx}.${ext}`, language: lang, content: code });
    }
    cursor = re.lastIndex;
  }
  return out;
}

export type TreeNode = {
  name: string;
  path: string; // full path for files; folder path for folders
  type: "file" | "folder";
  children?: TreeNode[];
  file?: ParsedFile;
};

export function buildTree(files: ParsedFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", type: "folder", children: [] };
  for (const f of files) {
    const parts = f.path.split("/").filter(Boolean);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      const name = parts[i];
      const path = parts.slice(0, i + 1).join("/");
      let next = node.children!.find((c) => c.name === name && c.type === (isLast ? "file" : "folder"));
      if (!next) {
        next = isLast
          ? { name, path, type: "file", file: f }
          : { name, path, type: "folder", children: [] };
        node.children!.push(next);
      }
      node = next;
    }
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) if (n.children) sort(n.children);
  };
  sort(root.children!);
  return root.children!;
}
