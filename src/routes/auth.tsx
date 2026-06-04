import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Ribbon } from "@/components/Ribbon";
import { markTourPending } from "@/components/GuidedTour";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
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
  const { redirect: redirectTo } = Route.useSearch();
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";

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
        toast.success("Account created! Enjoy your 14-day free trial 🎉");
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


  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-[#0a2540]"
      style={{ fontFamily: "'Inter', 'Sohne', system-ui, -apple-system, sans-serif" }}
    >
      <Toaster richColors position="top-center" />
      <Ribbon />

      {/* Top brand */}
      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/welcome" className="text-[22px] font-bold tracking-tight text-[#0a2540]">
          nive
        </Link>
        <Link
          to="/welcome"
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
              ✨ Get a <strong>14-day free trial</strong> — no card required.
            </p>
          )}

          {/* Google first, since it's the easiest path */}
          <button
            type="button"
            onClick={signInWithGoogle}
            className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-md border border-[#e0e6eb] bg-white py-3 text-[15px] font-semibold text-[#0a2540] shadow-[0_1px_2px_rgba(50,50,93,0.05)] transition-all hover:border-[#635bff] hover:shadow-md"
          >
            <GoogleG />
            {mode === "signup" ? "Sign up easily with Google" : "Continue with Google"}
          </button>

          <div className="mb-5 flex items-center gap-3 text-[12px] text-[#697386]">
            <span className="h-px flex-1 bg-[#e0e6eb]" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-[#e0e6eb]" />
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
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
