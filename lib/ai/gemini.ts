const MODEL = "gemini-2.0-flash";

type EnrichTarget = {
  media_type: "movie" | "music" | "game";
  title: string;
  creator: string;
  release_date: string | null;
  genre: string[];
  notes: string | null;
  metadata: unknown;
};

export type EnrichmentPayload = {
  summary?: string;
  suggestedGenres?: string[];
  suggestedTags?: string[];
  confidence?: number;
  releaseDate?: string | null;
  rating?: number | null;
  coverImageUrl?: string | null;
};

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

const MUSIC_GENRE_HINTS: Array<{ pattern: RegExp; genre: string }> = [
  { pattern: /\b(rock|metal|punk|grunge)\b/i, genre: "Rock" },
  { pattern: /\b(pop|dance)\b/i, genre: "Pop" },
  { pattern: /\b(hip\s?hop|rap|trap)\b/i, genre: "Hip Hop" },
  { pattern: /\b(jazz|swing|blues)\b/i, genre: "Jazz" },
  { pattern: /\b(classic|orchestra|symphony|piano)\b/i, genre: "Classical" },
  { pattern: /\b(edm|house|techno|trance)\b/i, genre: "Electronic" },
  { pattern: /\b(country|folk)\b/i, genre: "Country" },
];

const TITLE_GENRE_HINTS: Array<{ pattern: RegExp; genre: string }> = [
  { pattern: /\b(space|galaxy|future|cyber)\b/i, genre: "Science Fiction" },
  { pattern: /\b(love|heart|romance)\b/i, genre: "Romance" },
  { pattern: /\b(dark|night|fear|haunt)\b/i, genre: "Horror" },
  { pattern: /\b(war|battle|soldier)\b/i, genre: "War" },
  { pattern: /\b(crime|mafia|heist)\b/i, genre: "Crime" },
  { pattern: /\b(adventure|quest|legend)\b/i, genre: "Adventure" },
];

function tokenizeTags(input: string) {
  return Array.from(
    new Set(
      input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((part) => part.length >= 4)
        .slice(0, 6),
    ),
  );
}

function inferMusicGenres(input: string) {
  const inferred = MUSIC_GENRE_HINTS.filter((rule) => rule.pattern.test(input)).map((rule) => rule.genre);
  return Array.from(new Set(inferred));
}

function inferReleaseDateFromText(input: string) {
  const yearMatch = input.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    return `${yearMatch[1]}-01-01`;
  }

  const now = new Date();
  const fallbackYear = String(now.getUTCFullYear());
  return `${fallbackYear}-01-01`;
}

export function fallbackEnrichMedia(
  item: Pick<EnrichTarget, "media_type" | "title" | "creator" | "genre" | "notes">,
) {
  const composite = `${item.title} ${item.creator} ${item.notes ?? ""}`.trim();
  const inferred = item.media_type === "music" ? MUSIC_GENRE_HINTS : TITLE_GENRE_HINTS;
  const inferredGenres = inferred
    .filter((rule) => rule.pattern.test(composite))
    .map((rule) => rule.genre)
    .slice(0, 3);
  const suggestedGenres = Array.from(new Set([...(item.genre ?? []), ...inferredGenres])).slice(0, 5);
  const suggestedTags = tokenizeTags(`${item.title} ${item.creator}`);

  const summary =
    item.media_type === "music"
      ? `${item.title} by ${item.creator} enriched from title and creator context.`
      : `${item.title} enriched from available metadata and title context.`;

  const safeTitle = encodeURIComponent(item.title || "Media");
  const safeCreator = encodeURIComponent(item.creator || "Unknown");
  const fallbackCover = `https://placehold.co/600x600/png?text=${safeTitle}%20-%20${safeCreator}`;

  return {
    summary,
    suggestedGenres,
    suggestedTags,
    confidence: 0.35,
    releaseDate: null,
    rating: null,
    coverImageUrl: fallbackCover,
  };
}

export function ensureMusicEnrichment(
  item: Pick<EnrichTarget, "title" | "creator" | "genre" | "notes">,
  enrichment: EnrichmentPayload,
) {
  const composite = `${item.title} ${item.creator} ${item.notes ?? ""}`.trim();
  const inferredGenres = inferMusicGenres(composite);
  const mergedGenres = Array.from(
    new Set([...(enrichment.suggestedGenres ?? []), ...(item.genre ?? []), ...inferredGenres]),
  );

  const safeTitle = encodeURIComponent(item.title || "Music");
  const safeCreator = encodeURIComponent(item.creator || "Unknown");
  const placeholderCover = `https://placehold.co/600x600/png?text=${safeTitle}%20-%20${safeCreator}`;
  const inferredReleaseDate = inferReleaseDateFromText(composite);

  return {
    ...enrichment,
    suggestedGenres: mergedGenres.length ? mergedGenres : ["Music"],
    rating: enrichment.rating ?? 7,
    releaseDate: enrichment.releaseDate ?? inferredReleaseDate,
    coverImageUrl: enrichment.coverImageUrl ?? placeholderCover,
  } satisfies EnrichmentPayload;
}

export async function enrichMedia(
  item: EnrichTarget,
) {
  const prompt = `You are enriching a personal media tracker item.
Return strict JSON with keys:
- summary (string)
- suggestedGenres (string[])
- suggestedTags (string[])
- confidence (number between 0 and 1)
- releaseDate (string in YYYY-MM-DD format or null)
- rating (number 1-10 or null)
- coverImageUrl (absolute URL string or null)
If media_type is "music", generate output primarily from title and creator, then use notes/metadata as supporting context.
Item JSON:
${JSON.stringify(
  {
    media_type: item.media_type,
    title: item.title,
    creator: item.creator,
    release_date: item.release_date,
    genre: item.genre,
    notes: item.notes,
    metadata: item.metadata,
  },
  null,
  2,
)}`;

  const raw = await callGemini(prompt);
  return JSON.parse(raw) as EnrichmentPayload;
}
