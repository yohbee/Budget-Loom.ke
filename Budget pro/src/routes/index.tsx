import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Sparkles, Wallet, TrendingUp, Target, Brain, ArrowRight, BarChart3, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Budget Loom — Intelligent Personal Finance" },
      { name: "description", content: "Wallets, budgets, savings goals, and an AI financial coach in one premium app." },
      { property: "og:title", content: "Budget Loom" },
      { property: "og:description", content: "Intelligent personal finance, beautifully designed." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 gradient-mesh opacity-70" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,_var(--primary)_22%,_transparent),_transparent_60%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </span>
          Budget Loom<span className="text-primary">.AI</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/auth" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-5 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 transition hover:opacity-90"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <section className="grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> AI-powered personal finance
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              Your money,{" "}
              <span className="bg-gradient-to-br from-primary via-chart-4 to-chart-2 bg-clip-text text-transparent">
                intelligently
              </span>{" "}
              in flow.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Track wallets, plan budgets, hit savings goals, and get personalized AI coaching — all in one beautifully designed financial command center.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-medium text-white shadow-xl shadow-primary/30 transition hover:opacity-90"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 font-medium">
                Explore features
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Bank-level security</span>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI coach included</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/20 blur-3xl" />
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Available balance</p>
                  <p className="font-display text-4xl font-semibold">$24,580.42</p>
                </div>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs text-success">+12.4%</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { l: "Income", v: "$8,200" },
                  { l: "Spent", v: "$3,914" },
                  { l: "Saved", v: "$1,420" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-card/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                    <p className="font-display text-lg font-semibold">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { n: "Whole Foods", c: "Groceries", v: "-$84.20", color: "bg-chart-3/20 text-chart-3" },
                  { n: "Salary", c: "Income", v: "+$5,000", color: "bg-success/20 text-success" },
                  { n: "Spotify", c: "Subscription", v: "-$9.99", color: "bg-chart-4/20 text-chart-4" },
                ].map((t) => (
                  <div key={t.n} className="flex items-center justify-between rounded-2xl bg-card/40 p-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${t.color}`}>•</span>
                      <div>
                        <p className="text-sm font-medium">{t.n}</p>
                        <p className="text-xs text-muted-foreground">{t.c}</p>
                      </div>
                    </div>
                    <p className="font-mono text-sm">{t.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-32 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { i: Wallet, t: "Multiple wallets", d: "Cash, mobile money, bank, credit cards, crypto — all in sync with instant transfers." },
            { i: BarChart3, t: "Smart budgets", d: "Set monthly limits per category. Get warned at 75%, alerted at 90%, coached at 100%." },
            { i: Target, t: "Savings goals", d: "Visualize and accelerate every goal — from emergency fund to that dream vacation." },
            { i: TrendingUp, t: "Beautiful analytics", d: "Cash flow, category breakdowns, heatmaps, net worth — all live and interactive." },
            { i: Brain, t: "AI Financial Coach", d: "Ask “can I afford this?”, “where am I overspending?”, get truthful, personalized answers." },
            { i: ShieldCheck, t: "Private by default", d: "Your data is isolated, encrypted, and never sold. Ever." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="group glass rounded-3xl p-6 transition hover:-translate-y-1">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-32 overflow-hidden rounded-3xl glass p-10 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Build the financial life you want.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join Budget Loom and let your money work for you — guided by AI, designed for delight.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-medium text-white shadow-xl shadow-primary/30"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Budget Loom · Crafted with care
      </footer>
    </div>
  );
}
