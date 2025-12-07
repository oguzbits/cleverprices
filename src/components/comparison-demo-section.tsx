import { Suspense } from "react"
import dynamic from "next/dynamic"

const HeroTableDemo = dynamic(
  () => import("@/components/hero-table-demo").then((mod) => ({ default: mod.HeroTableDemo })),
  { ssr: true }
)

export function ComparisonDemoSection() {
  return (
    <section className="container px-4 mx-auto py-8 sm:py-12 md:py-16" aria-labelledby="comparison-heading">
      <div className="text-left sm:text-center mb-8">
        <h2 id="comparison-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          See How It Works
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl sm:mx-auto">
          Our real-time comparison shows you the true cost per unit across different products,
          helping you make smarter purchasing decisions.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <Suspense fallback={<div className="w-full h-[400px] sm:h-[500px] bg-muted/20 rounded-lg animate-pulse" />}>
          <HeroTableDemo />
        </Suspense>
      </div>
    </section>
  )
}
