import { HeroContent } from "@/components/landing/hero-content";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Navbar } from "@/components/layout/navbar";

export function HeroSection() {
  return (
    <section className="relative z-10 min-h-[100svh]">
      <div className="relative flex min-h-[100svh] flex-col">
        <Navbar />

        <div className="relative z-20 flex shrink-0 flex-col">
          <HeroContent />
        </div>

        <div className="relative z-10 -mt-6 flex flex-1 items-end sm:-mt-12 md:-mt-24 lg:-mt-36 xl:-mt-40">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}