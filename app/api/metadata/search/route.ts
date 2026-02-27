import { NextRequest, NextResponse } from "next/server";
import { MEDIA_TYPES } from "@/lib/types";
import { badRequest, serverError } from "@/lib/http";
import { searchMetadata } from "@/lib/metadata/providers";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const mediaType = request.nextUrl.searchParams.get("mediaType");

  if (!q || q.length < 2) {
    return badRequest("Query must be at least 2 characters");
  }
  if (!mediaType || !MEDIA_TYPES.includes(mediaType as (typeof MEDIA_TYPES)[number])) {
    return badRequest("Invalid mediaType");
  }

  if (mediaType === "music") {
    return NextResponse.json({
      results: [],
      note: "Music metadata lookup is disabled. Use Gemini Assist Tools to generate data from title.",
    });
  }

  try {
    const results = await searchMetadata(mediaType as "movie" | "game", q);
    return NextResponse.json({ results });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Metadata lookup failed");
  }
}
