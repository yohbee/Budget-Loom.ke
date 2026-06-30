import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/shell";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", u.user.id)
      .maybeSingle();
    if (!profile || !profile.onboarding_complete) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AppShell,
});