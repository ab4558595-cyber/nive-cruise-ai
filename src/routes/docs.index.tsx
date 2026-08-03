import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { DOC_NAV } from "@/lib/docs-nav";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "Documentation — Nive AI" },
      { name: "description", content: "Nive AI documentation: quickstart, Code Studio, Marketing Suite, Synthetic Data, every studio, billing, security, embedding and the public API." },
      { property: "og:title", content: "Documentation — Nive AI" },
      { property: "og:description", content: "Guides for every Nive AI tool plus billing, security, embedding and API reference." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/docs" }],
  }),
  component: DocsHome,
});

function DocsHome() {
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#635bff]">
        <BookOpen className="h-3.5 w-3.5" /> Documentation
      </span>
      <h1 className="mt-4 text-[32px] font-bold tracking-[-0.02em] sm:text-[42px]">
        Everything you need to build with Nive AI
      </h1>
      <p className="mt-4 max-w-[660px] text-[17px] leading-relaxed text-[#425466]">
        Tool-by-tool guides, credit maths, billing internals, security posture, embedding notes and
        the public API — each on its own page so you can link a teammate straight to the answer.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {[
          { slug: "quickstart", label: "Quickstart" },
          { slug: "code-studio", label: "Code Studio" },
          { slug: "credits", label: "Credits & limits" },
          { slug: "billing", label: "Billing" },
          { slug: "security", label: "Security" },
          { slug: "api", label: "Public API" },
        ].map((q) => (
          <Link
            key={q.slug}
            to="/docs/$slug"
            params={{ slug: q.slug }}
            className="rounded-full border border-[#0a2540]/12 px-4 py-2 text-[14px] font-medium transition-colors hover:border-[#635bff] hover:text-[#635bff]"
          >
            {q.label}
          </Link>
        ))}
      </div>

      <div className="mt-12 space-y-10">
        {DOC_NAV.map((g) => (
          <section key={g.group}>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#425466]">
              {g.group}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {g.items.map((i) => (
                <Link
                  key={i.slug}
                  to="/docs/$slug"
                  params={{ slug: i.slug }}
                  className="group rounded-xl border border-[#0a2540]/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_12px_28px_rgba(10,37,64,0.10)]"
                >
                  <p className="text-[16px] font-semibold">{i.title}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#425466]">{i.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#635bff]">
                    Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
