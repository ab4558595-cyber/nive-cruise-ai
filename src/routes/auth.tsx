import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Cruise AI" },
      { name: "description", content: "Sign in or create your Cruise AI account to start building apps with our elite coding copilot." },
      { property: "og:title", content: "Sign in to Cruise AI" },
      { property: "og:description", content: "Access your Cruise AI account or sign up to start generating production-quality code." },
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <Toaster richColors position="top-center" theme="dark" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-surface)" }} />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-brand)" }} />

      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/70 p-6 shadow-[var(--shadow-elegant)] backdrop-blur-md">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold">Cruise AI</span>
        </Link>

        <h1 className="mb-1 text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to continue building." : "Start writing code for any platform."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          </div>
          <Button type="submit" disabled={loading} className="w-full text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
