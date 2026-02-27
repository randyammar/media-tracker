"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MEDIA_STATUSES, MEDIA_TYPES, MediaItem, MediaStatus, MediaType } from "@/lib/types";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShareLinkDialog } from "@/components/media/share-link-dialog";

export function MediaTable() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<MediaStatus | "all">("all");
  const [mediaType, setMediaType] = useState<MediaType | "all">("all");
  const [genre, setGenre] = useState("");
  const [busyItemId, setBusyItemId] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      if (mediaType !== "all") params.set("mediaType", mediaType);
      if (genre.trim()) params.set("genre", genre.trim());

      const response = await fetch(`/api/media?${params.toString()}`);
      const payload = (await response.json()) as { items?: MediaItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to load media");
      setItems(payload.items ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load media items");
    } finally {
      setLoading(false);
    }
  }, [genre, mediaType, q, status]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function updateStatus(item: MediaItem, nextStatus: MediaStatus) {
    setBusyItemId(item.id);
    try {
      const response = await fetch(`/api/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { error?: string; item?: MediaItem };
      if (!response.ok || !payload.item) throw new Error(payload.error ?? "Failed to update status");
      setItems((current) => current.map((entry) => (entry.id === item.id ? payload.item! : entry)));
      toast.success("Status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    } finally {
      setBusyItemId("");
    }
  }

  async function deleteItem(item: MediaItem) {
    setBusyItemId(item.id);
    try {
      const response = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Delete failed");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.success("Item deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyItemId("");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Media Library</CardTitle>
        <div className="flex flex-wrap gap-2">
          <ShareLinkDialog scopeType="collection" triggerLabel="Share collection" />
          <Button asChild>
            <Link href="/app/media/new">
              <Plus />
              Add media
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search title or creator"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as MediaStatus | "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {MEDIA_STATUSES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {MEDIA_STATUS_LABELS[entry]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={mediaType} onValueChange={(value) => setMediaType(value as MediaType | "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {MEDIA_TYPES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {MEDIA_TYPE_LABELS[entry]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Filter by genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
          <Button variant="secondary" onClick={loadItems}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link className="font-medium underline-offset-4 hover:underline" href={`/app/media/${item.id}`}>
                        {item.title}
                      </Link>
                    </TableCell>
                    <TableCell>{MEDIA_TYPE_LABELS[item.media_type]}</TableCell>
                    <TableCell>{item.creator}</TableCell>
                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(value) => updateStatus(item, value as MediaStatus)}
                        disabled={busyItemId === item.id}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>{MEDIA_STATUS_LABELS[item.status]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MEDIA_STATUSES.map((entry) => (
                            <SelectItem key={entry} value={entry}>
                              {MEDIA_STATUS_LABELS[entry]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{item.genre.join(", ") || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <ShareLinkDialog scopeType="item" mediaItemId={item.id} triggerLabel="Share" />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={busyItemId === item.id}
                          onClick={() => deleteItem(item)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No media items match the current filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
