import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, fmtDate } from "@/lib/format";
import { Plus, X, Target } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/goals")({
  component: Goals,
});

function Goals() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");

  const { data } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [g, p] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", u.user.id).order("created_at"),
        supabase.from("profiles").select("currency").eq("id", u.user.id).maybeSingle(),
      ]);
      return { goals: g.data ?? [], currency: p.data?.currency ?? "USD" };
    },
  });

  async function add() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("goals").insert({
      user_id: u.user.id, name, target_amount: Number(target), target_date: date || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Goal created");
      setOpen(false); setName(""); setTarget(""); setDate("");
      qc.invalidateQueries({ queryKey: ["goals"] });
    }
  }

  async function bump(id: string, current: number, target: number) {
    const add = prompt("Add to this goal");
    if (!add) return;
    await supabase.from("goals").update({ current_amount: Math.min(target, current + Number(add)) }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["goals"] });
  }

  async function remove(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["goals"] });
  }

  const currency = data?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Save smarter</p>
          <h1 className="font-display text-3xl font-semibold">Goals</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> New goal
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.goals ?? []).map((g) => {
          const pct = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100));
          return (
            <div key={g.id} className="glass relative rounded-3xl p-6">
              <button onClick={() => remove(g.id)} className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Target className="h-6 w-6" /></div>
              <p className="mt-4 font-display text-lg font-semibold">{g.name}</p>
              {g.target_date && <p className="text-xs text-muted-foreground">by {fmtDate(g.target_date)}</p>}
              <p className="mt-3 font-display text-2xl font-semibold">{fmtMoney(Number(g.current_amount), currency)}</p>
              <p className="text-xs text-muted-foreground">of {fmtMoney(Number(g.target_amount), currency)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-card/60">
                <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
              </div>
              <button onClick={() => bump(g.id, Number(g.current_amount), Number(g.target_amount))} className="mt-4 w-full rounded-xl border border-border py-2 text-xs hover:bg-card">+ Add contribution</button>
            </div>
          );
        })}
        {(data?.goals?.length ?? 0) === 0 && (
          <div className="glass col-span-full rounded-3xl p-10 text-center text-sm text-muted-foreground">
            No goals yet. Dream big — set your first one.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl glass p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">New goal</h3>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target amount" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <button onClick={add} disabled={!name || !target} className="w-full rounded-2xl gradient-primary py-3 text-sm font-semibold text-white disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}