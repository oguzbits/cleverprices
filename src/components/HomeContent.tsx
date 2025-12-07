import { Suspense } from "react";
import Script from "next/script";
import { Badge } from "@/components/ui/badge";
import { ClientGlobe } from "@/components/client/ClientGlobe";
import { getAllCountries } from "@/lib/countries";
import { HeroSearch } from "@/components/hero-search";
import { HeroCategoryPills } from "@/components/hero-category-pills";
import { HeroDealCards } from "@/components/hero-deal-cards";
import { ComparisonDemoSection } from "@/components/comparison-demo-section";

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
      <section id="hero-section" className="relative overflow-hidden mb-2 sm:mb-8 md:mb-20" aria-labelledby="hero-heading">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-background z-0" aria-hidden="true" />
        <div className="absolute top-0 left-0 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-30" aria-hidden="true" />
        
        <div className="container relative z-10 px-4 mx-auto py-8 sm:py-12 md:py-20">
          <div className="max-w-5xl mx-auto">
            {/* Header Badge */}
            <div className="text-left sm:text-center mb-6">
              <Badge
                variant="outline"
                className="mb-6 px-4 py-1.5 text-sm border-border bg-muted/30 text-foreground hover:bg-muted/50 transition-colors shadow-sm"
              >
                <span className="font-mono text-xs mr-2">⚡️</span>
                Automated Price Analysis
              </Badge>
            </div>

            {/* Main Heading */}
            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 text-left sm:text-center leading-[1.1]">
              <span className="text-primary">Find the Best Amazon Prices,</span>
              <br />
              <span className="text-foreground">Instantly</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground text-left sm:text-center max-w-2xl sm:mx-auto mb-8 leading-relaxed">
              Compare products by their true cost per unit and never overpay again
            </p>

            {/* Hero Search */}
            <div className="max-w-2xl mx-auto mb-6">
              <HeroSearch />
            </div>

            {/* Category Pills */}
            <div className="max-w-2xl mx-auto mb-10">
              <HeroCategoryPills />
            </div>

            {/* Featured Deal Cards */}
            <div className="mb-10">
              <HeroDealCards />
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-start sm:justify-center gap-8 sm:gap-12 border-t border-border/50 pt-8 max-w-2xl sm:mx-auto">
              <div className="text-left sm:text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">Thousands</p>
                <p className="text-sm text-muted-foreground">Products Tracked</p>
              </div>
              <div className="h-10 w-px bg-border/50" />
              <div className="text-left sm:text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">5+</p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </div>
              <div className="h-10 w-px bg-border/50" />
              <div className="text-left sm:text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">24/7</p>
                <p className="text-sm text-muted-foreground">Price Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Demo Section */}
      <ComparisonDemoSection />





      {/* Supported Countries */}
      <section className="container px-4 mx-auto py-8 sm:py-12 md:py-16" aria-labelledby="global-heading">
        <h2 id="global-heading" className="text-4xl font-bold mb-12 tracking-tight text-left sm:text-center">
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
              <h3 className="text-lg font-bold mb-2 text-left">
                Real-time Global Tracking
              </h3>
              <p className="text-muted-foreground text-sm text-left">
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
