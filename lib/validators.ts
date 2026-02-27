import { z } from "zod";
import { MEDIA_STATUSES, MEDIA_TYPES, SHARE_SCOPE_TYPES } from "@/lib/types";

export const mediaInputSchema = z.object({
  media_type: z.enum(MEDIA_TYPES),
  title: z.string().trim().min(1).max(200),
  creator: z.string().trim().min(1).max(200),
  release_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Release date must use YYYY-MM-DD")
    .nullable()
    .optional(),
  genre: z.array(z.string().trim().min(1).max(60)).default([]),
  status: z.enum(MEDIA_STATUSES),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  cover_image_url: z.string().url().max(1000).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const mediaUpdateSchema = mediaInputSchema.partial();

export const shareLinkInputSchema = z.object({
  scope_type: z.enum(SHARE_SCOPE_TYPES),
  media_item_id: z.string().uuid().nullable().optional(),
});

export const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(MEDIA_STATUSES).optional(),
  mediaType: z.enum(MEDIA_TYPES).optional(),
  genre: z.string().trim().max(60).optional(),
});

export const aiEnrichSchema = z.object({
  itemId: z.string().uuid().optional(),
  draft: z
    .object({
      media_type: z.enum(MEDIA_TYPES),
      title: z.string().trim().min(1).max(200),
      creator: z.string().trim().min(1).max(200),
      release_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Release date must use YYYY-MM-DD")
        .nullable()
        .optional(),
      genre: z.array(z.string().trim().min(1).max(60)).default([]),
      rating: z.number().int().min(1).max(10).nullable().optional(),
      notes: z.string().trim().max(5000).nullable().optional(),
      cover_image_url: z.string().url().max(1000).nullable().optional(),
      metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    })
    .optional(),
});
