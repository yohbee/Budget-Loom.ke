import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/app/analytics")({
  component: Analytics,
});

const COLORS = ["#7c5cff", "#22d3a0", "#06b6d4", "#f59e0b", "#ec4899", "#ef4444", "#8b5cf6", "#0ea5e9"];

function Analytics() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const from = new Date(); from.setMonth(from.getMonth() - 5); from.setDate(1); from.setHours(0, 0, 0, 0);
      const [tx, cats, p] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", u.user.id).gte("occurred_at", from.toISOString()),
        supabase.from("categories").select("*").eq("user_id", u.user.id),
        supabase.from("profiles").select("currency").eq("id", u.user.id).maybeSingle(),
      ]);
      const txs = tx.data ?? [];

      // Monthly income vs expense (last 6 months)
      const months: { month: string; income: number; expense: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString(undefined, { month: "short" });
        const m = txs.filter((t) => t.occurred_at.startsWith(key));
        months.push({
          month: label,
          income: m.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
          expense: m.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
        });
      }

      // Category pie (this month expenses)
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const monthTx = txs.filter((t) => new Date(t.occurred_at) >= monthStart && t.type === "expense");
      const catTotals: Record<string, number> = {};
      for (const t of monthTx) {
        const id = t.category_id ?? "uncat";
        catTotals[id] = (catTotals[id] ?? 0) + Number(t.amount);
      }
      const pie = Object.entries(catTotals).map(([id, val]) => ({
        name: (cats.data ?? []).find((c) => c.id === id)?.name ?? "Other",
        value: val,
      }));

      return { months, pie, currency: p.data?.currency ?? "USD" };
    },
  });

  const currency = data?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Insights</p>
        <h1 className="font-display text-3xl font-semibold">Analytics</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Income vs Expense</h3>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={data?.months ?? []}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v) => fmtMoney(Number(v), currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" radius={[8, 8, 0, 0]} fill="oklch(0.78 0.18 165)" />
                <Bar dataKey="expense" radius={[8, 8, 0, 0]} fill="oklch(0.7 0.21 290)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Spending by category</h3>
          <p className="text-xs text-muted-foreground">This month</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.pie ?? []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {(data?.pie ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v) => fmtMoney(Number(v), currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Cash flow trend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={data?.months ?? []}>
                <defs>
                  <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.21 290)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.7 0.21 290)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v) => fmtMoney(Number(v), currency)} />
                <Area type="monotone" dataKey="income" stroke="oklch(0.78 0.18 165)" fill="oklch(0.78 0.18 165 / 0.2)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="oklch(0.7 0.21 290)" fill="url(#cf)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}