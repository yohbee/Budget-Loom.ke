import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, monthKey } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Target, Plus, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const uid = u.user.id;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [profileRes, walletsRes, txRes, goalsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("wallets").select("*").eq("user_id", uid).order("created_at"),
        supabase.from("transactions").select("*").eq("user_id", uid).gte("occurred_at", monthStart.toISOString()).order("occurred_at", { ascending: false }),
        supabase.from("goals").select("*").eq("user_id", uid).limit(3),
      ]);

      const txs = txRes.data ?? [];
      const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const saved = txs.filter((t) => t.type === "savings").reduce((s, t) => s + Number(t.amount), 0);
      const totalBalance = (walletsRes.data ?? []).reduce((s, w) => s + Number(w.balance), 0);

      // Last 14 days spending series
      const series: { date: string; value: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const value = txs
          .filter((t) => t.type === "expense" && t.occurred_at.startsWith(key))
          .reduce((s, t) => s + Number(t.amount), 0);
        series.push({ date: key.slice(5), value });
      }

      return {
        profile: profileRes.data,
        wallets: walletsRes.data ?? [],
        txs,
        income,
        expenses,
        saved,
        totalBalance,
        goals: goalsRes.data ?? [],
        series,
      };
    },
  });

  const currency = data?.profile?.currency ?? "USD";
  const savingsRate = data && data.income > 0 ? Math.round((data.saved / data.income) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, {data?.profile?.full_name?.split(" ")[0] ?? "friend"} 👋</p>
          <h1 className="font-display text-3xl font-semibold">Your money this month</h1>
        </div>
        <Link to="/app/transactions" className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> Add transaction
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available balance" value={fmtMoney(data?.totalBalance ?? 0, currency)} icon={Wallet} accent />
        <StatCard label="Income" value={fmtMoney(data?.income ?? 0, currency)} icon={ArrowDownRight} positive />
        <StatCard label="Expenses" value={fmtMoney(data?.expenses ?? 0, currency)} icon={ArrowUpRight} negative />
        <StatCard label="Savings rate" value={`${savingsRate}%`} icon={Target} positive />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass col-span-2 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Daily spending</h3>
            <span className="text-xs text-muted-foreground">Last 14 days</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <LineChart data={data?.series ?? []}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.7 0.21 290)" />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 165)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(v) => fmtMoney(Number(v), currency)}
                />
                <Line type="monotone" dataKey="value" stroke="url(#g)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="mb-3 flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /> <span className="text-xs font-medium uppercase tracking-wider">AI Coach</span></div>
          <p className="font-display text-lg leading-snug">
            {data && data.income > 0
              ? `You've saved ${savingsRate}% of income this month. ${savingsRate >= 20 ? "Stellar pace! 🌟" : "A bit more savings would help your goals."}`
              : "Add an income transaction to unlock personalized insights."}
          </p>
          <Link to="/app/coach" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Chat with coach →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent transactions</h3>
            <Link to="/app/transactions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border/60">
            {(data?.txs ?? []).slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{t.description || t.merchant || t.type}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.type} · {new Date(t.occurred_at).toLocaleDateString()}</p>
                </div>
                <p className={`font-mono text-sm ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                  {t.type === "income" ? "+" : "-"}{fmtMoney(Number(t.amount), currency)}
                </p>
              </li>
            ))}
            {(data?.txs?.length ?? 0) === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">No transactions yet — add your first one above.</li>
            )}
          </ul>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Goals</h3>
            <Link to="/app/goals" className="text-xs text-primary hover:underline">All</Link>
          </div>
          <div className="space-y-4">
            {(data?.goals ?? []).map((g) => {
              const pct = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100));
              return (
                <div key={g.id}>
                  <div className="mb-1.5 flex justify-between text-sm"><span>{g.name}</span><span className="text-muted-foreground">{pct}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-card/60">
                    <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(data?.goals?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No goals yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, positive, negative, accent }: { label: string; value: string; icon: typeof TrendingUp; positive?: boolean; negative?: boolean; accent?: boolean }) {
  const color = accent ? "text-primary" : positive ? "text-success" : negative ? "text-destructive" : "text-foreground";
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}