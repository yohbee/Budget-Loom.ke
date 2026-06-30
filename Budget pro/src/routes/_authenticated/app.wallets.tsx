import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { WALLET_TYPES, WALLET_COLORS } from "@/lib/constants";
import { Plus, Wallet as WalletIcon, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/wallets")({
  component: Wallets,
});

function Wallets() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [color, setColor] = useState(WALLET_COLORS[0]);
  const [balance, setBalance] = useState("0");

  const { data } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { wallets: [], currency: "USD" };
      const [w, p] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", u.user.id).order("created_at"),
        supabase.from("profiles").select("currency").eq("id", u.user.id).maybeSingle(),
      ]);
      return { wallets: w.data ?? [], currency: p.data?.currency ?? "USD" };
    },
  });

  async function add() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("wallets").insert({
      user_id: u.user.id,
      name,
      type: type as never,
      color,
      balance: Number(balance) || 0,
      currency: data?.currency ?? "USD",
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Wallet created");
      setOpen(false);
      setName("");
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this wallet and all its transactions?")) return;
    await supabase.from("wallets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["wallets"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const total = (data?.wallets ?? []).reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total balance</p>
          <h1 className="font-display text-3xl font-semibold">{fmtMoney(total, data?.currency)}</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> New wallet
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.wallets ?? []).map((w) => (
          <div key={w.id} className="glass relative overflow-hidden rounded-3xl p-6">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-30 blur-2xl" style={{ background: w.color }} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: w.color }}>
                  <WalletIcon className="h-5 w-5" />
                </span>
                <button onClick={() => remove(w.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{WALLET_TYPES.find(t => t.value === w.type)?.label}</p>
              <p className="font-display text-lg font-semibold">{w.name}</p>
              <p className="mt-3 font-display text-2xl font-semibold">{fmtMoney(Number(w.balance), w.currency)}</p>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl glass p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">New wallet</h3>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                {WALLET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Starting balance" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <div className="flex gap-2">
                {WALLET_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-background ${color === c ? "ring-2 ring-primary" : ""}`} style={{ background: c }} />
                ))}
              </div>
              <button onClick={add} disabled={!name} className="w-full rounded-2xl gradient-primary py-3 text-sm font-semibold text-white disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}