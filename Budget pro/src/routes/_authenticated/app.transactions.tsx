import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, fmtDate } from "@/lib/format";
import { Plus, X, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TYPES = ["expense", "income", "savings", "investment", "transfer"] as const;
type TxType = typeof TYPES[number];

export const Route = createFileRoute("/_authenticated/app/transactions")({
  component: Transactions,
});

function Transactions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | TxType>("all");

  // Form
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");

  const { data } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [tx, w, c, p] = await Promise.all([
        supabase.from("transactions").select("*, wallet:wallets(name,color), category:categories(name,color)").eq("user_id", u.user.id).order("occurred_at", { ascending: false }).limit(200),
        supabase.from("wallets").select("*").eq("user_id", u.user.id),
        supabase.from("categories").select("*").eq("user_id", u.user.id),
        supabase.from("profiles").select("currency").eq("id", u.user.id).maybeSingle(),
      ]);
      return { txs: tx.data ?? [], wallets: w.data ?? [], categories: c.data ?? [], currency: p.data?.currency ?? "USD" };
    },
  });

  const wallets = data?.wallets ?? [];
  const categories = (data?.categories ?? []).filter((c) => c.type === type);

  async function add() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !walletId || !amount) return;
    const { error } = await supabase.from("transactions").insert({
      user_id: u.user.id,
      wallet_id: walletId,
      to_wallet_id: type === "transfer" ? toWalletId : null,
      category_id: type === "transfer" ? null : (categoryId || null),
      type,
      amount: Number(amount),
      currency: data?.currency ?? "USD",
      description: description || null,
      merchant: merchant || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Transaction added");
      setOpen(false);
      setAmount(""); setDescription(""); setMerchant("");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  }

  async function remove(id: string) {
    await supabase.from("transactions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["wallets"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const filtered = (data?.txs ?? []).filter((t) => {
    if (filter !== "all" && t.type !== filter) return false;
    if (search && !`${t.description ?? ""} ${t.merchant ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Activity</p>
          <h1 className="font-display text-3xl font-semibold">Transactions</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> Add transaction
        </button>
      </header>

      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search merchant or note…" className="w-full rounded-xl bg-card px-4 py-2 pl-9 text-sm outline-none ring-primary focus:ring-2" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {(["all", ...TYPES] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs capitalize ${filter === t ? "gradient-primary text-white" : "text-muted-foreground hover:bg-card"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-2">
        <ul className="divide-y divide-border/60">
          {filtered.map((t) => (
            <li key={t.id} className="group flex items-center gap-3 px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl text-xs font-semibold uppercase" style={{ background: (t.category as { color?: string } | null)?.color ?? "#7c5cff", color: "white" }}>
                {((t.category as { name?: string } | null)?.name ?? t.type).slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.description || t.merchant || (t.category as { name?: string } | null)?.name || t.type}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(t.occurred_at)} · {(t.wallet as { name?: string } | null)?.name}</p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm ${t.type === "income" ? "text-success" : t.type === "transfer" ? "text-muted-foreground" : "text-foreground"}`}>
                  {t.type === "income" ? "+" : t.type === "transfer" ? "↔ " : "-"}{fmtMoney(Number(t.amount), t.currency)}
                </p>
                <p className="text-[10px] capitalize text-muted-foreground">{t.type}</p>
              </div>
              <button onClick={() => remove(t.id)} className="opacity-0 transition group-hover:opacity-100 rounded-lg p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-12 text-center text-sm text-muted-foreground">No transactions match your filters.</li>
          )}
        </ul>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-background/70 p-0 sm:p-4 backdrop-blur" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">New transaction</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-card"><X className="h-4 w-4" /></button>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)} className={`rounded-full px-3 py-1.5 text-xs capitalize ${type === t ? "gradient-primary text-white" : "bg-card text-muted-foreground"}`}>{t}</button>
              ))}
            </div>

            <div className="space-y-3">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-2xl font-display font-semibold" />
              <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                <option value="">{type === "transfer" ? "From wallet" : "Wallet"}</option>
                {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              {type === "transfer" ? (
                <select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                  <option value="">To wallet</option>
                  {wallets.filter(w => w.id !== walletId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              ) : (
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                  <option value="">Category (optional)</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant (optional)" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Note (optional)" className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm" />
              <button onClick={add} disabled={!walletId || !amount} className="w-full rounded-2xl gradient-primary py-3 text-sm font-semibold text-white disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}