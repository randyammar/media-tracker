import { MediaTable } from "@/components/media/media-table";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">Media</h1>
        <p className="text-muted-foreground">Search, track, and manage your collection.</p>
      </div>
      <MediaTable />
    </div>
  );
}
