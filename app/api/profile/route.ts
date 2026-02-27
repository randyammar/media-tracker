import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, serverError } from "@/lib/http";

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = (await request.json().catch(() => null)) as
    | {
        id?: string;
        display_name?: string | null;
        avatar_url?: string | null;
      }
    | null;
  if (!body || body.id !== user.id) {
    return badRequest("Invalid profile payload");
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: body.display_name ?? null,
      avatar_url: body.avatar_url ?? null,
    })
    .select("*")
    .single();

  if (error) return serverError(error.message);
  return NextResponse.json({ profile: data });
}

