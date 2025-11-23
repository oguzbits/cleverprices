"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, ShoppingCart, Smartphone, HardDrive, Cpu, Usb, Server } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Rectangle } from "recharts"
import { Globe } from "@/components/ui/globe"

const categories = [
  { name: "External HDD", icon: HardDrive, count: "500+", slug: "external-hdd" },
  { name: "Internal SSD", icon: Cpu, count: "800+", slug: "internal-ssd" },
  { name: "MicroSD", icon: Smartphone, count: "300+", slug: "microsd" },
  { name: "USB Drives", icon: Usb, count: "400+", slug: "usb-drive" },
  { name: "NAS", icon: Server, count: "100+", slug: "nas" },
]

const data = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 550 },
  { name: "Thu", value: 450 },
  { name: "Fri", value: 600 },
  { name: "Sat", value: 700 },
  { name: "Sun", value: 800 },
]

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'bestprices.today',
    url: 'https://bestprices.today',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://bestprices.today/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div className="flex flex-col gap-12 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-background z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50" />
        
        <div className="container relative z-10 px-4 mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            New: Historical Price Tracking
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground to-foreground/70 drop-shadow-sm">
            Compare products by <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-600">price per unit.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop overpaying. We track millions of products across major retailers to find you the absolute best value per unit.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" asChild>
              <Link href="/categories">
                Start Comparing <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full border-primary/20 hover:bg-primary/5 transition-all">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Stats */}
      <section className="container px-4 mx-auto -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-background/60 dark:bg-background/60 backdrop-blur-xl border-primary/20 dark:border-primary/10 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Viewed Today</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">SSD Storage</div>
              <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from yesterday
              </p>
            </CardContent>
          </Card>
          <Card className="bg-background/60 dark:bg-background/60 backdrop-blur-xl border-primary/20 dark:border-primary/10 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Biggest Price Drop</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">-15%</div>
              <p className="text-xs text-muted-foreground mt-1">Protein Powder (5kg)</p>
            </CardContent>
          </Card>
          <Card className="bg-background/60 dark:bg-background/60 backdrop-blur-xl border-primary/20 dark:border-primary/10 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Items Tracked</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">12,345,678</div>
              <p className="text-xs text-muted-foreground mt-1">Across 11 countries</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories */}
      <section className="container px-4 mx-auto py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Explore Categories</h2>
            <p className="text-muted-foreground">Find the best deals across our most popular categories.</p>
          </div>
          <Button variant="ghost" className="text-primary hover:text-primary/80" asChild>
            <Link href="/categories">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`}>
              <Card className="h-full bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all cursor-pointer border-primary/10 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 group">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/5 p-4 rounded-2xl mb-4 group-hover:bg-primary/10 transition-colors">
                    <category.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mb-1">{category.name}</CardTitle>
                  <CardDescription>{category.count} items</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="container px-4 mx-auto py-12">
        <div className="rounded-2xl border border-primary/20 dark:border-primary/10 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
          <div className="p-8 flex flex-col md:flex-row gap-12 items-center relative z-10">
            <div className="flex-1 space-y-6">
              <div>
                <Badge variant="outline" className="mb-4 border-primary/20 text-primary">Analytics</Badge>
                <h2 className="text-3xl font-bold mb-4">Data Driven Savings</h2>
                <p className="text-muted-foreground text-lg">
                  Our algorithms analyze price history to predict the best time to buy. 
                  Visualize trends and make informed decisions.
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-primary/5">
                  <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  <span className="font-medium">Real-time price updates</span>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-primary/5">
                  <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  <span className="font-medium">Unit price calculation</span>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-primary/5">
                  <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  <span className="font-medium">Historical data analysis</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full h-[400px] bg-linear-to-b from-background/50 to-background/20 rounded-xl p-6 border border-primary/10 shadow-inner">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorValueHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                            <p className="text-lg font-bold text-foreground">
                              ${payload[0].value}
                              <span className="ml-1 text-xs font-normal text-muted-foreground">/ unit</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#colorValue)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                    activeBar={<Rectangle fill="url(#colorValueHover)" stroke="none" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Countries */}
      <section className="container px-4 mx-auto py-24">
        <h2 className="text-4xl font-bold mb-12 tracking-tight text-center">Supported in 11 Countries</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Globe Container */}
          <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[2.5rem] border border-primary/20 dark:border-primary/10 bg-background/40 backdrop-blur-2xl px-4 py-20 shadow-2xl min-h-[500px] lg:h-[700px] group order-2 lg:order-2">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            <Globe className="w-full max-w-[600px] aspect-square mx-auto z-10" />
            <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),rgba(255,255,255,0))]" />
          </div>

          {/* Country Insights List */}
          <div className="space-y-4 order-1 lg:order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "United States", flag: "🇺🇸", domain: "amazon.com", currency: "USD" },
                { name: "United Kingdom", flag: "🇬🇧", domain: "amazon.co.uk", currency: "GBP" },
                { name: "Canada", flag: "🇨🇦", domain: "amazon.ca", currency: "CAD" },
                { name: "Germany", flag: "🇩🇪", domain: "amazon.de", currency: "EUR" },
                { name: "Spain", flag: "🇪🇸", domain: "amazon.es", currency: "EUR" },
                { name: "Italy", flag: "🇮🇹", domain: "amazon.it", currency: "EUR" },
                { name: "France", flag: "🇫🇷", domain: "amazon.fr", currency: "EUR" },
                { name: "Australia", flag: "🇦🇺", domain: "amazon.com.au", currency: "AUD" },
                { name: "Sweden", flag: "🇸🇪", domain: "amazon.se", currency: "SEK" },
                { name: "Ireland", flag: "🇮🇪", domain: "amazon.co.uk", currency: "GBP" },
                { name: "India", flag: "🇮🇳", domain: "amazon.in", currency: "INR" },
              ].map((country) => (
                <div key={country.name} className="flex items-center p-3 rounded-xl border border-primary/20 dark:border-primary/10 bg-background/40 backdrop-blur-md cursor-default group">
                  <span className="text-3xl mr-3 transition-all">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-sm text-foreground truncate pr-2">{country.name}</h3>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20">
                        {country.currency}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-mono">{country.domain}</p>
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
            <div className="p-6 rounded-2xl bg-linear-to-r from-primary/10 to-purple-500/10 border border-primary/20 dark:border-primary/10 mt-6">
              <h3 className="text-lg font-bold mb-2">Real-time Global Tracking</h3>
              <p className="text-muted-foreground text-sm">
                We monitor prices across 11 Amazon marketplaces to ensure you catch the latest price drops and currency fluctuations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
