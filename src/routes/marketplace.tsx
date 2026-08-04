import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Blocks, Check, Download, Loader2, Plug, Puzzle, Search, Share2, Sparkles, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Ribbon } from "@/components/Ribbon";
import { supabase } from "@/integrations/supabase/client";
import { BUILTIN_CATALOG, type CatalogKind } from "@/lib/marketplace-catalog";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — browse, install & share Nive tools" },
      { name: "description", content: "Browse every Nive tool, agent and integration in one place. Install what you need to your workspace, or share your own agent recipe with the community." },
      { property: "og:title", content: "Nive Marketplace — tools, agents & integrations" },
      { property: "og:description", content: "Install first-party Nive studios or community-built agents, and publish your own prompt recipes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/marketplace" },
    ],
    links: [{ rel: "canonical", href: "/marketplace" }],
  }),
  component: MarketplacePage,
});

type Listing = {
  id: string;
  author_id: string;
  author_name: string | null;
  name: string;
  tagline: string;
  description: string | null;
  kind: string;
  category: string;
  prompt: string | null;
  tags: string[];
  homepage: string | null;
  install_count: number;
  created_at: string;
};

type Card = {
  key: string;
  name: string;
  tagline: string;
  description?: string;
  kind: CatalogKind;
  category: string;
  href?: string;
  tags: string[];
  official: boolean;
  installs: number;
  prompt?: string | null;
  author?: string | null;
  listingId?: string;
  mine?: boolean;
};

const KIND_META: Record<CatalogKind, { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  tool: { label: "Tool", icon: Puzzle, accent: "#635bff" },
  agent: { label: "Agent", icon: Sparkles, accent: "#0a7c66" },
  integration: { label: "Integration", icon: Plug, accent: "#ff8a00" },
};

const TABS = [
  { id: "all", label: "All" },
  { id: "tool", label: "Tools" },
  { id: "agent", label: "Agents" },
  { id: "integration", label: "Integrations" },
  { id: "installed", label: "Installed" },
] as const;

function MarketplacePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .order("install_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Could not load community listings");
    setListings((data as Listing[]) ?? []);
  }, []);

  const loadInstalls = useCallback(async (uid: string | null) => {
    if (!uid) {
      setInstalled(new Set());
      return;
    }
    const { data } = await supabase.from("marketplace_installs").select("item_key");
    setInstalled(new Set(((data as { item_key: string }[]) ?? []).map((r) => r.item_key)));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? null;
      if (!active) return;
      setUserId(uid);
      await Promise.all([loadListings(), loadInstalls(uid)]);
      if (active) setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      void loadInstalls(uid);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadListings, loadInstalls]);

  const cards = useMemo<Card[]>(() => {
    const builtin: Card[] = BUILTIN_CATALOG.map((i) => ({
      key: `builtin:${i.key}`,
      name: i.name,
      tagline: i.tagline,
      kind: i.kind,
      category: i.category,
      href: i.href,
      tags: i.tags,
      official: true,
      installs: 0,
    }));
    const community: Card[] = listings.map((l) => ({
      key: `listing:${l.id}`,
      listingId: l.id,
      name: l.name,
      tagline: l.tagline,
      description: l.description ?? undefined,
      kind: (["tool", "agent", "integration"].includes(l.kind) ? l.kind : "agent") as CatalogKind,
      category: l.category,
      href: l.homepage ?? undefined,
      tags: l.tags ?? [],
      official: false,
      installs: l.install_count,
      prompt: l.prompt,
      author: l.author_name,
      mine: !!userId && l.author_id === userId,
    }));
    return [...builtin, ...community];
  }, [listings, userId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (tab === "installed" && !installed.has(c.key)) return false;
      if (tab !== "all" && tab !== "installed" && c.kind !== tab) return false;
      if (!q) return true;
      return [c.name, c.tagline, c.category, c.tags.join(" ")].join(" ").toLowerCase().includes(q);
    });
  }, [cards, tab, query, installed]);

  const requireAuth = () => {
    if (userId) return true;
    navigate({ to: "/auth", search: { redirect: "/marketplace" } as never });
    return false;
  };

  const install = async (card: Card) => {
    if (!requireAuth()) return;
    setBusyKey(card.key);
    try {
      const { error } = await supabase
        .from("marketplace_installs")
        .insert({ user_id: userId!, item_key: card.key, listing_id: card.listingId ?? null });
      if (error && error.code !== "23505") throw error;
      if (card.listingId) {
        await supabase.rpc("bump_marketplace_installs", { _listing_id: card.listingId });
        void loadListings();
      }
      setInstalled((prev) => new Set(prev).add(card.key));
      toast.success(`${card.name} installed to your workspace`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Install failed");
    } finally {
      setBusyKey(null);
    }
  };

  const uninstall = async (card: Card) => {
    if (!requireAuth()) return;
    setBusyKey(card.key);
    try {
      const { error } = await supabase
        .from("marketplace_installs")
        .delete()
        .eq("item_key", card.key);
      if (error) throw error;
      setInstalled((prev) => {
        const next = new Set(prev);
        next.delete(card.key);
        return next;
      });
      toast.success(`${card.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusyKey(null);
    }
  };

  const removeListing = async (card: Card) => {
    if (!card.listingId) return;
    setBusyKey(card.key);
    try {
      const { error } = await supabase.from("marketplace_listings").delete().eq("id", card.listingId);
      if (error) throw error;
      toast.success("Listing unpublished");
      await loadListings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unpublish");
    } finally {
      setBusyKey(null);
    }
  };

  const counts = useMemo(
    () => ({
      tool: cards.filter((c) => c.kind === "tool").length,
      agent: cards.filter((c) => c.kind === "agent").length,
      integration: cards.filter((c) => c.kind === "integration").length,
      installed: installed.size,
    }),
    [cards, installed],
  );

  return (
    <div className="min-h-screen bg-white text-[#0a2540]" style={{ fontFamily: "'Inter', 'Sohne', system-ui, sans-serif" }}>
      <Toaster richColors position="top-center" />
      <div className="relative overflow-hidden">
        <Ribbon />
        <header className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5">
          <Link to="/" className="text-[20px] font-bold tracking-tight">nive</Link>
          <nav className="flex items-center gap-5 text-[14px] font-medium">
            <Link to="/docs" className="hover:text-[#635bff]">Docs</Link>
            <Link to="/pricing" className="hover:text-[#635bff]">Pricing</Link>
            {!userId && <Link to="/auth" search={{ redirect: "/marketplace" }} className="hover:text-[#635bff]">Sign in</Link>}
          </nav>
        </header>

        <section className="relative z-10 mx-auto max-w-[1180px] px-6 pb-10 pt-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#635bff]/10 px-3 py-1 text-[12.5px] font-semibold text-[#635bff]">
            <Blocks className="h-3.5 w-3.5" /> Ecosystem marketplace
          </span>
          <h1 className="mt-4 max-w-[760px] text-[38px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
            Browse, install and share Nive tools, agents and integrations
          </h1>
          <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-[#425466]">
            Everything Nive ships, plus recipes built by the community. Install what you use so it
            shows up in your workspace, and publish your own agent prompt for everyone else.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8792a2]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, agents, integrations…"
                aria-label="Search the marketplace"
                className="w-full rounded-full border border-[#0a2540]/12 bg-white py-2.5 pl-10 pr-4 text-[14.5px] outline-none transition-colors focus:border-[#635bff]"
              />
            </div>
            <button
              type="button"
              onClick={() => (requireAuth() ? setShareOpen(true) : undefined)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2540] px-5 py-2.5 text-[14.5px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Share2 className="h-4 w-4" /> Share your agent
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
                  tab === t.id
                    ? "border-transparent bg-[#635bff] text-white"
                    : "border-[#0a2540]/12 text-[#425466] hover:border-[#635bff] hover:text-[#635bff]"
                }`}
              >
                {t.label}
                {t.id !== "all" && (
                  <span className="ml-1.5 opacity-70">{counts[t.id as keyof typeof counts]}</span>
                )}
              </button>
            ))}
          </div>
        </section>
      </div>

      <main className="mx-auto max-w-[1180px] px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#635bff]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#0a2540]/15 px-8 py-16 text-center">
            <p className="text-[16px] font-semibold">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-[#425466]">
              {tab === "installed"
                ? "Install a tool or agent and it will appear here, ready to open."
                : "Try a different search term, or publish the first listing in this category."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => {
              const meta = KIND_META[c.kind];
              const Icon = meta.icon;
              const isInstalled = installed.has(c.key);
              const busy = busyKey === c.key;
              return (
                <article
                  key={c.key}
                  className="flex flex-col rounded-2xl border border-[#0a2540]/10 bg-white p-5 transition-shadow hover:shadow-[0_12px_36px_rgba(50,50,93,0.10)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-[#f6f9fc] px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#425466]">
                        {meta.label}
                      </span>
                      {c.official && (
                        <span className="rounded-full bg-[#635bff]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#635bff]">
                          Official
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="mt-3.5 text-[16.5px] font-semibold tracking-[-0.01em]">{c.name}</h2>
                  <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-[#425466]">{c.tagline}</p>

                  {c.description && (
                    <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#697386]">{c.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-[#697386]">
                    <span className="rounded-md bg-[#f6f9fc] px-2 py-0.5">{c.category}</span>
                    {c.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-md bg-[#f6f9fc] px-2 py-0.5">#{t}</span>
                    ))}
                    {!c.official && <span className="ml-auto">{c.installs} installs</span>}
                  </div>

                  {!c.official && c.author && (
                    <p className="mt-2 text-[12px] text-[#8792a2]">Shared by {c.author}</p>
                  )}

                  {c.prompt && (
                    <details className="mt-3 rounded-xl bg-[#f6f9fc] px-3 py-2">
                      <summary className="cursor-pointer text-[12.5px] font-semibold text-[#425466]">
                        View prompt recipe
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-[#0a2540]">
                        {c.prompt}
                      </pre>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(c.prompt!);
                          toast.success("Prompt copied — paste it into Custom Agents");
                        }}
                        className="mt-2 text-[12.5px] font-semibold text-[#635bff] hover:underline"
                      >
                        Copy prompt
                      </button>
                    </details>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    {isInstalled ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a7c66]/10 px-3 py-1.5 text-[13px] font-semibold text-[#0a7c66]">
                          <Check className="h-3.5 w-3.5" /> Installed
                        </span>
                        <button
                          type="button"
                          onClick={() => uninstall(c)}
                          disabled={busy}
                          className="text-[13px] font-medium text-[#697386] hover:text-[#df1b41] disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => install(c)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-4 py-1.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Install
                      </button>
                    )}

                    {c.href && (c.href.startsWith("/") ? (
                      <a href={c.href} className="ml-auto text-[13.5px] font-semibold text-[#0a2540] hover:text-[#635bff]">
                        Open →
                      </a>
                    ) : (
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="ml-auto text-[13.5px] font-semibold text-[#0a2540] hover:text-[#635bff]"
                      >
                        Visit →
                      </a>
                    ))}

                    {c.mine && (
                      <button
                        type="button"
                        onClick={() => removeListing(c)}
                        disabled={busy}
                        aria-label="Unpublish listing"
                        className="text-[#8792a2] transition-colors hover:text-[#df1b41] disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {shareOpen && (
        <ShareDialog
          onClose={() => setShareOpen(false)}
          onPublished={async () => {
            setShareOpen(false);
            await loadListings();
          }}
        />
      )}
    </div>
  );
}

function ShareDialog({ onClose, onPublished }: { onClose: () => void; onPublished: () => void }) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState<CatalogKind>("agent");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [homepage, setHomepage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) throw new Error("Please sign in again");
      const { error } = await supabase.from("marketplace_listings").insert({
        author_id: uid,
        author_name: authorName.trim() || sess.session?.user.email?.split("@")[0] || "Nive user",
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim() || null,
        prompt: prompt.trim() || null,
        kind,
        category: category.trim() || "General",
        tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 6),
        homepage: homepage.trim() || null,
      });
      if (error) throw error;
      toast.success("Published to the marketplace 🎉");
      onPublished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-xl border border-[#0a2540]/12 bg-[#f6f9fc] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#635bff] focus:bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0a2540]/40 px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(50,50,93,0.25)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.01em]">Share to the marketplace</h2>
            <p className="mt-1 text-[13.5px] text-[#425466]">
              Publish an agent recipe, tool idea or integration. You can unpublish it any time.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#8792a2] hover:text-[#0a2540]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3.5">
          <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name — e.g. Cold Email Closer" className={field} />
          <input required maxLength={120} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One-line tagline" className={field} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <select value={kind} onChange={(e) => setKind(e.target.value as CatalogKind)} className={field} aria-label="Kind">
              <option value="agent">Agent</option>
              <option value="tool">Tool</option>
              <option value="integration">Integration</option>
            </select>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" maxLength={40} className={field} />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1200} placeholder="What it does, who it's for, how to use it…" className={`${field} resize-y`} />
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} maxLength={4000} placeholder="Prompt / instructions others can paste into Custom Agents (optional)" className={`${field} resize-y`} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma separated" className={field} />
            <input value={homepage} onChange={(e) => setHomepage(e.target.value)} placeholder="Link (optional)" className={field} />
          </div>
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={40} placeholder="Display name (optional)" className={field} />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="text-[14px] font-medium text-[#697386] hover:text-[#0a2540]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || name.trim().length < 2 || tagline.trim().length < 6}
            className="inline-flex items-center gap-2 rounded-full bg-[#635bff] px-5 py-2.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-45"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Publish
          </button>
        </div>
      </form>
    </div>
  );
}
