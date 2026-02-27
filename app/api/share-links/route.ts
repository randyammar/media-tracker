import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { badRequest, serverError } from "@/lib/http";
import { generateShareToken, hashShareToken } from "@/lib/share";
import { shareLinkInputSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return serverError(error.message);
  return NextResponse.json({ links: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = shareLinkInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten().formErrors.join(", "));
  }

  const { scope_type, media_item_id } = parsed.data;
  if (scope_type === "item" && !media_item_id) {
    return badRequest("media_item_id is required for item share links");
  }

  if (scope_type === "item" && media_item_id) {
    const { data: found, error: lookupError } = await supabase
      .from("media_items")
      .select("id")
      .eq("id", media_item_id)
      .eq("owner_id", user.id)
      .single();

    if (lookupError || !found) {
      return badRequest("Media item not found");
    }
  }

  let existingQuery = supabase
    .from("share_links")
    .select("*")
    .eq("owner_id", user.id)
    .eq("scope_type", scope_type)
    .eq("is_revoked", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (scope_type === "item") {
    existingQuery = existingQuery.eq("media_item_id", media_item_id);
  } else {
    existingQuery = existingQuery.is("media_item_id", null);
  }

  const { data: existingRows, error: existingError } = await existingQuery;
  if (existingError) return serverError(existingError.message);

  const existing = existingRows?.[0];
  if (existing) {
    if (existing.token) {
      return NextResponse.json({
        link: existing,
        shareUrl: `${request.nextUrl.origin}/share/${existing.token}`,
      });
    }

    const recoveredToken = generateShareToken();
    const recoveredHash = hashShareToken(recoveredToken);
    const { data: updatedExisting, error: recoverError } = await supabase
      .from("share_links")
      .update({
        token: recoveredToken,
        token_hash: recoveredHash,
      })
      .eq("id", existing.id)
      .eq("owner_id", user.id)
      .select("*")
      .single();

    if (recoverError) return serverError(recoverError.message);
    return NextResponse.json({
      link: updatedExisting,
      shareUrl: `${request.nextUrl.origin}/share/${recoveredToken}`,
    });
  }

  const token = generateShareToken();
  const token_hash = hashShareToken(token);

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      owner_id: user.id,
      scope_type,
      media_item_id: scope_type === "item" ? media_item_id : null,
      token,
      token_hash,
    })
    .select("*")
    .single();

  if (error) {
    const isMissingTokenColumn = (error as { code?: string }).code === "42703";
    if (isMissingTokenColumn) {
      return serverError(
        "share_links.token column is missing. Apply migration 202602270002_share_links_persistent.sql.",
      );
    }

    const isUniqueError = (error as { code?: string }).code === "23505";
    if (!isUniqueError) return serverError(error.message);

    let retryQuery = supabase
      .from("share_links")
      .select("*")
      .eq("owner_id", user.id)
      .eq("scope_type", scope_type)
      .eq("is_revoked", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (scope_type === "item") {
      retryQuery = retryQuery.eq("media_item_id", media_item_id);
    } else {
      retryQuery = retryQuery.is("media_item_id", null);
    }

    const { data: retryRows, error: retryError } = await retryQuery;
    if (retryError) return serverError(retryError.message);
    const retry = retryRows?.[0];
    if (!retry?.token) return serverError("Failed to reuse existing share link");

    return NextResponse.json({
      link: retry,
      shareUrl: `${request.nextUrl.origin}/share/${retry.token}`,
    });
  }

  return NextResponse.json({
    link: data,
    shareUrl: `${request.nextUrl.origin}/share/${token}`,
  });
}
