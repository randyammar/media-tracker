import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MediaForm } from "@/components/media/media-form";
import { MEDIA_TYPE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { MediaItem, MediaType } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export default async function MediaDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data } = await supabase
    .from("media_items")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  const item = data as MediaItem | null;

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{item.title}</h1>
          <p className="text-muted-foreground">
            {MEDIA_TYPE_LABELS[item.media_type as MediaType]} by {item.creator}
          </p>
        </div>
        <Badge variant="outline">{item.media_type === "music" ? "AI Enrich available" : "AI Enrich unavailable"}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <MediaForm initial={item} />

        <div className="space-y-4">
          {item.cover_image_url ? (
            <Card>
              <CardContent className="p-3">
                <Image
                  src={item.cover_image_url}
                  alt={item.title}
                  width={420}
                  height={560}
                  className="h-auto w-full rounded-lg object-cover"
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
