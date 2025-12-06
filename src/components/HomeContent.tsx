import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  HardDrive,
  Dumbbell,
  Droplets,
  Baby,
  Battery,
  Globe,
} from "lucide-react";
import { ClientGlobe } from "@/components/client/ClientGlobe";
import { ClientFeaturedDeals } from "@/components/client/ClientFeaturedDeals";
import { getCategoryPath } from "@/lib/categories";
import { getAllCountries } from "@/lib/countries";

const HeroTableDemo = dynamic(
  () => import("@/components/hero-table-demo").then((mod) => ({ default: mod.HeroTableDemo })),
  { ssr: true }
);

const categories = [
  { name: "Hard Drives & SSDs", icon: HardDrive, slug: "hard-drives" },
  { name: "Protein Powder", icon: Dumbbell, slug: "protein-powder" },
  { name: "Laundry Detergent", icon: Droplets, slug: "laundry-detergent" },
  { name: "Diapers", icon: Baby, slug: "diapers" },
  { name: "Batteries", icon: Battery, slug: "batteries" },
];

export function HomeContent({ country }: { country: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "realpricedata.com",
    url: "https://realpricedata.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://realpricedata.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <div className="flex flex-col gap-2 sm:gap-4 md:gap-8 pb-8 md:pb-16">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-2 sm:mb-8 md:mb-20" aria-labelledby="hero-heading">
        {/* Left side background */}
        <div className="absolute inset-0 bg-background z-0" aria-hidden="true" />
        {/* Right side background - MUI-inspired gradient */}
        <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-1/2 bg-blue-50 dark:bg-[#050810] border-l border-slate-200 dark:border-[hsl(210,14%,13%)] z-0 rounded-bl-xl" aria-hidden="true" />
        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-0 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-30" aria-hidden="true" />
        <div className="container relative z-10 px-4 mx-auto py-4 sm:py-8 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Content */}
            <div className="text-left">
              <Badge
                variant="outline"
                className="mb-6 px-4 py-1.5 text-sm border-border bg-muted/30 text-foreground hover:bg-muted/50 transition-colors shadow-sm w-fit"
              >
                <span className="font-mono text-xs mr-2">⚡️</span>
                Automated Price Analysis
              </Badge>
              <h1 id="hero-heading" className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm leading-[1.1]">
                <span className="text-primary">See the Real Value.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                Compare Amazon products in your region by their true cost per liter, kilogram, or item. Find the best deals instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="text-lg px-8 h-14 rounded-full shadow-lg shadow-blue-600/20 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white hover:brightness-110 transition-all group"
                  asChild
                >
                  <Link className="no-underline" href="#top-value-opportunities">
                    View Top Deals
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-8 border-t border-border/50 pt-8">
                <div>
                  <p className="text-3xl font-bold text-foreground">Thousands</p>
                  <p className="text-sm text-muted-foreground">
                    Products Tracked
                  </p>
                </div>
                <div className="h-10 w-px bg-border/50" />
                <div>
                  <p className="text-3xl font-bold text-foreground">24/7</p>
                  <p className="text-sm text-muted-foreground">
                    Price Monitoring
                  </p>
                </div>
              </div>
            </div>
            {/* Right Column: Interactive Demo */}
            <div className="relative">
              <Suspense fallback={<div className="w-full max-w-5xl mx-auto h-[400px] sm:h-[500px] bg-muted/20 rounded-lg animate-pulse" />}>
                <HeroTableDemo />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals - Top Value Opportunities */}
      <div className="scroll-mt-24" id="top-value-opportunities">
         <ClientFeaturedDeals country={country} />
      </div>

      {/* Categories */}
      <section className="container px-4 mx-auto py-4 sm:py-6 md:py-10" aria-labelledby="categories-heading">
        <div className="flex justify-between items-end mb-4 border-b border-border pb-2">
          <h2 id="categories-heading" className="text-lg font-bold tracking-tight flex items-center gap-2">
            Browse Categories
          </h2>
          <Link href={`/${country}/categories`} className="text-xs font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categories.map((category, idx) => (
              <Link
                key={category.slug}
                href={getCategoryPath(category.slug, country)}
                className="group flex items-center gap-3 p-3 rounded-md border border-border/50 bg-card/50 hover:bg-muted/50 hover:border-primary/30 transition-all no-underline"
                aria-label={`Browse ${category.name} category`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <category.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between">
                     <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{category.name}</span>
                     {idx === 0 && (
                       <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-0">
                         Hot
                       </Badge>
                     )}
                   </div>
                </div>
                <div className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Supported Countries */}
      <section className="container px-4 mx-auto py-8 sm:py-12 md:py-16" aria-labelledby="global-heading">
        <h2 id="global-heading" className="text-4xl font-bold mb-12 tracking-tight text-center">
          Global Availability
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Globe Container */}
          <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[2.5rem] border border-primary/20 dark:border-primary/10 bg-background/40 backdrop-blur-2xl px-4 py-20 shadow-2xl min-h-[500px] lg:h-[700px] group order-2 lg:order-2" aria-label="Interactive globe visualization">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />
            <Suspense fallback={<div className="w-full max-w-[500px] aspect-square mx-auto" />}>
              <ClientGlobe className="w-full max-w-[500px] aspect-square mx-auto z-10" />
            </Suspense>
            <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),rgba(255,255,255,0))]" aria-hidden="true" />
          </div>

          {/* Country Insights List */}
          <div className="space-y-4 order-1 lg:order-1">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label="Supported countries and regions">
              {getAllCountries().map((country) => (
                <li
                  key={country.name}
                  className="flex items-center p-3 rounded-xl border border-primary/20 bg-card shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-md cursor-default group hover:border-primary/40 transition-all"
                >
                  <span className="text-3xl mr-3 transition-all">
                    {country.flag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-sm text-foreground truncate pr-2">
                        {country.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200 border-blue-200 dark:border-blue-500/30 font-semibold"
                      >
                        {country.currency}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-mono">
                        {country.domain}
                      </p>
                      {country.isLive ? (
                        <div className="flex items-center text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span className="relative flex h-1.5 w-1.5 mr-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Live
                        </div>
                      ) : (
                        <div className="flex items-center text-[10px] text-muted-foreground font-semibold">
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 dark:border-primary/10 mt-6">
              <h3 className="text-lg font-bold mb-2">
                Real-time Global Tracking
              </h3>
              <p className="text-muted-foreground text-sm">
                We monitor prices worldwide to ensure you catch the latest price drops and currency fluctuations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeContent;
