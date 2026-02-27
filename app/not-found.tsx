import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">The requested resource does not exist or is no longer available.</p>
      <Button asChild>
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}

