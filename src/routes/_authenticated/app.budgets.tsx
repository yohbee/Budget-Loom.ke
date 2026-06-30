import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, monthKey } from "@/lib/format";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/budgets")({
  component: Budgets,
});

function Budgets() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const month = monthKey();

  const { data } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [b, c, t, p] = await Promise.all([
        supabase.from("budgets").select("*").eq("user_id", u.user.id).eq("month", month),
        supabase.from("categories").select("*").eq("user_id", u.user.id).eq("type", "expense"),
        supabase.from("transactions").select("category_id, amount, type").eq("user_id", u.user.id).eq("type", "expense").gte("occurred_at", monthStart.toISOString()),
        supabase.from("profiles").select("currency").eq("id", u.user.id).maybeSingle(),
      ]);
      const spentByCat: Record<string, number> = {};
      for (const tx of t.data ?? []) {
        if (!tx.category_id) continue;
        spentByCat[tx.category_id] = (spentByCat[tx.category_id] ?? 0) + Number(tx.amount);
      }
      return { budgets: b.data ?? [], categories: c.data ?? [], spentByCat, currency: p.data?.currency ?? "USD" };
    },
  });

  async function add() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !categoryId || !amount) return;
    const { error } = await supabase.from("budgets").upsert({
      user_id: u.user.id,
      category_id: categoryId,
      month,
      amount: Number(amount),
    }, { onConflict: "user_id,category_id,month" });
    if (error) toast.error(error.message);
    else {
      toast.success("Budget set");
      setOpen(false); setAmount(""); setCategoryId("");
      qc.invalidateQueries({ queryKey: ["budgets"] });
    }
  }

  async function remove(id: string) {
    await supabase.from("budgets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }

  const currency = data?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">This month</p>
          <h1 className="font-display text-3xl font-semibold">Budgets</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> New budget
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {(data?.budgets ?? []).map((b) => {
          const cat = data?.categories.find((c) => c.id === b.category_id);
          const spent = data?.spentByCat[b.category_id ?? ""] ?? 0;
          const limit = Number(b.amount);
          const pct = Math.min(100, Math.round((spent / limit) * 100));
          const over = spent > limit;
          const warn = pct >= 75;
          return (
            <div key={b.id} className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: cat?.color ?? "#7c5cff" }} />
                  <p className="font-medium">{cat?.name ?? "Uncategorized"}</p>
                </div>
                <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-3 font-display text-2xl font-semibold">{fmtMoney(spent, currency)} <span className="text-sm font-normal text-muted-foreground">of {fmtMoney(limit, currency)}</span></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-card/60">
                <div className={`h-full transition-all ${over ? "bg-destructive" : warn ? "bg-chart-3" : "gradient-primary"}`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`mt-2 text-xs ${over ? "text-destructive" : warn ? "text-chart-3" : "text-muted-foreground"}`}>
                {over ? `Over by ${fmtMoney(spent - limit, currency)}` : `${fmtMoney(limit - spent, currency)} left`}
              </p>
            </div>
          );
        })}
        {(data?.budgets?.length ?? 0) === 0 && (
          <div className="glass col-span-full rounded-3xl p-10 text-center text-sm text-muted-foreground">
            No budgets yet. Set one to start tracking your spending limits.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl glass p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">Set monthly budget</h3>
            <div className="mt-4 space-y-3">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                <option value="">Choose category</option>
                {(data?.categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monthly limit" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <button onClick={add} disabled={!categoryId || !amount} className="w-full rounded-2xl gradient-primary py-3 text-sm font-semibold text-white disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}