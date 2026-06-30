import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ message: z.string().min(1).max(2000) });

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured yet.");

    const { supabase, userId } = context;

    // Persist user message
    await supabase.from("coach_messages").insert({ user_id: userId, role: "user", content: data.message });

    // Build financial context
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [profile, wallets, txs, goals, budgets, history] = await Promise.all([
      supabase.from("profiles").select("currency, monthly_income").eq("id", userId).maybeSingle(),
      supabase.from("wallets").select("name, type, balance, currency").eq("user_id", userId),
      supabase.from("transactions").select("type, amount, occurred_at, description, merchant, category_id").eq("user_id", userId).gte("occurred_at", monthStart.toISOString()).limit(200),
      supabase.from("goals").select("name, target_amount, current_amount, target_date").eq("user_id", userId),
      supabase.from("budgets").select("amount, category_id, month").eq("user_id", userId),
      supabase.from("coach_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: true }).limit(20),
    ]);

    const sys = `You are Budget Loom's AI Financial Coach. Be warm, concise, practical, and direct.
Reply in markdown. Use the user's currency: ${profile.data?.currency ?? "USD"}.
Use the structured context below to ground every answer in real numbers when relevant.
Never invent transactions. If data is missing, say so and suggest what to add.

USER CONTEXT (JSON):
${JSON.stringify({
  profile: profile.data,
  wallets: wallets.data,
  goals: goals.data,
  budgets: budgets.data,
  this_month_transactions: txs.data,
}, null, 2)}`;

    const messages = [
      { role: "system", content: sys },
      ...(history.data ?? []).map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Too many AI requests. Please slow down.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace billing.");
      throw new Error(`AI error: ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "Sorry — I couldn't think of a response.";

    await supabase.from("coach_messages").insert({ user_id: userId, role: "assistant", content: reply });

    return { reply };
  });