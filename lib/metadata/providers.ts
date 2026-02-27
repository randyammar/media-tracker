import { MediaType } from "@/lib/types";

export interface MetadataCandidate {
  title: string;
  creator: string;
  release_date: string | null;
  genre: string[];
  cover_image_url: string | null;
  metadata: Record<string, unknown>;
}

const TMDB_GENRE_MAP: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Science Fiction",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
  10770: "TV Movie",
};

type TmdbAuthConfig = {
  headers?: Record<string, string>;
  appendApiKey: boolean;
  key: string;
};

async function tmdbFetch(path: string, params: URLSearchParams, auth: TmdbAuthConfig) {
  if (auth.appendApiKey) {
    params.set("api_key", auth.key);
  }

  return fetch(`https://api.themoviedb.org/3${path}?${params.toString()}`, {
    headers: auth.headers,
    cache: "no-store",
  });
}

async function fetchTmdbDirector(movieId: number, auth: TmdbAuthConfig) {
  const response = await tmdbFetch(`/movie/${movieId}/credits`, new URLSearchParams(), auth);
  if (!response.ok) return "Unknown";

  const payload = (await response.json()) as {
    crew?: Array<{ job?: string; department?: string; name?: string }>;
  };
  const director =
    payload.crew?.find((entry) => entry.job === "Director") ??
    payload.crew?.find((entry) => entry.department === "Directing");

  return director?.name ?? "Unknown";
}

async function searchTmdb(query: string): Promise<MetadataCandidate[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY is missing");
  }

  const isLikelyV4Token = key.includes(".") && key.length > 40;
  const auth: TmdbAuthConfig = {
    headers: isLikelyV4Token ? { Authorization: `Bearer ${key}` } : undefined,
    appendApiKey: !isLikelyV4Token,
    key,
  };

  const response = await tmdbFetch(
    "/search/movie",
    new URLSearchParams({
      query,
      include_adult: "false",
      language: "en-US",
      page: "1",
    }),
    auth,
  );

  if (!response.ok) {
    throw new Error(`TMDB lookup failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: Array<{
      id?: number;
      title?: string;
      original_title?: string;
      release_date?: string;
      poster_path?: string | null;
      overview?: string;
      vote_average?: number;
      popularity?: number;
      genre_ids?: number[];
      original_language?: string;
    }>;
  };

  const movies = (payload.results ?? []).slice(0, 8);
  const firstDirector =
    movies.length > 0 && movies[0].id ? await fetchTmdbDirector(movies[0].id, auth) : "Unknown";

  return movies.map((movie, index) => ({
    title: movie.title ?? movie.original_title ?? "Unknown",
    creator: index === 0 ? firstDirector : "Unknown",
    release_date: movie.release_date ?? null,
    genre: (movie.genre_ids ?? []).map((id) => TMDB_GENRE_MAP[id]).filter(Boolean),
    cover_image_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
    metadata: {
      source: "tmdb",
      overview: movie.overview ?? "",
      vote_average: movie.vote_average ?? null,
      popularity: movie.popularity ?? null,
      genre_ids: movie.genre_ids ?? [],
      language: movie.original_language ?? null,
    },
  }));
}

async function fetchRawgPrimaryData(slug: string, key: string) {
  const response = await fetch(`https://api.rawg.io/api/games/${encodeURIComponent(slug)}?key=${key}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return { creator: "Unknown", description: null as string | null };
  }

  const payload = (await response.json()) as {
    developers?: Array<{ name?: string }>;
    description_raw?: string;
  };

  return {
    creator: payload.developers?.[0]?.name ?? "Unknown",
    description: payload.description_raw ?? null,
  };
}

async function searchRawg(query: string): Promise<MetadataCandidate[]> {
  const key = process.env.RAWG_API_KEY;
  if (!key) {
    throw new Error("RAWG_API_KEY is missing");
  }

  const response = await fetch(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${key}&page_size=8`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`RAWG lookup failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: Array<{
      name?: string;
      released?: string | null;
      background_image?: string | null;
      genres?: Array<{ name?: string }>;
      rating?: number;
      metacritic?: number | null;
      slug?: string;
    }>;
  };

  const games = payload.results ?? [];
  const firstDetails =
    games.length > 0 && games[0].slug ? await fetchRawgPrimaryData(games[0].slug, key) : null;

  return games.map((game, index) => ({
    title: game.name ?? "Unknown",
    creator: index === 0 ? (firstDetails?.creator ?? "Unknown") : "Unknown",
    release_date: game.released ?? null,
    genre: (game.genres ?? []).map((entry) => entry.name ?? "").filter(Boolean),
    cover_image_url: game.background_image ?? null,
    metadata: {
      source: "rawg",
      rawg_slug: game.slug ?? null,
      rating: game.rating ?? null,
      metacritic: game.metacritic ?? null,
      description: index === 0 ? (firstDetails?.description ?? null) : null,
    },
  }));
}

export async function searchMetadata(type: MediaType, query: string) {
  if (type === "music") {
    return [];
  }
  if (type === "movie") {
    return searchTmdb(query);
  }
  return searchRawg(query);
}

