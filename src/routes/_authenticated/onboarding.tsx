import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CURRENCIES,
} from "@/lib/format";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVESTMENT_CATEGORIES,
  DEFAULT_SAVINGS_CATEGORIES,
  WALLET_TYPES,
  WALLET_COLORS,
} from "@/lib/constants";
import { ArrowRight, Sparkles, Check, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

type WalletDraft = { name: string; type: string; color: string };
type GoalDraft = { name: string; target: number };

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [currency, setCurrency] = useState("USD");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [wallets, setWallets] = useState<WalletDraft[]>([
    { name: "Cash", type: "cash", color: WALLET_COLORS[0] },
    { name: "Bank", type: "bank", color: WALLET_COLORS[2] },
  ]);
  const [goals, setGoals] = useState<GoalDraft[]>([{ name: "Emergency Fund", target: 1000 }]);

  const steps = ["Welcome", "Currency", "Income", "Wallets", "Goals", "Done"];

  async function finish() {
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const uid = u.user.id;

      // Update profile
      await supabase.from("profiles").update({
        currency,
        monthly_income: Number(monthlyIncome) || 0,
        starting_balance: Number(startingBalance) || 0,
        onboarding_complete: true,
      }).eq("id", uid);

      // Wallets — first wallet gets starting balance
      const walletRows = wallets.map((w, i) => ({
        user_id: uid,
        name: w.name,
        type: w.type as never,
        color: w.color,
        currency,
        balance: i === 0 ? Number(startingBalance) || 0 : 0,
      }));
      if (walletRows.length) await supabase.from("wallets").insert(walletRows);

      // Categories
      const cats = [
        ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "expense" as const })),
        ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "income" as const })),
        ...DEFAULT_SAVINGS_CATEGORIES.map((c) => ({ ...c, type: "savings" as const })),
        ...DEFAULT_INVESTMENT_CATEGORIES.map((c) => ({ ...c, type: "investment" as const })),
      ].map((c) => ({ user_id: uid, ...c }));
      await supabase.from("categories").insert(cats);

      // Goals
      if (goals.length) {
        await supabase.from("goals").insert(
          goals
            .filter((g) => g.name && g.target > 0)
            .map((g) => ({ user_id: uid, name: g.name, target_amount: g.target }))
        );
      }

      toast.success("You're all set!");
      navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 gradient-mesh opacity-50" />
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        <div className="mb-10 flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          Budget Loom
        </div>

        <div className="mb-8 flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-primary" : "bg-card"}`} />
          ))}
        </div>

        <div className="glass flex-1 rounded-3xl p-8 sm:p-10">
          {step === 0 && (
            <Step title="Welcome to Budget Loom 👋" desc="Let's build your financial profile in less than a minute.">
              <ul className="space-y-3 text-sm text-muted-foreground">
                {["Set your currency", "Add your wallets", "Plan your first goals", "Get AI coaching"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t}</li>
                ))}
              </ul>
            </Step>
          )}

          {step === 1 && (
            <Step title="Choose your currency" desc="Pick the currency you mostly use.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`rounded-2xl border p-3 text-left transition ${currency === c.code ? "border-primary bg-primary/10" : "border-border hover:bg-card/60"}`}
                  >
                    <p className="font-display text-lg font-semibold">{c.symbol} {c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="Your income & starting balance" desc="This helps us personalize your budgets.">
              <Label text="Monthly income">
                <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className={inputCls} placeholder="0" />
              </Label>
              <Label text="Starting balance (across all wallets)">
                <input type="number" value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} className={inputCls} placeholder="0" />
              </Label>
            </Step>
          )}

          {step === 3 && (
            <Step title="Create your wallets" desc="Cash, mobile money, bank, cards — keep them in one place.">
              <div className="space-y-2">
                {wallets.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-2xl border border-border bg-card/40 p-2.5">
                    <span className="h-8 w-8 rounded-lg" style={{ background: w.color }} />
                    <input value={w.name} onChange={(e) => setWallets(wallets.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="flex-1 bg-transparent text-sm outline-none" />
                    <select value={w.type} onChange={(e) => setWallets(wallets.map((x, j) => j === i ? { ...x, type: e.target.value } : x))} className="rounded-lg bg-card px-2 py-1 text-xs">
                      {WALLET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button onClick={() => setWallets(wallets.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button onClick={() => setWallets([...wallets, { name: "New wallet", type: "cash", color: WALLET_COLORS[wallets.length % WALLET_COLORS.length] }])} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-card/40"><Plus className="h-4 w-4" /> Add wallet</button>
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step title="Set your first goals" desc="What are you saving for?">
              <div className="space-y-2">
                {goals.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-2xl border border-border bg-card/40 p-2.5">
                    <input value={g.name} onChange={(e) => setGoals(goals.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="flex-1 bg-transparent text-sm outline-none" placeholder="Goal name" />
                    <input type="number" value={g.target} onChange={(e) => setGoals(goals.map((x, j) => j === i ? { ...x, target: Number(e.target.value) } : x))} className="w-24 rounded-lg bg-card px-2 py-1 text-sm" />
                    <button onClick={() => setGoals(goals.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button onClick={() => setGoals([...goals, { name: "", target: 0 }])} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-card/40"><Plus className="h-4 w-4" /> Add goal</button>
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step title="You're ready! 🎉" desc="We'll create your wallets, starter categories, and goals.">
              <div className="rounded-2xl bg-card/50 p-4 text-sm">
                <p><span className="text-muted-foreground">Currency:</span> {currency}</p>
                <p><span className="text-muted-foreground">Monthly income:</span> {monthlyIncome || 0}</p>
                <p><span className="text-muted-foreground">Wallets:</span> {wallets.map(w => w.name).join(", ")}</p>
                <p><span className="text-muted-foreground">Goals:</span> {goals.map(g => g.name).filter(Boolean).join(", ") || "—"}</p>
              </div>
            </Step>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground disabled:opacity-30"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/30">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={submitting} className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/30 disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finish setup <ArrowRight className="h-4 w-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary focus:ring-2";

function Step({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{text}</span>
      {children}
    </label>
  );
}