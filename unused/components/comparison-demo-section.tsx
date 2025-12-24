import { Suspense } from "react";
import dynamic from "next/dynamic";

const HeroTableDemo = dynamic(
  () =>
    import("@/components/hero-table-demo").then((mod) => ({
      default: mod.HeroTableDemo,
    })),
  { ssr: true },
);

export function ComparisonDemoSection() {
  return (
    <section
      className="container mx-auto px-4 py-8 sm:py-12 md:py-16"
      aria-labelledby="comparison-heading"
    >
      <div className="mb-8 text-left sm:text-center">
        <h2
          id="comparison-heading"
          className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
        >
          See How It Works
        </h2>
        <p className="text-muted-foreground max-w-2xl text-lg sm:mx-auto">
          Our real-time comparison shows you the true cost per unit across
          different products, helping you make smarter purchasing decisions.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <Suspense
          fallback={
            <div className="bg-muted/20 h-[400px] w-full animate-pulse rounded-lg sm:h-[500px]" />
          }
        >
          <HeroTableDemo />
        </Suspense>
      </div>
    </section>
  );
}
