import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, LogOut, RefreshCw, ShieldCheck, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { isEmbedded } from "@/lib/safeStorage";
import type { UserIdentity } from "@supabase/supabase-js";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account settings — Nive AI" },
      { name: "description", content: "Manage your Nive AI account: connected Google and Apple logins, session status, and sign-out." },
      { property: "og:title", content: "Account settings — Nive AI" },
      { property: "og:description", content: "Review connected login providers, unlink Google or Apple, and check your Nive AI session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/account" }],
  }),
  component: AccountPage,
});

const PROVIDERS = [
  { id: "google" as const, label: "Google", hint: "One-click sign-in with your Google account." },
  { id: "apple" as const, label: "Apple", hint: "Sign in with Apple, including Hide My Email." },
];

function AccountPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      navigate({ to: "/auth", search: { redirect: "/account" }, replace: true });
      return;
    }
    setEmail(data.user.email ?? null);
    setIdentities(data.user.identities ?? []);
    const { data: s } = await supabase.auth.getSession();
    setSessionExpiry(
      s.session?.expires_at ? new Date(s.session.expires_at * 1000).toLocaleString() : null,
    );
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/auth", replace: true });
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load, navigate]);

  const linked = (id: string) => identities.find((i) => i.provider === id);
  const passwordIdentity = identities.find((i) => i.provider === "email");

  const connect = async (provider: "google" | "apple") => {
    setBusy(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/account",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      await load();
      toast.success(`${provider === "apple" ? "Apple" : "Google"} connected`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not connect";
      if (isEmbedded()) {
        toast.error(`${msg} — embedded windows often block provider popups.`, {
          action: {
            label: "Open in new tab",
            onClick: () => window.open(window.location.origin + "/account", "_blank", "noopener"),
          },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(null);
    }
  };

  const unlink = async (identity: UserIdentity) => {
    if (identities.length < 2) {
      toast.error("Add another sign-in method before unlinking this one.");
      return;
    }
    setBusy(identity.provider);
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      toast.success(`${identity.provider} unlinked`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unlink");
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div
      className="min-h-screen bg-[#f6f9fc] text-[#0a2540]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <Toaster richColors position="top-center" />

      <header className="border-b border-[#0a2540]/8 bg-white">
        <div className="mx-auto flex max-w-[880px] items-center gap-4 px-6 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#425466] transition-colors hover:text-[#635bff]"
          >
            <ArrowLeft className="h-4 w-4" /> All tools
          </Link>
          <span className="ml-auto text-[15px] font-semibold">Account settings</span>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-6 py-10">
        <h1 className="text-[30px] font-bold tracking-[-0.02em] sm:text-[36px]">Account settings</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#425466]">
          {loading ? "Loading your account…" : email}
        </p>

        <section className="mt-8 rounded-2xl border border-[#0a2540]/10 bg-white p-6 shadow-[0_1px_3px_rgba(10,37,64,0.06)]">
          <h2 className="text-[18px] font-semibold">Connected logins</h2>
          <p className="mt-1.5 text-[14px] text-[#425466]">
            Any connected provider can sign you into the same Nive account.
          </p>

          <ul className="mt-5 divide-y divide-[#0a2540]/8">
            {PROVIDERS.map((p) => {
              const identity = linked(p.id);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[15px] font-medium">
                      {p.label}
                      {identity && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0a7c66]/10 px-2 py-0.5 text-[12px] font-semibold text-[#0a7c66]">
                          <Check className="h-3 w-3" /> Connected
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-[#697386]">
                      {identity
                        ? (identity.identity_data?.email as string | undefined) ?? p.hint
                        : p.hint}
                    </p>
                  </div>
                  {identity ? (
                    <button
                      type="button"
                      onClick={() => unlink(identity)}
                      disabled={busy === p.id || loading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a2540]/12 px-3 py-2 text-[13px] font-medium transition-colors hover:border-[#ff4d4f] hover:text-[#a8071a] disabled:opacity-50"
                    >
                      <Unlink className="h-3.5 w-3.5" /> Unlink
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connect(p.id)}
                      disabled={busy === p.id || loading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#635bff] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a2540] disabled:opacity-50"
                    >
                      Connect {p.label}
                    </button>
                  )}
                </li>
              );
            })}

            <li className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[15px] font-medium">
                  Email + password
                  {passwordIdentity && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0a7c66]/10 px-2 py-0.5 text-[12px] font-semibold text-[#0a7c66]">
                      <Check className="h-3 w-3" /> Connected
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] text-[#697386]">
                  {passwordIdentity ? email : "Not set up for this account."}
                </p>
              </div>
            </li>
          </ul>

          {identities.length === 1 && (
            <p className="mt-4 rounded-xl border border-[#ff8a00]/25 bg-[#fffaf0] px-4 py-3 text-[13px] text-[#8a5300]">
              This is your only sign-in method, so it can't be unlinked. Connect a second provider
              first.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-[#0a2540]/10 bg-white p-6 shadow-[0_1px_3px_rgba(10,37,64,0.06)]">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold">
            <ShieldCheck className="h-4.5 w-4.5 text-[#0a7c66]" /> Session
          </h2>
          <p className="mt-1.5 text-[14px] text-[#425466]">
            {sessionExpiry
              ? `Signed in — access token renews automatically (current token valid until ${sessionExpiry}).`
              : "No active session token found."}
          </p>
          {isEmbedded() && (
            <p className="mt-3 rounded-xl border border-[#0a2540]/10 bg-[#f6f9fc] px-4 py-3 text-[13px] text-[#425466]">
              You're viewing Nive inside an embed. If the browser partitions third-party storage,
              your session lives in memory for this tab only.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a2540]/12 px-3 py-2 text-[13px] font-medium transition-colors hover:border-[#0a2540]/25"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh status
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a2540]/12 px-3 py-2 text-[13px] font-medium transition-colors hover:border-[#ff4d4f] hover:text-[#a8071a]"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
