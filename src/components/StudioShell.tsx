import { Link } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Check, Copy, Download } from "lucide-react";

export function StudioShell({
  title,
  subtitle,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-[#f6f9fc] text-[#0a2540]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <header className="border-b border-[#0a2540]/8 bg-white">
        <div className="mx-auto flex max-w-[1120px] items-center gap-4 px-6 py-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#425466] transition-colors hover:text-[#635bff]"
          >
            <ArrowLeft className="h-4 w-4" /> All tools
          </Link>
          <span className="ml-auto flex items-center gap-2.5">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: accent }}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-[15px] font-semibold">{title}</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-10 sm:px-8">
        <h1 className="text-[30px] font-bold tracking-[-0.02em] sm:text-[38px]">{title}</h1>
        <p className="mt-3 max-w-[680px] text-[16px] leading-relaxed text-[#425466]">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#0a2540]/10 bg-white p-6 shadow-[0_1px_3px_rgba(10,37,64,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export function MarkdownPanel({
  text,
  filename = "nive-output.md",
}: {
  text: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a2540]/12 px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-[#0a2540]/25"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a2540]/12 px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-[#0a2540]/25"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>
      <div className="prose prose-sm max-w-none prose-headings:tracking-[-0.01em] prose-pre:bg-[#0a2540] prose-pre:text-white">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </Card>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#ff4d4f]/25 bg-[#fff5f5] px-4 py-3 text-[14px] text-[#a8071a]">
      {message}
    </div>
  );
}
