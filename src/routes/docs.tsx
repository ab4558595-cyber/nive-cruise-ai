import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Mail, Search } from "lucide-react";
import { DOC_NAV } from "@/lib/docs-nav";
import niveLogo from "@/assets/nive-logo.png.asset.json";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  const [query, setQuery] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOC_NAV;
    return DOC_NAV.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.slug.includes(q),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div
      className="min-h-screen bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <header className="sticky top-0 z-30 border-b border-[#0a2540]/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-6 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center" aria-label="Nive AI home">
            <img src={niveLogo.src} alt="Nive AI" className="h-9 w-auto" />
          </Link>
          <span className="hidden text-[#425466] sm:inline">/</span>
          <Link to="/docs" className="hidden text-[14px] font-medium text-[#425466] hover:text-[#635bff] sm:inline">
            Docs
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-[14px] font-medium text-[#425466]">
            <Link to="/code" className="hover:text-[#635bff]">Code</Link>
            <Link to="/business" className="hidden hover:text-[#635bff] sm:inline">Business</Link>
            <Link to="/pricing" className="hidden hover:text-[#635bff] sm:inline">Pricing</Link>
            <Link
              to="/auth"
              className="rounded-full bg-[#635bff] px-4 py-2 text-white transition-colors hover:bg-[#5048d6]"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[264px_1fr]">
        <aside className="lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-96px)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#425466]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs…"
              className="w-full rounded-xl border border-[#0a2540]/12 bg-[#f6f9fc] py-2 pl-9 pr-3 text-[14px] outline-none transition-colors focus:border-[#635bff] focus:bg-white"
            />
          </div>

          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.group}>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#425466]">
                  {g.group}
                </p>
                <ul className="space-y-0.5">
                  {g.items.map((i) => {
                    const active = pathname === `/docs/${i.slug}`;
                    return (
                      <li key={i.slug}>
                        <Link
                          to="/docs/$slug"
                          params={{ slug: i.slug }}
                          className={`block rounded-lg px-2.5 py-1.5 text-[14px] transition-colors ${
                            active
                              ? "bg-[#635bff]/10 font-semibold text-[#635bff]"
                              : "text-[#425466] hover:bg-[#f6f9fc] hover:text-[#0a2540]"
                          }`}
                        >
                          {i.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="text-[14px] text-[#425466]">No pages match “{query}”.</p>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-[#0a2540]/10 bg-[#f6f9fc] p-4 text-[13px] text-[#425466]">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-[#0a2540]">
              <Mail className="h-3.5 w-3.5" /> Need help?
            </p>
            <a href="mailto:support@nive-ai.co.in" className="underline">support@nive-ai.co.in</a>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
          <footer className="mt-16 flex flex-wrap justify-between gap-4 border-t border-[#0a2540]/10 pt-6 text-[13.5px] text-[#425466]">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> © {new Date().getFullYear()} Nive AI
            </span>
            <span className="flex gap-4">
              <Link to="/terms" className="hover:text-[#0a2540]">Terms</Link>
              <Link to="/privacy" className="hover:text-[#0a2540]">Privacy</Link>
              <Link to="/refund" className="hover:text-[#0a2540]">Refund</Link>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
