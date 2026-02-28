"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MEDIA_STATUSES, MEDIA_TYPES, MediaItem, MediaStatus, MediaType } from "@/lib/types";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [deleteCandidate, setDeleteCandidate] = useState<MediaItem | null>(null);

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
      setDeleteCandidate(null);
      toast.success("Item deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyItemId("");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Media Library</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <ShareLinkDialog
            scopeType="collection"
            triggerLabel="Share collection"
            triggerClassName="w-full justify-center sm:w-auto"
          />
          <Button asChild className="w-full sm:w-auto">
            <Link href="/app/media/new">
              <Plus />
              Add media
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search title or creator"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <Select value={status} onValueChange={(value) => setStatus(value as MediaStatus | "all")}>
              <SelectTrigger className="w-full">
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
          </div>
          <div className="lg:col-span-2">
            <Select value={mediaType} onValueChange={(value) => setMediaType(value as MediaType | "all")}>
              <SelectTrigger className="w-full">
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
          </div>
          <div className="sm:col-span-1 lg:col-span-3">
            <Input placeholder="Filter by genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
          </div>
          <Button
            variant="secondary"
            className="w-full sm:col-span-1 lg:col-span-1 lg:w-full"
            onClick={loadItems}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No media items match the current filters.
          </div>
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {items.map((item) => (
                <div key={item.id} className="space-y-4 rounded-xl border p-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        className="min-w-0 flex-1 text-base font-medium underline-offset-4 hover:underline"
                        href={`/app/media/${item.id}`}
                      >
                        <span className="break-words">{item.title}</span>
                      </Link>
                      <span className="rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                        {MEDIA_TYPE_LABELS[item.media_type]}
                      </span>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{item.creator || "-"}</p>
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Status</p>
                      <Select
                        value={item.status}
                        onValueChange={(value) => updateStatus(item, value as MediaStatus)}
                        disabled={busyItemId === item.id}
                      >
                        <SelectTrigger className="w-full">
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
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Genres</p>
                      <p className="break-words text-sm text-muted-foreground">
                        {item.genre.length > 0 ? item.genre.join(", ") : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ShareLinkDialog
                      scopeType="item"
                      mediaItemId={item.id}
                      triggerLabel="Share"
                      triggerClassName="w-full justify-center sm:w-auto"
                    />
                    <Button
                      variant="outline"
                      className="w-full justify-center text-destructive hover:text-destructive sm:w-auto"
                      disabled={busyItemId === item.id}
                      onClick={() => setDeleteCandidate(item)}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden rounded-xl border lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-64 whitespace-normal">
                        <Link
                          className="font-medium underline-offset-4 hover:underline"
                          href={`/app/media/${item.id}`}
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>{MEDIA_TYPE_LABELS[item.media_type]}</TableCell>
                      <TableCell className="max-w-56 whitespace-normal">{item.creator || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateStatus(item, value as MediaStatus)}
                          disabled={busyItemId === item.id}
                        >
                          <SelectTrigger className="min-w-[11rem]">
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
                      <TableCell className="max-w-72 whitespace-normal">
                        {item.genre.length > 0 ? item.genre.join(", ") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="ml-auto flex w-fit items-center gap-2">
                          <ShareLinkDialog scopeType="item" mediaItemId={item.id} triggerLabel="Share" />
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            disabled={busyItemId === item.id}
                            onClick={() => setDeleteCandidate(item)}
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
      <Dialog open={Boolean(deleteCandidate)} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete media item?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{deleteCandidate?.title ?? "this item"}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCandidate(null)}
              disabled={Boolean(deleteCandidate && busyItemId === deleteCandidate.id)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteCandidate && deleteItem(deleteCandidate)}
              disabled={Boolean(deleteCandidate && busyItemId === deleteCandidate.id)}
            >
              {deleteCandidate && busyItemId === deleteCandidate.id ? <Loader2 className="animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
