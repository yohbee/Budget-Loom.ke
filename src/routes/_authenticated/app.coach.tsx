import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { askCoach } from "@/lib/coach.functions";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/coach")({
  component: Coach,
});

const SUGGESTIONS = [
  "Where am I overspending this month?",
  "Can I afford a $200 dinner?",
  "How can I save more?",
  "Predict next month's expenses.",
];

function Coach() {
  const qc = useQueryClient();
  const ask = useServerFn(askCoach);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["coach"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("coach_messages").select("*").eq("user_id", u.user.id).order("created_at");
      return data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: (message: string) => ask({ data: { message } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach"] });
      setInput("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  function submit(text: string) {
    if (!text.trim() || send.isPending) return;
    send.mutate(text);
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/30">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold">AI Financial Coach</h1>
          <p className="text-xs text-muted-foreground">Powered by Lovable AI · grounded in your real data</p>
        </div>
      </header>

      <div ref={scrollRef} className="glass flex-1 space-y-4 overflow-y-auto rounded-3xl p-6">
        {(messages?.length ?? 0) === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <h3 className="font-display text-2xl font-semibold">How can I help today?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try one of these:</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-full glass px-4 py-2 text-sm hover:bg-primary/10">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(messages ?? []).map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "gradient-primary text-white" : "bg-card"}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {send.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin" /> thinking…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your finances…"
          className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
        />
        <button type="submit" disabled={!input.trim() || send.isPending} className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/30 disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}