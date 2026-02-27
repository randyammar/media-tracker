"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { MEDIA_STATUSES, MEDIA_TYPES, MediaItem, MediaStatus, MediaType } from "@/lib/types";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MetadataCandidate {
  title: string;
  creator: string;
  release_date: string | null;
  genre: string[];
  cover_image_url: string | null;
  metadata: Record<string, unknown>;
}

interface MediaFormProps {
  initial?: MediaItem | null;
}

const defaultItem = {
  media_type: "movie" as MediaType,
  title: "",
  creator: "",
  release_date: "",
  genre: "",
  status: "wishlist" as MediaStatus,
  rating: "",
  notes: "",
  cover_image_url: "",
};

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractCandidateNotes(candidate: MetadataCandidate) {
  const overview = toStringValue(candidate.metadata.overview);
  if (overview) return overview;
  const description = toStringValue(candidate.metadata.description);
  if (description) return description;
  return "";
}

function extractCandidateRating(candidate: MetadataCandidate) {
  const source = toStringValue(candidate.metadata.source);
  const raw = Number(candidate.metadata.vote_average ?? candidate.metadata.rating);
  if (!Number.isFinite(raw) || raw <= 0) return "";

  const normalized = source === "rawg" ? raw * 2 : raw;
  const clamped = Math.max(1, Math.min(10, Math.round(normalized)));
  return String(clamped);
}

export function MediaForm({ initial }: MediaFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    media_type: initial?.media_type ?? defaultItem.media_type,
    title: initial?.title ?? defaultItem.title,
    creator: initial?.creator ?? defaultItem.creator,
    release_date: initial?.release_date ?? defaultItem.release_date,
    genre: initial?.genre?.join(", ") ?? defaultItem.genre,
    status: initial?.status ?? defaultItem.status,
    rating: initial?.rating?.toString() ?? defaultItem.rating,
    notes: initial?.notes ?? defaultItem.notes,
    cover_image_url: initial?.cover_image_url ?? defaultItem.cover_image_url,
  }));
  const [saving, setSaving] = useState(false);
  const [searchingMetadata, setSearchingMetadata] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [selectedMetadata, setSelectedMetadata] = useState<Record<string, unknown>>(() => {
    const metadata = initial?.metadata;
    return metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};
  });

  const isMusic = form.media_type === "music";
  const hasTitleAndCreator = form.title.trim().length > 0 && form.creator.trim().length > 0;
  const canUseAi = isMusic && (Boolean(initial?.id) || hasTitleAndCreator);
  const metadataHint = useMemo(
    () =>
      isMusic
        ? "Use Gemini to generate music insights from title and existing item data. External metadata lookup is disabled."
        : "Use metadata lookup to prefill movie/game fields. AI Enrich is available for Music only.",
    [isMusic],
  );

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toPayload() {
    return {
      media_type: form.media_type,
      title: form.title.trim(),
      creator: form.creator.trim(),
      release_date: form.release_date ? form.release_date : null,
      genre: form.genre
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      status: form.status,
      rating: form.rating ? Number(form.rating) : null,
      notes: form.notes.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      metadata: selectedMetadata,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const method = initial ? "PATCH" : "POST";
      const url = initial ? `/api/media/${initial.id}` : "/api/media";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload()),
      });
      const payload = (await response.json()) as { error?: string; item?: MediaItem };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "Failed to save item");
      }

      toast.success(initial ? "Item updated" : "Item created");
      if (initial) {
        router.refresh();
      } else {
        router.push(`/app/media/${payload.item.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save media item");
    } finally {
      setSaving(false);
    }
  }

  async function runMetadataLookup() {
    if (isMusic) return;
    if (form.title.trim().length < 2) {
      toast.error("Enter at least 2 characters in title before searching metadata");
      return;
    }

    setSearchingMetadata(true);
    try {
      const response = await fetch(
        `/api/metadata/search?mediaType=${form.media_type}&q=${encodeURIComponent(form.title.trim())}`,
      );
      const payload = (await response.json()) as { results?: MetadataCandidate[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Metadata lookup failed");
      const results = payload.results ?? [];
      if (!results.length) {
        toast.info("No metadata candidates found");
      } else {
        applyMetadata(results[0], false);
        toast.success("Auto-filled from first metadata result");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Metadata lookup failed");
    } finally {
      setSearchingMetadata(false);
    }
  }

  function applyMetadata(candidate: MetadataCandidate, showToast = true) {
    const candidateRating = extractCandidateRating(candidate);
    const candidateNotes = extractCandidateNotes(candidate);
    setForm((prev) => ({
      ...prev,
      title: candidate.title || prev.title,
      creator: prev.creator || candidate.creator || "Unknown",
      release_date: candidate.release_date ?? prev.release_date,
      genre: candidate.genre.length ? candidate.genre.join(", ") : prev.genre,
      rating: prev.rating || candidateRating,
      notes: prev.notes || candidateNotes,
      cover_image_url: candidate.cover_image_url ?? prev.cover_image_url,
    }));
    setSelectedMetadata((prev) => ({
      ...prev,
      ...candidate.metadata,
      source_candidate_title: candidate.title,
      source_applied_at: new Date().toISOString(),
    }));

    if (showToast) {
      toast.success("Metadata applied");
    }
  }

  async function runAiEnrichment() {
    if (!canUseAi) {
      toast.error("Enter both title and creator before running AI Enrich");
      return;
    }

    setEnriching(true);
    try {
      const body = initial?.id
        ? { itemId: initial.id }
        : {
            draft: {
              media_type: form.media_type,
              title: form.title.trim(),
              creator: form.creator.trim(),
              release_date: form.release_date || null,
              genre: form.genre
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean),
              rating: form.rating ? Number(form.rating) : null,
              notes: form.notes.trim() || null,
              cover_image_url: form.cover_image_url.trim() || null,
              metadata: selectedMetadata,
            },
          };

      const response = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        error?: string;
        enrichment?: {
          summary?: string;
          suggestedGenres?: string[];
          suggestedTags?: string[];
          confidence?: number;
        };
        usedFallback?: boolean;
        draft?: {
          genre?: string[];
          release_date?: string | null;
          rating?: number | null;
          notes?: string | null;
          cover_image_url?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
      if (!response.ok) throw new Error(payload.error ?? "AI enrichment failed");

      if (initial?.id) {
        toast.success(payload.usedFallback ? "AI enrich applied (fallback mode)" : "AI enrichment added summary and tags");
        router.refresh();
      } else {
        if (payload.draft?.genre?.length) {
          updateField("genre", payload.draft.genre.join(", "));
        }
        if (!form.release_date && payload.draft?.release_date) {
          updateField("release_date", payload.draft.release_date);
        }
        if (!form.rating && payload.draft?.rating) {
          updateField("rating", String(payload.draft.rating));
        }
        if (!form.notes && payload.draft?.notes) {
          updateField("notes", payload.draft.notes);
        }
        if (!form.cover_image_url && payload.draft?.cover_image_url) {
          updateField("cover_image_url", payload.draft.cover_image_url);
        }
        if (payload.draft?.metadata) {
          setSelectedMetadata(payload.draft.metadata);
        }
        toast.success(payload.usedFallback ? "AI enrich applied to draft (fallback mode)" : "AI enrich applied to draft");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI enrichment failed");
    } finally {
      setEnriching(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>{initial ? "Edit media item" : "Add media item"}</CardTitle>
          <CardDescription>{metadataHint}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Media type</Label>
            <Select value={form.media_type} onValueChange={(value) => updateField("media_type", value as MediaType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MEDIA_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => updateField("status", value as MediaStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {MEDIA_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => updateField("title", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creator">Creator</Label>
            <Input
              id="creator"
              value={form.creator}
              onChange={(e) => updateField("creator", e.target.value)}
              placeholder="Director, artist, studio..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="release_date">Release date</Label>
            <Input
              id="release_date"
              type="date"
              value={form.release_date ?? ""}
              onChange={(e) => updateField("release_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (1-10)</Label>
            <Input
              id="rating"
              type="number"
              min={1}
              max={10}
              value={form.rating}
              onChange={(e) => updateField("rating", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="genre">Genres (comma-separated)</Label>
            <Input
              id="genre"
              value={form.genre}
              onChange={(e) => updateField("genre", e.target.value)}
              placeholder="Action, RPG, Jazz..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cover_image_url">Cover image URL</Label>
            <Input
              id="cover_image_url"
              value={form.cover_image_url}
              onChange={(e) => updateField("cover_image_url", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assist Tools</CardTitle>
          <CardDescription>
            {isMusic
              ? "Music AI assistance is generated from title, creator, and existing item details."
              : "Metadata lookup is available for movies and games."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {!isMusic ? (
              <Button type="button" variant="outline" onClick={runMetadataLookup} disabled={searchingMetadata}>
                {searchingMetadata ? <Loader2 className="animate-spin" /> : <Wand2 />}
                Find metadata
              </Button>
            ) : null}
            {isMusic ? (
              <Button type="button" variant="outline" onClick={runAiEnrichment} disabled={!canUseAi || enriching}>
                {enriching ? <Loader2 className="animate-spin" /> : <Sparkles />}
                AI Enrich
              </Button>
            ) : null}
            {isMusic && !initial && !hasTitleAndCreator ? (
              <p className="self-center text-xs text-muted-foreground">Enter title and creator to enable AI Enrich.</p>
            ) : null}
          </div>

          {!isMusic ? (
            <p className="text-xs text-muted-foreground">
              First metadata match is auto-applied. Results list is hidden.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : null}
        {initial ? "Save changes" : "Create item"}
      </Button>
    </form>
  );
}
