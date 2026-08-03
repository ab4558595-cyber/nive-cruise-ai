import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { docEntry, docNeighbours } from "@/lib/docs-nav";

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-3 text-[22px] font-semibold tracking-[-0.01em] sm:text-[26px]">{children}</h2>;
}
export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-7 mb-2 text-[16.5px] font-semibold">{children}</h3>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[15.5px] leading-[1.75] text-[#425466]">{children}</p>;
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[15.5px] leading-[1.7] text-[#425466]">{children}</ul>;
}
export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[15.5px] leading-[1.7] text-[#425466]">{children}</ol>;
}
export function C({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[#0a2540]/6 px-1.5 py-0.5 font-mono text-[0.85em] text-[#0a2540]">{children}</code>;
}
export function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-xl bg-[#0a2540] p-4 font-mono text-[12.5px] leading-relaxed text-[#e6edf7]">
      <code>{children}</code>
    </pre>
  );
}
export function Note({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: React.ReactNode }) {
  const styles = {
    info: "border-[#635bff]/25 bg-[#635bff]/6",
    warn: "border-[#ff8a00]/35 bg-[#ff8a00]/8",
    ok: "border-[#0a7c66]/30 bg-[#0a7c66]/8",
  }[tone];
  return <div className={`my-4 rounded-xl border ${styles} px-4 py-3 text-[14.5px] leading-relaxed text-[#0a2540]`}>{children}</div>;
}
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mb-5 overflow-x-auto rounded-xl border border-[#0a2540]/10">
      <table className="w-full border-collapse text-[14px]">
        <thead className="bg-[#f6f9fc]">
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-[#0a2540]/10 px-3.5 py-2.5 text-left font-semibold text-[#0a2540]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((cell, j) => (
                <td key={j} className="border-b border-[#0a2540]/6 px-3.5 py-2.5 text-[#425466]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocPage({ slug, children }: { slug: string; children: React.ReactNode }) {
  const entry = docEntry(slug);
  const { prev, next } = docNeighbours(slug);
  return (
    <article>
      <h1 className="text-[30px] font-bold tracking-[-0.02em] sm:text-[38px]">{entry.title}</h1>
      <p className="mt-3 max-w-[680px] text-[16.5px] leading-relaxed text-[#425466]">{entry.description}</p>
      <div className="mt-8">{children}</div>

      <nav className="mt-14 grid gap-3 border-t border-[#0a2540]/10 pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            to="/docs/$slug"
            params={{ slug: prev.slug }}
            className="group rounded-xl border border-[#0a2540]/10 bg-white px-4 py-3 transition-colors hover:border-[#635bff]"
          >
            <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#425466]">
              <ArrowLeft className="h-3.5 w-3.5" /> Previous
            </span>
            <span className="mt-1 block text-[15px] font-semibold text-[#0a2540]">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to="/docs/$slug"
            params={{ slug: next.slug }}
            className="group rounded-xl border border-[#0a2540]/10 bg-white px-4 py-3 text-right transition-colors hover:border-[#635bff] sm:col-start-2"
          >
            <span className="flex items-center justify-end gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#425466]">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <span className="mt-1 block text-[15px] font-semibold text-[#0a2540]">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
