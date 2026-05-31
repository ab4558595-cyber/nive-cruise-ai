// Shared parser: extracts named files from an assistant message.
// Convention: a line like **path/to/file.ext** or `path/to/file.ext`
// immediately before a fenced ```lang block marks that block as a file.
//
// Designed to be tolerant of *partial* streams: if the message ends inside
// an unclosed code fence we temporarily close it so the in-progress block
// is still surfaced in the file tree / preview while the model is typing.

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

// Reverse map: prism language id → preferred file extension
const LANG_EXT: Record<string, string> = {
  typescript: "ts", tsx: "tsx", javascript: "js", jsx: "jsx",
  python: "py", ruby: "rb", go: "go", rust: "rs", java: "java", kotlin: "kt",
  swift: "swift", c: "c", cpp: "cpp", csharp: "cs", php: "php", bash: "sh",
  shell: "sh", html: "html", css: "css", scss: "scss", json: "json",
  yaml: "yml", toml: "toml", markdown: "md", sql: "sql", xml: "xml",
  docker: "dockerfile", arduino: "ino",
};

function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANG[ext] || "text";
}

function normalizePath(p: string): string {
  return p.trim().replace(/^\.?\/+/, "").replace(/\\/g, "/");
}

// Sniff a language from raw source so unlabeled blocks still get an extension.
function sniffLang(code: string): string | null {
  const s = code.slice(0, 600);
  if (/<!doctype html|<html[\s>]/i.test(s)) return "html";
  if (/^\s*import\s+SwiftUI|struct\s+\w+\s*:\s*View/m.test(s)) return "swift";
  if (/#include\s+<\w+\.h>|void\s+setup\(\)|void\s+loop\(\)/.test(s)) return "cpp";
  if (/^\s*package\s+main|^\s*func\s+main\s*\(/m.test(s)) return "go";
  if (/^\s*fn\s+main\s*\(|use\s+std::/m.test(s)) return "rust";
  if (/^\s*def\s+\w+\(|^\s*import\s+\w+|^\s*from\s+\w+\s+import/m.test(s)) return "python";
  if (/^\s*public\s+class\s+\w+|System\.out\.println/m.test(s)) return "java";
  if (/<\?php/.test(s)) return "php";
  if (/^\s*using\s+System;|namespace\s+\w+/m.test(s)) return "csharp";
  if (/(^|\n)\s*(import|export)\s.*from\s+['"]/.test(s) && /:\s*(string|number|boolean|\w+\[\])/.test(s)) return "typescript";
  if (/(^|\n)\s*(import|export)\s.*from\s+['"]/.test(s)) return "javascript";
  if (/<\w+[^>]*>[\s\S]*<\/\w+>/.test(s) && /return\s*\(/.test(s)) return "jsx";
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE)\s/im.test(s)) return "sql";
  return null;
}

// Close an unterminated fence so a streaming message still parses.
function closeOpenFence(content: string): string {
  const fenceCount = (content.match(/```/g) || []).length;
  if (fenceCount % 2 === 1) return content + "\n```";
  return content;
}

export function parseFiles(content: string): ParsedFile[] {
  if (!content) return [];
  const text = closeOpenFence(content);
  const re = /```(\w+)?\n?([\s\S]*?)```/g;
  const out: ParsedFile[] = [];
  let m: RegExpExecArray | null;
  let cursor = 0;
  let unnamedIdx = 0;
  const seen = new Set<string>();
  while ((m = re.exec(text)) !== null) {
    const preceding = text.slice(cursor, m.index).split("\n").slice(-4).join("\n");
    const nameMatch = preceding.match(FILENAME_RE);
    const rawLang = (m[1] || "").toLowerCase();
    const code = m[2] || "";
    if (!code.trim()) { cursor = re.lastIndex; continue; }

    let path: string | null = null;
    let language = rawLang;

    if (nameMatch) {
      path = normalizePath(nameMatch[1]);
      if (!language) language = langFromPath(path);
    } else if (out.length === 0 && /<html[\s>]|<!doctype/i.test(code)) {
      path = "index.html";
      language = "html";
    } else {
      // Unnamed block — try to sniff and synthesize a name so it still
      // appears in the file tree (multi-language support).
      const sniffed = language || sniffLang(code) || "";
      if (sniffed || code.split("\n").length > 2) {
        language = sniffed || "text";
        unnamedIdx++;
        const ext = LANG_EXT[language] ||
          Object.entries(EXT_LANG).find(([, v]) => v === language)?.[0] ||
          (language && language.length <= 8 ? language : "txt");
        path = `snippets/snippet-${unnamedIdx}.${ext}`;
      }
    }

    if (path) {
      // Dedupe (streaming may re-match earlier blocks)
      let unique = path;
      let n = 2;
      while (seen.has(unique)) unique = path.replace(/(\.[^.]+)?$/, `-${n}$1`), n++;
      seen.add(unique);
      out.push({ path: unique, language: language || "text", content: code });
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
