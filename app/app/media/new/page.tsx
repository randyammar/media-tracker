import { MediaForm } from "@/components/media/media-form";

export default function NewMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Media</h1>
        <p className="text-muted-foreground">Create a new movie, music, or game entry.</p>
      </div>
      <MediaForm />
    </div>
  );
}

