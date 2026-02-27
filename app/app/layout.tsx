import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: user.email?.split("@")[0] ?? null,
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    },
  );

  return <AppShell userEmail={user.email ?? "Unknown"}>{children}</AppShell>;
}
