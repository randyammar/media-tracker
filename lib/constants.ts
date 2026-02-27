import { MediaStatus, MediaType } from "@/lib/types";

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Movie",
  music: "Music",
  game: "Game",
};

export const MEDIA_STATUS_LABELS: Record<MediaStatus, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
  currently_using: "Currently Using",
  completed: "Completed",
};

export const MEDIA_STATUS_COLORS: Record<MediaStatus, string> = {
  owned: "bg-emerald-100 text-emerald-700 border-emerald-200",
  wishlist: "bg-amber-100 text-amber-700 border-amber-200",
  currently_using: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-violet-100 text-violet-700 border-violet-200",
};

export const APP_NAME = "Collectify";
