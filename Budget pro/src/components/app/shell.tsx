import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Target,
  BarChart3,
  Brain,
  Sparkles,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type NavItem = {
  to: "/app" | "/app/wallets" | "/app/transactions" | "/app/budgets" | "/app/goals" | "/app/analytics" | "/app/coach";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};
const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/wallets", label: "Wallets", icon: Wallet },
  { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/app/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/app/goals", label: "Goals", icon: Target },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/coach", label: "AI Coach", icon: Brain },
];

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 gradient-mesh opacity-40" />
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-3xl glass p-4 lg:flex">
          <Link to="/app" className="mb-8 flex items-center gap-2 px-2 font-display text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            Budget Loom
          </Link>
          <nav className="flex-1 space-y-1">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary/15 text-foreground shadow-inner"
                      : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-2xl bg-card/50 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-sm font-semibold text-white">
                {(profile?.full_name?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.full_name ?? "Account"}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.currency ?? "USD"}</p>
              </div>
              <button onClick={signOut} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full glass px-2 py-2 lg:hidden">
        {NAV.slice(0, 5).map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link key={n.to} to={n.to} className={`grid h-10 w-10 place-items-center rounded-full transition ${active ? "gradient-primary text-white" : "text-muted-foreground"}`}>
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}