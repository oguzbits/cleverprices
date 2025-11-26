"use client";

import Link from "next/link";
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
  ShoppingCart,
  Smartphone,
  HardDrive,
  Dumbbell,
  Droplets,
  Baby,
  Battery,
  Globe,
  CheckCircle2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Rectangle,
} from "recharts";
import { Globe as InteractiveGlobe } from "@/components/ui/globe";
import { FeaturedDeals } from "@/components/ui/featured-deals";
import { HeroTableDemo } from "@/components/hero-table-demo";

import { AnimatedCounter } from "@/components/ui/animated-counter";

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

const data = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 550 },
  { name: "Thu", value: 450 },
  { name: "Fri", value: 600 },
  { name: "Sat", value: 700 },
  { name: "Sun", value: 800 },
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
      <script
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
                Advanced Unit Price Analysis Engine
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm leading-[1.1]">
                <span className="text-primary">Shop by Unit Price.</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                We reveal the true cost per liter, kilogram, or item. Spot the
                hidden deals in your region.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/20 hover:brightness-110 transition-all group"
                  asChild
                >
                  <Link href="/categories">
                    Start Saving Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
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
              <HeroTableDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Stats */}
      <section className="container px-4 mx-auto mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card dark:bg-card backdrop-blur-xl border-border shadow-lg hover:shadow-xl hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Most Viewed Today
              </CardTitle>
              <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                SSD Storage
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from yesterday
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card dark:bg-card backdrop-blur-xl border-border shadow-lg hover:shadow-xl hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Smart Analysis
              </CardTitle>
              <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors">
                <span className="text-sm font-mono text-muted-foreground">
                  $
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                True Value
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Automatic price-per-unit calculation
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card dark:bg-card backdrop-blur-xl border-border shadow-lg hover:shadow-xl hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Global Coverage
              </CardTitle>
              <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                Worldwide
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unified search across borders
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Deals Carousel */}
      <FeaturedDeals />

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
          <Button
            variant="ghost"
            className="text-primary hover:text-primary/80"
            asChild
          >
            <Link href="/categories">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {categories.map((category, idx) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="w-full sm:w-64"
            >
              <Card className="relative h-full bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all duration-300 cursor-pointer border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 group">
                {idx === 0 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-primary border-0 shadow-lg">
                      🔥 Hot
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/5 p-4 rounded-2xl mb-4 group-hover:bg-primary/10 transition-all duration-300">
                    <category.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.count} items</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
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
            <InteractiveGlobe className="w-full max-w-[500px] aspect-square mx-auto z-10" />
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
