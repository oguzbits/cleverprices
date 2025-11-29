import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  TrendingUp,
  Smartphone,
  HardDrive,
  Dumbbell,
  Droplets,
  Baby,
  Battery,
  Globe,
} from "lucide-react";

// Client components wrapped in Suspense for progressive loading
import { ClientGlobe } from "@/components/client/ClientGlobe";
import { ClientFeaturedDeals } from "@/components/client/ClientFeaturedDeals";

const HeroTableDemo = dynamic(
  () => import("@/components/hero-table-demo").then((mod) => ({ default: mod.HeroTableDemo })),
  { 
    ssr: true,
  }
);

const categories = [
  {
    name: "Hard Drives & SSDs",
    icon: HardDrive,
    count: "2000+",
    slug: "storage",
  },
  {
    name: "Protein Powder",
    icon: Dumbbell,
    count: "500+",
    slug: "protein-powder",
  },
  {
    name: "Laundry Detergent",
    icon: Droplets,
    count: "150+",
    slug: "laundry-detergent",
  },
  { name: "Diapers", icon: Baby, count: "200+", slug: "diapers" },
  { name: "Batteries", icon: Battery, count: "300+", slug: "batteries" },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "bestprices.today",
    url: "https://bestprices.today",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://bestprices.today/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="flex flex-col gap-12 pb-12">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Left side background */}
        <div className="absolute inset-0 bg-background z-0" />

        {/* Right side background - MUI-inspired gradient */}
        <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-1/2 bg-blue-50 dark:bg-[#050810] border-l border-slate-200 dark:border-[hsl(210,14%,13%)] z-0 rounded-bl-xl" />

        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-0 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-30" />

        <div className="container relative z-10 px-4 mx-auto py-16 md:py-24">
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

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm leading-[1.1]">
                <span className="text-primary">See the Real Value.</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                Compare Amazon products in your region by their true cost per
                liter, kilogram, or item. Find the best deals instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                {/* Temporarily disabled for TBT testing - Button component */}
                {/* <Button
                  size="lg"
                  className="text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/20 hover:brightness-110 transition-all group"
                  asChild
                >
                  <Link className="no-underline" href="/categories">
                    Start Saving Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button> */}
                <Link 
                  href="/categories"
                  className="inline-flex items-center justify-center text-lg px-8 h-14 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Start Saving Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>

              <div className="flex items-center gap-8 border-t border-border/50 pt-8">
                <div>
                  <p className="text-3xl font-bold text-foreground">2M+</p>
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
              <Suspense fallback={<div className="w-full max-w-5xl mx-auto h-[400px] bg-muted/20 rounded-lg animate-pulse" />}>
                <HeroTableDemo />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Stats */}
      {/* Temporarily disabled for TBT testing - Card components */}
      {/* <section className="container px-4 mx-auto mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>...</Card>
        </div>
      </section> */}
      <section className="container px-4 mx-auto mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Most Viewed Today</p>
            <p className="text-3xl font-bold">SSD Storage</p>
          </div>
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Smart Analysis</p>
            <p className="text-3xl font-bold">True Value</p>
          </div>
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Global Coverage</p>
            <p className="text-3xl font-bold">Worldwide</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">Card Components (Temporarily Disabled for Testing)</p>
      </section>

      {/* Featured Deals Carousel */}
      {/* Temporarily disabled for TBT testing */}
      {/* <Suspense fallback={<div className="container px-4 mx-auto py-12 h-64" />}>
        <ClientFeaturedDeals />
      </Suspense> */}
      <div className="container px-4 mx-auto py-12 h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Featured Deals (Temporarily Disabled for Testing)</p>
      </div>

      {/* Categories */}
      <section className="container px-4 mx-auto py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Explore Categories
            </h2>
            <p className="text-muted-foreground">
              Find the best deals across our most popular categories.
            </p>
          </div>
          {/* Temporarily disabled for TBT testing - Button component */}
          {/* <Button
            variant="ghost"
            className="text-primary hover:text-primary/80"
            asChild
          >
            <Link href="/categories">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button> */}
          <Link href="/categories" className="text-primary hover:text-primary/80 text-sm">
            View all <ArrowRight className="ml-2 h-4 w-4 inline" />
          </Link>
        </div>
        {/* Temporarily disabled for TBT testing - Card components */}
        <div className="flex flex-wrap justify-center gap-6">
          {categories.map((category, idx) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="w-full sm:w-64 no-underline"
            >
              <div className="relative h-full p-6 border rounded-lg hover:border-primary/30 transition-all cursor-pointer">
                {idx === 0 && (
                  <div className="absolute -top-2 -right-2 z-10 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                    🔥 Hot
                  </div>
                )}
                <div className="text-center">
                  <div className="mx-auto bg-primary/5 p-4 rounded-2xl mb-4 w-fit">
                    <category.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} items</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">Card Components (Temporarily Disabled for Testing)</p>
      </section>

      {/* Supported Countries */}
      <section className="container px-4 mx-auto py-24">
        <h2 className="text-4xl font-bold mb-12 tracking-tight text-center">
          Global Availability
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Globe Container */}
          <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[2.5rem] border border-primary/20 dark:border-primary/10 bg-background/40 backdrop-blur-2xl px-4 py-20 shadow-2xl min-h-[500px] lg:h-[700px] group order-2 lg:order-2">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            {/* Temporarily disabled for TBT testing */}
            {/* <Suspense fallback={<div className="w-full max-w-[500px] aspect-square mx-auto" />}>
              <ClientGlobe className="w-full max-w-[500px] aspect-square mx-auto z-10" />
            </Suspense> */}
            <div className="w-full max-w-[500px] aspect-square mx-auto flex items-center justify-center">
              <p className="text-muted-foreground">Globe (Temporarily Disabled for Testing)</p>
            </div>
            <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),rgba(255,255,255,0))]" />
          </div>

          {/* Country Insights List */}
          <div className="space-y-4 order-1 lg:order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  name: "United States",
                  flag: "🇺🇸",
                  domain: "amazon.com",
                  currency: "USD",
                },
                {
                  name: "United Kingdom",
                  flag: "🇬🇧",
                  domain: "amazon.co.uk",
                  currency: "GBP",
                },
                {
                  name: "Canada",
                  flag: "🇨🇦",
                  domain: "amazon.ca",
                  currency: "CAD",
                },
                {
                  name: "Germany",
                  flag: "🇩🇪",
                  domain: "amazon.de",
                  currency: "EUR",
                },
                {
                  name: "Spain",
                  flag: "🇪🇸",
                  domain: "amazon.es",
                  currency: "EUR",
                },
                {
                  name: "Italy",
                  flag: "🇮🇹",
                  domain: "amazon.it",
                  currency: "EUR",
                },
                {
                  name: "France",
                  flag: "🇫🇷",
                  domain: "amazon.fr",
                  currency: "EUR",
                },
                {
                  name: "Australia",
                  flag: "🇦🇺",
                  domain: "amazon.com.au",
                  currency: "AUD",
                },
                {
                  name: "Sweden",
                  flag: "🇸🇪",
                  domain: "amazon.se",
                  currency: "SEK",
                },
                {
                  name: "Ireland",
                  flag: "🇮🇪",
                  domain: "amazon.co.uk",
                  currency: "GBP",
                },
                {
                  name: "India",
                  flag: "🇮🇳",
                  domain: "amazon.in",
                  currency: "INR",
                },
              ].map((country) => (
                <div
                  key={country.name}
                  className="flex items-center p-3 rounded-xl border border-primary/20 dark:border-primary/10 bg-background/40 backdrop-blur-md cursor-default group"
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
                        className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20"
                      >
                        {country.currency}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-mono">
                        {country.domain}
                      </p>
                      <div className="flex items-center text-[10px] text-emerald-500 font-medium">
                        <span className="relative flex h-1.5 w-1.5 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Live
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 dark:border-primary/10 mt-6">
              <h3 className="text-lg font-bold mb-2">
                Real-time Global Tracking
              </h3>
              <p className="text-muted-foreground text-sm">
                We monitor prices worldwide to ensure you catch the latest price
                drops and currency fluctuations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
