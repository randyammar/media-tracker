import { redirect } from "next/navigation";
import { CollectionInsights } from "@/components/insights/collection-insights";
import { MEDIA_STATUS_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: items } = await supabase
    .from("media_items")
    .select("status,genre,release_date")
    .eq("owner_id", user.id);

  const statusMap = new Map<string, number>();
  const genreMap = new Map<string, number>();
  const yearMap = new Map<string, number>();

  for (const item of items ?? []) {
    statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1);
    for (const genre of item.genre ?? []) {
      genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
    }
    if (item.release_date) {
      const year = item.release_date.slice(0, 4);
      yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
    }
  }

  const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({
    name: MEDIA_STATUS_LABELS[name as keyof typeof MEDIA_STATUS_LABELS] ?? name,
    value,
  }));
  const genreData = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
  const yearData = Array.from(yearMap.entries())
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({ year, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Collection Insights</h1>
        <p className="text-muted-foreground">
          Visual breakdown by status, genre, and release timeline across your collection.
        </p>
      </div>
      <CollectionInsights statusData={statusData} genreData={genreData} yearData={yearData} />
    </div>
  );
}

