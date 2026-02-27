import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your personal profile details.</p>
      </div>
      <ProfileForm
        userId={user.id}
        initialDisplayName={profile?.display_name ?? user.email?.split("@")[0] ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? ""}
      />
    </div>
  );
}

