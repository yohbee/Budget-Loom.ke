import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Budget Loom" },
      { name: "description", content: "Sign in or create your Budget Loom account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/app" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

async function handleOAuth(provider: "google" | "apple") {
  setLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth`,
    },
  });

  if (error) {
    toast.error("Could not sign in. Try again.");
    setLoading(false);
  }
}

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="absolute inset-0 -z-10 gradient-mesh opacity-60 lg:hidden" />
      <div className="relative hidden flex-col justify-between overflow-hidden gradient-primary p-12 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </span>
          Budget Loom
        </Link>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight">
            The financial coach in your pocket.
          </h2>
          <p className="mt-3 max-w-md text-white/80">
            Wallets, budgets, goals, analytics, and an AI that actually helps you save.
          </p>
        </div>
        <div className="text-sm text-white/70">Private. Encrypted. Yours.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2 font-display text-xl font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            Budget Loom
          </div>
          <h1 className="font-display text-3xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {mode === "signin" ? "Sign in to your financial command center." : "Start your journey to financial freedom."}
          </p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.2h7.9c-.3 2-2.3 5.9-7.9 5.9-4.7 0-8.6-3.9-8.6-8.7s3.9-8.7 8.6-8.7c2.7 0 4.5 1.1 5.5 2.1l3.8-3.6C18.9 1.1 15.8 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.4-.2-2H12z"/></svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
            >
              <svg width="16" height="18" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM238.5 100.3c25-29.6 22.7-56.6 22-66.3-22.1 1.3-47.7 15-62.3 32-16 18.2-25.4 40.6-23.4 65.8 23.9 1.8 46.7-10.5 63.7-31.5z"/></svg>
              Continue with Apple
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
              />
            )}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 pl-10 text-sm outline-none ring-primary focus:ring-2"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 pl-10 text-sm outline-none ring-primary focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                {mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" />
              </>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}