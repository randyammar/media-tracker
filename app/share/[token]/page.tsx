import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/layout/brand";
import { StatusBadge } from "@/components/media/status-badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashShareToken } from "@/lib/share";

type Params = { params: Promise<{ token: string }> };

export default async function SharedPage({ params }: Params) {
  const { token } = await params;
  const tokenHash = hashShareToken(token);
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("share_links")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("is_revoked", false)
    .single();

  if (!link) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", link.owner_id)
    .single();

  let items:
    | Array<{
        id: string;
        title: string;
        creator: string;
        media_type: "movie" | "music" | "game";
        status: "owned" | "wishlist" | "currently_using" | "completed";
        genre: string[];
        cover_image_url: string | null;
      }>
    | null = null;

  if (link.scope_type === "collection") {
    const { data } = await supabase
      .from("media_items")
      .select("id,title,creator,media_type,status,genre,cover_image_url")
      .eq("owner_id", link.owner_id)
      .order("updated_at", { ascending: false });
    items = data;
  } else {
    const { data } = await supabase
      .from("media_items")
      .select("id,title,creator,media_type,status,genre,cover_image_url")
      .eq("id", link.media_item_id)
      .eq("owner_id", link.owner_id);
    items = data;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{link.scope_type === "collection" ? "Shared Collection" : "Shared Media Item"}</CardTitle>
            <CardDescription>
              You&apos;re viewing a collection shared by {profile?.display_name ?? "Anonymous collector"}.
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {items?.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.creator}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.cover_image_url ? (
                  <Image
                    src={item.cover_image_url}
                    alt={item.title}
                    width={400}
                    height={220}
                    className="h-44 w-full rounded-lg object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{item.media_type}</Badge>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-muted-foreground">{item.genre.join(", ") || "No genres"}</p>
              </CardContent>
            </Card>
          ))}
          {!items?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No items available.</CardContent>
            </Card>
          ) : null}
        </div>
        <p className="flex items-center justify-center text-sm text-muted-foreground">
          Powered by <Brand className="ml-2" compact />
        </p>
      </div>
    </main>
  );
}
