"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Movies",
    subtitle: "Catalog films with rich metadata and status tracking.",
    image: "/hero-movie.svg",
    accent: "from-blue-500/40 to-indigo-500/10",
  },
  {
    title: "Music",
    subtitle: "Use AI Enrich to fill missing music details from title and creator.",
    image: "/hero-music.svg",
    accent: "from-amber-500/40 to-fuchsia-500/10",
  },
  {
    title: "Games",
    subtitle: "Track ownership, progress, and platform-ready collections.",
    image: "/hero-game.svg",
    accent: "from-emerald-500/40 to-cyan-500/10",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  function goNext() {
    setIndex((prev) => (prev + 1) % slides.length);
  }

  function goPrev() {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }

  const active = slides[index];

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      <div className={cn("absolute inset-0 bg-gradient-to-tr", active.accent)} />
      <div className="relative aspect-[16/11] w-full">
        <Image src={active.image} alt={active.title} fill className="object-cover" priority />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
        <p className="text-lg font-semibold">{active.title}</p>
        <p className="text-sm text-zinc-200">{active.subtitle}</p>
      </div>

      <div className="absolute left-3 top-3 flex gap-2">
        <Button type="button" size="icon-sm" variant="secondary" className="bg-white/85" onClick={goPrev}>
          <ChevronLeft />
        </Button>
        <Button type="button" size="icon-sm" variant="secondary" className="bg-white/85" onClick={goNext}>
          <ChevronRight />
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Go to ${slide.title}`}
            onClick={() => setIndex(slideIndex)}
            className={cn(
              "h-2.5 rounded-full transition-all",
              slideIndex === index ? "w-7 bg-white" : "w-2.5 bg-white/50 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </div>
  );
}

