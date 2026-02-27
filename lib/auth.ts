import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      supabase,
      user: null as null,
    };
  }

  const fallbackDisplayName = user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? null;
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: fallbackDisplayName,
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    },
  );

  if (profileError) {
    return {
      error: NextResponse.json(
        {
          error:
            "Profile initialization failed. Ensure the profiles table and RLS policies are applied from the migration.",
          details: profileError.message,
        },
        { status: 500 },
      ),
      supabase,
      user: null as null,
    };
  }

  return { supabase, user, error: null as null };
}
