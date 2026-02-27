import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureMusicEnrichment, enrichMedia, fallbackEnrichMedia } from "@/lib/ai/gemini";
import { badRequest, serverError } from "@/lib/http";
import { aiEnrichSchema } from "@/lib/validators";

function normalizeReleaseDate(value: unknown) {
  if (typeof value !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeRating(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

function normalizeCoverUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = aiEnrichSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten().formErrors.join(", "));
  }
  if (!parsed.data.itemId && !parsed.data.draft) {
    return badRequest("Provide either itemId or draft payload");
  }

  let item:
    | {
        id: string;
        owner_id: string;
        media_type: "movie" | "music" | "game";
        title: string;
        creator: string;
        release_date: string | null;
        genre: string[];
        rating: number | null;
        notes: string | null;
        cover_image_url: string | null;
        metadata: Record<string, unknown> | null;
      }
    | null = null;

  if (parsed.data.itemId) {
    const { data: found, error: itemError } = await supabase
      .from("media_items")
      .select("*")
      .eq("id", parsed.data.itemId)
      .eq("owner_id", user.id)
      .single();

    if (itemError || !found) return badRequest("Item not found");
    item = found;
  } else if (parsed.data.draft) {
    item = {
      id: "draft",
      owner_id: user.id,
      media_type: parsed.data.draft.media_type,
      title: parsed.data.draft.title,
      creator: parsed.data.draft.creator,
      release_date: parsed.data.draft.release_date ?? null,
      genre: parsed.data.draft.genre ?? [],
      rating: parsed.data.draft.rating ?? null,
      notes: parsed.data.draft.notes ?? null,
      cover_image_url: parsed.data.draft.cover_image_url ?? null,
      metadata: parsed.data.draft.metadata ?? {},
    };
  }

  if (!item) return badRequest("Unable to resolve enrich target");
  if (item.media_type !== "music") {
    return NextResponse.json({ error: "AI Enrich is available for Music only." }, { status: 422 });
  }

  try {
    let enrichment: {
      summary?: string;
      suggestedGenres?: string[];
      suggestedTags?: string[];
      confidence?: number;
      releaseDate?: string | null;
      rating?: number | null;
      coverImageUrl?: string | null;
    };
    let usedFallback = false;

    try {
      enrichment = await enrichMedia(item);
    } catch {
      enrichment = fallbackEnrichMedia(item);
      usedFallback = true;
    }

    if (item.media_type === "music") {
      enrichment = ensureMusicEnrichment(item, enrichment);
    }

    const mergedGenres = Array.from(new Set([...(item.genre ?? []), ...(enrichment.suggestedGenres ?? [])]));
    const enrichedReleaseDate = normalizeReleaseDate(enrichment.releaseDate);
    const enrichedRating = normalizeRating(enrichment.rating);
    const enrichedCoverUrl = normalizeCoverUrl(enrichment.coverImageUrl);
    const mergedMetadata = {
      ...(item.metadata ?? {}),
      ai: {
        summary: enrichment.summary ?? null,
        suggestedTags: enrichment.suggestedTags ?? [],
        confidence: enrichment.confidence ?? null,
        releaseDate: enrichedReleaseDate,
        rating: enrichedRating,
        coverImageUrl: enrichedCoverUrl,
        source: usedFallback ? "fallback" : "gemini",
        updatedAt: new Date().toISOString(),
      },
    };
    const resolvedReleaseDate = item.release_date ?? enrichedReleaseDate;
    const resolvedRating = item.rating ?? enrichedRating;
    const resolvedCoverUrl = item.cover_image_url ?? enrichedCoverUrl;
    const resolvedNotes = item.notes ?? enrichment.summary ?? null;

    if (item.id === "draft") {
      return NextResponse.json({
        enrichment,
        usedFallback,
        draft: {
          ...item,
          genre: mergedGenres,
          release_date: resolvedReleaseDate,
          rating: resolvedRating,
          cover_image_url: resolvedCoverUrl,
          metadata: mergedMetadata,
          notes: resolvedNotes,
        },
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("media_items")
      .update({
        genre: mergedGenres,
        release_date: resolvedReleaseDate,
        rating: resolvedRating,
        cover_image_url: resolvedCoverUrl,
        metadata: mergedMetadata,
        notes: resolvedNotes,
      })
      .eq("id", item.id)
      .eq("owner_id", user.id)
      .select("*")
      .single();

    if (updateError) return serverError(updateError.message);
    return NextResponse.json({ item: updated, enrichment, usedFallback });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "AI enrichment failed");
  }
}
