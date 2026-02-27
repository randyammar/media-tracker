import { MediaTable } from "@/components/media/media-table";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Media</h1>
        <p className="text-muted-foreground">Search, track, and manage your collection.</p>
      </div>
      <MediaTable />
    </div>
  );
}

