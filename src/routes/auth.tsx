import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Ribbon } from "@/components/Ribbon";
import { markTourPending } from "@/components/GuidedTour";
import { isEmbedded } from "@/lib/safeStorage";


export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; provider?: "google" | "apple" } => ({
    ...(typeof search.redirect === "string" ? { redirect: search.redirect } : {}),
    ...(search.provider === "google" || search.provider === "apple"
      ? { provider: search.provider as "google" | "apple" }
      : {}),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Nive AI" },
      { name: "description", content: "Sign in or create your Nive AI account to start building apps with our elite coding copilot." },
      { property: "og:title", content: "Sign in to Nive AI" },
      { property: "og:description", content: "Access your Nive AI account or sign up to start generating production-quality code." },
      { property: "og:url", content: "/auth" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { redirect: redirectTo, provider: autoProvider } = Route.useSearch();
  const safeRedirect =
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.startsWith("/auth")
      ? redirectTo
      : "/welcome";

  // If user is already signed in (e.g. returning from Google OAuth redirect), navigate away.
  useEffect(() => {
    let cancelled = false;
    const go = () => {
      if (cancelled) return;
      if (safeRedirect.startsWith("/business") || safeRedirect.includes("?")) {
        window.location.assign(safeRedirect);
      } else {
        navigate({ to: safeRedirect, replace: true });
      }
    };
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) go();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) go();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${safeRedirect}` },
        });
        if (error) throw error;
        markTourPending();
        toast.success("Account created 🎉");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      // Use full-URL assign so /business/* paths with query strings are preserved.
      if (safeRedirect.startsWith("/business") || safeRedirect.includes("?")) {
        window.location.assign(safeRedirect);
      } else {
        navigate({ to: safeRedirect });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      if (mode === "signup") markTourPending();
      toast.success(mode === "signup" ? "Account created 🎉" : "Welcome back");
      if (safeRedirect.startsWith("/business") || safeRedirect.includes("?")) {
        window.location.assign(safeRedirect);
      } else {
        navigate({ to: safeRedirect });
      }
    } catch (err: any) {
      const label = provider === "apple" ? "Apple" : "Google";
      const msg = err?.message || `${label} sign-in failed`;
      if (isEmbedded()) {
        toast.error(`${msg} — embedded windows often block ${label} popups.`, {
          action: {
            label: "Open in new tab",
            onClick: () => {
              const url = new URL(window.location.origin + "/auth");
              url.searchParams.set("provider", provider);
              if (safeRedirect) url.searchParams.set("redirect", safeRedirect);
              window.open(url.toString(), "_blank", "noopener");
            },
          },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // When opened in a new tab with ?provider=…, start that provider flow straight away.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoProvider || autoStarted.current) return;
    autoStarted.current = true;
    void signInWithProvider(autoProvider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoProvider]);


  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <Toaster richColors position="top-center" />
      <Ribbon />

      {/* Top brand */}
      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive
        </Link>
        <Link
          to="/"
          className="text-[14px] font-medium text-[#0a2540]/70 transition-colors hover:text-[#635bff]"
        >
          ← Back
        </Link>
      </header>

      {/* Card */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-[0_15px_50px_rgba(50,50,93,0.12),0_5px_15px_rgba(0,0,0,0.07)] sm:p-10">
          <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-[#0a2540]">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h1>
          {mode === "signup" && (
            <p className="mb-6 text-[14px] text-[#635bff]">
              ✨ Pick a plan that fits — pay securely via UPI.
            </p>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => signInWithProvider("google")}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-[#e0e6eb] bg-white py-2.5 text-[14px] font-medium text-[#0a2540] shadow-[0_1px_2px_rgba(50,50,93,0.05)] transition-all hover:bg-[#f6f9fc] disabled:opacity-60"
            >
              <GoogleG />
              {mode === "signup" ? "Sign up easily with Google" : "Sign in with Google"}
            </button>
            <button
              type="button"
              onClick={() => signInWithProvider("apple")}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-black py-2.5 text-[14px] font-medium text-white transition-all hover:bg-[#1d1d1f] disabled:opacity-60"
            >
              <AppleLogo />
              {mode === "signup" ? "Sign up with Apple" : "Sign in with Apple"}
            </button>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-[#e0e6eb]" />
            <span className="text-[12px] font-medium text-[#a3acb9]">or use email</span>
            <div className="h-px flex-1 bg-[#e0e6eb]" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium text-[#3c4257]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-md border border-[#e0e6eb] bg-white px-3 py-2.5 text-[15px] text-[#0a2540] shadow-[0_1px_2px_rgba(50,50,93,0.05)] outline-none transition-all focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-[14px] font-medium text-[#3c4257]">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-[13px] font-medium text-[#635bff] hover:underline"
                    onClick={() => toast.info("Use the magic-link reset coming soon, or contact support.")}
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full rounded-md border border-[#e0e6eb] bg-white px-3 py-2.5 text-[15px] text-[#0a2540] shadow-[0_1px_2px_rgba(50,50,93,0.05)] outline-none transition-all focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
              />
            </div>

            {mode === "signin" && (
              <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[#3c4257]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#635bff]"
                />
                Remember me on this device
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#a5a3ff] py-3 text-[15px] font-semibold text-white shadow-[0_2px_5px_rgba(99,91,255,0.25)] transition-all hover:bg-[#635bff] disabled:opacity-60"
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-[14px] text-[#697386] transition-colors hover:text-[#635bff]"
          >
            {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.63-.06-1.25-.18-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4" />
      <path d="M9 18a8.62 8.62 0 0 0 5.96-2.18l-2.92-2.26a5.43 5.43 0 0 1-8.08-2.85H.91v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.91a9 9 0 0 0 0 8.08l3.04-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.91 8.91 0 0 0 9 0a9 9 0 0 0-8.09 4.96l3.04 2.33A5.43 5.43 0 0 1 9 3.58z" fill="#EA4335" />
    </svg>
  );
}


function AppleLogo() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M13.28 9.53c.02 2.42 2.12 3.22 2.15 3.24-.02.05-.34 1.15-1.11 2.28-.67.98-1.36 1.95-2.45 1.97-1.07.02-1.42-.63-2.65-.63-1.23 0-1.61.61-2.63.65-1.05.04-1.85-1.05-2.52-2.02C2.7 13.06 1.65 9.4 3.07 6.93c.7-1.23 1.96-2 3.32-2.02 1.03-.02 2 .69 2.62.69.62 0 1.8-.85 3.03-.73.52.02 1.97.19 2.9 1.42-.08.05-1.73 1.01-1.66 3.24zM11.2 3.2c.55-.66.92-1.58.82-2.5-.79.03-1.75.53-2.32 1.19-.51.58-.95 1.52-.83 2.42.88.07 1.78-.45 2.33-1.11z" />
    </svg>
  );
}
