import Link from "next/link";
import { ArrowRight, Disc3, Film, Gamepad2, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brand } from "@/components/layout/brand";
import { HeroCarousel } from "@/components/home/hero-carousel";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border bg-card/85 p-7 shadow-2xl backdrop-blur md:p-12">
        <div className="pointer-events-none absolute -left-20 top-0 size-48 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-2 size-64 rounded-full bg-chart-4/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-7">
            <Brand className="text-base" />
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">AI-powered media hub</h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Manage movies, music, and games in one place. Track ownership and progress, share curated
                lists, and use AI helpers for Music enrichment.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Film className="size-4 text-chart-2" />
                  Movies
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Track releases and progress</p>
              </div>
              <div className="rounded-xl border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Disc3 className="size-4 text-chart-4" />
                  Music
                </div>
                <p className="mt-1 text-xs text-muted-foreground">AI Enrich from title + creator</p>
              </div>
              <div className="rounded-xl border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gamepad2 className="size-4 text-chart-1" />
                  Games
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Own, wishlist, currently using</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">
                  Create account
                  <ArrowRight />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <HeroCarousel />
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-chart-4" />
                    Metadata Assist
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  AI Enrich is available for Music and generated from title/creator context.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Share2 className="size-4 text-chart-2" />
                    Secure Sharing
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Generate on-demand unlisted links for single items or your full collection.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
