import { Library, ListChecks, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = user
    ? await supabase.from("media_items").select("status,rating").eq("owner_id", user.id)
    : { data: [] };

  const total = items?.length ?? 0;
  const completed = items?.filter((item) => item.status === "completed").length ?? 0;
  const wishlist = items?.filter((item) => item.status === "wishlist").length ?? 0;
  const avgRating =
    items && items.length > 0
      ? (
          items.filter((item) => item.rating).reduce((acc, item) => acc + (item.rating ?? 0), 0) /
          Math.max(1, items.filter((item) => item.rating).length)
        ).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your media collection and activity.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total items</CardTitle>
            <Library className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <ListChecks className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{completed}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Avg. rating</CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{avgRating}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You have {wishlist} items on your wishlist. Use metadata lookup and Music AI Enrich to complete
              missing details faster.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
