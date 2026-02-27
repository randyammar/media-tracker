import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { serverError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("share_links")
    .update({ is_revoked: true })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .single();

  if (error) return serverError(error.message);
  return NextResponse.json({ link: data });
}

