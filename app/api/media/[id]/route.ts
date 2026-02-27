import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, serverError } from "@/lib/http";
import { mediaUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (error) return serverError(error.message);
  return NextResponse.json({ item: data });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten().formErrors.join(", "));
  }

  const { id } = await params;
  const { supabase, user } = auth;
  const payload = {
    ...parsed.data,
    release_date: parsed.data.release_date ?? null,
    notes: parsed.data.notes ?? null,
    rating: parsed.data.rating ?? null,
    cover_image_url: parsed.data.cover_image_url ?? null,
    metadata: parsed.data.metadata ?? null,
  };

  const { data, error } = await supabase
    .from("media_items")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .single();

  if (error) return serverError(error.message);
  return NextResponse.json({ item: data });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { supabase, user } = auth;
  const { error } = await supabase
    .from("media_items")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return serverError(error.message);
  return NextResponse.json({ success: true });
}

