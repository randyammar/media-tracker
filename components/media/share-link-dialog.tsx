"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Link2, ShieldBan } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareLinkDialogProps {
  scopeType: "collection" | "item";
  mediaItemId?: string;
  triggerLabel: string;
  triggerClassName?: string;
}

export function ShareLinkDialog({
  scopeType,
  mediaItemId,
  triggerLabel,
  triggerClassName,
}: ShareLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [linkId, setLinkId] = useState("");
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const generate = useCallback(async (silent: boolean) => {
    setLoading(true);
    try {
      const response = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope_type: scopeType,
          media_item_id: scopeType === "item" ? mediaItemId : null,
        }),
      });
      const payload = (await response.json()) as { error?: string; shareUrl?: string; link?: { id: string } };
      if (!response.ok || !payload.shareUrl || !payload.link?.id) {
        throw new Error(payload.error ?? "Failed to generate share link");
      }
      setLink(payload.shareUrl);
      setLinkId(payload.link.id);
      if (!silent) {
        toast.success("Share link generated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  }, [mediaItemId, scopeType]);

  const generateFromClick = useCallback(() => {
    void generate(false);
  }, [generate]);

  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/share-links", { cache: "no-store" });
      const payload = (await response.json()) as {
        error?: string;
        links?: Array<{
          id: string;
          scope_type: "collection" | "item";
          media_item_id: string | null;
          token?: string | null;
          is_revoked: boolean;
        }>;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load existing share links");
      }

      const existing = (payload.links ?? []).find((entry) => {
        if (entry.is_revoked) return false;
        if (entry.scope_type !== scopeType) return false;
        if (scopeType === "collection") return !entry.media_item_id;
        return entry.media_item_id === mediaItemId;
      });

      if (!existing) {
        setLink("");
        setLinkId("");
        return;
      }

      if (existing.token) {
        setLink(`${window.location.origin}/share/${existing.token}`);
        setLinkId(existing.id);
        return;
      }

      await generate(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load share link");
    } finally {
      setLoading(false);
    }
  }, [generate, mediaItemId, scopeType]);

  useEffect(() => {
    if (!open) return;
    void loadExisting();
  }, [loadExisting, open]);

  async function revoke() {
    if (!linkId) return;
    setRevoking(true);
    try {
      const response = await fetch(`/api/share-links/${linkId}/revoke`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to revoke link");
      setLink("");
      setLinkId("");
      toast.success("Share link revoked");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke link");
    } finally {
      setRevoking(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={triggerClassName}>
          <Link2 />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create share link</DialogTitle>
          <DialogDescription>
            Generates an unlisted public URL. Anyone with the URL can view this {scopeType}.
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-2">
            <Input value={link} readOnly />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={copyLink}>
                <Copy />
                Copy
              </Button>
              <Button type="button" variant="destructive" onClick={revoke} disabled={revoking}>
                {revoking ? <Loader2 className="animate-spin" /> : <ShieldBan />}
                Revoke
              </Button>
            </div>
          </div>
        ) : loading ? (
          <Button type="button" disabled>
            <Loader2 className="animate-spin" />
            Loading link
          </Button>
        ) : (
          <Button type="button" onClick={generateFromClick} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Link2 />}
            Generate link
          </Button>
        )}

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
