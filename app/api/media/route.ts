import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, serverError } from "@/lib/http";
import { mediaInputSchema, searchSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const params = request.nextUrl.searchParams;
  const parsed = searchSchema.safeParse({
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    mediaType: params.get("mediaType") ?? undefined,
    genre: params.get("genre") ?? undefined,
  });

  if (!parsed.success) {
    return badRequest(parsed.error.flatten().formErrors.join(", "));
  }

  const { supabase, user } = auth;
  let query = supabase
    .from("media_items")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const { q, status, mediaType, genre } = parsed.data;
  if (q) {
    query = query.or(`title.ilike.%${q}%,creator.ilike.%${q}%`);
  }
  if (status) query = query.eq("status", status);
  if (mediaType) query = query.eq("media_type", mediaType);
  if (genre) query = query.contains("genre", [genre]);

  const { data, error } = await query;
  if (error) return serverError(error.message);

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = mediaInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten().formErrors.join(", "));
  }

  const { supabase, user } = auth;
  const payload = {
    owner_id: user.id,
    ...parsed.data,
    release_date: parsed.data.release_date ?? null,
    notes: parsed.data.notes ?? null,
    rating: parsed.data.rating ?? null,
    cover_image_url: parsed.data.cover_image_url ?? null,
    metadata: parsed.data.metadata ?? null,
  };

  const { data, error } = await supabase.from("media_items").insert(payload).select("*").single();
  if (error) return serverError(error.message);
  return NextResponse.json({ item: data }, { status: 201 });
}

