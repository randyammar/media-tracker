export const MEDIA_TYPES = ["movie", "music", "game"] as const;
export const MEDIA_STATUSES = [
  "owned",
  "wishlist",
  "currently_using",
  "completed",
] as const;
export const SHARE_SCOPE_TYPES = ["collection", "item"] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];
export type MediaStatus = (typeof MEDIA_STATUSES)[number];
export type ShareScopeType = (typeof SHARE_SCOPE_TYPES)[number];

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  owner_id: string;
  media_type: MediaType;
  title: string;
  creator: string;
  release_date: string | null;
  genre: string[];
  status: MediaStatus;
  rating: number | null;
  notes: string | null;
  cover_image_url: string | null;
  metadata: Record<string, Json> | null;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  owner_id: string;
  scope_type: ShareScopeType;
  media_item_id: string | null;
  token: string | null;
  token_hash: string;
  is_revoked: boolean;
  created_at: string;
}

export interface EnrichedMetadata {
  summary?: string;
  suggestedGenres?: string[];
  suggestedTags?: string[];
  confidence?: number;
}
