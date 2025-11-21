"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, ShoppingCart, Smartphone, Coffee, Home, Dog } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const categories = [
  { name: "Tech", icon: Smartphone, count: "12k+", slug: "tech" },
  { name: "Food", icon: Coffee, count: "8k+", slug: "food" },
  { name: "Household", icon: Home, count: "5k+", slug: "household" },
  { name: "Beauty", icon: ShoppingCart, count: "3k+", slug: "beauty" },
  { name: "Pets", icon: Dog, count: "2k+", slug: "pets" },
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
  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-muted/30 border-b">
        <div className="container px-4 mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            New: Historical Price Tracking
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Compare products by price per unit.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Stop overpaying. We track millions of products across major retailers to find you the absolute best value per unit.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/categories">
                Start Comparing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Stats */}
      <section className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Viewed Today</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">SSD Storage</div>
              <p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Biggest Price Drop</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-15%</div>
              <p className="text-xs text-muted-foreground">Protein Powder (5kg)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Tracked</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,345,678</div>
              <p className="text-xs text-muted-foreground">Across 11 countries</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories */}
      <section className="container px-4 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Explore Categories</h2>
          <Link href="/categories" className="text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`}>
              <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/10">
                <CardHeader>
                  <category.icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{category.count} items</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="container px-4 mx-auto">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">Data Driven Savings</h2>
              <p className="text-muted-foreground mb-6">
                Our algorithms analyze price history to predict the best time to buy. 
                Visualize trends and make informed decisions.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Real-time price updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Unit price calculation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Historical data analysis</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full h-[300px] bg-muted/20 rounded-lg p-4">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Countries */}
      <section className="container px-4 mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-8">Supported in 11 Countries</h2>
        <div className="flex flex-wrap justify-center gap-4 text-4xl grayscale hover:grayscale-0 transition-all duration-500">
          <span title="United States">🇺🇸</span>
          <span title="United Kingdom">🇬🇧</span>
          <span title="Canada">🇨🇦</span>
          <span title="Germany">🇩🇪</span>
          <span title="Spain">🇪🇸</span>
          <span title="Italy">🇮🇹</span>
          <span title="France">🇫🇷</span>
          <span title="Australia">🇦🇺</span>
          <span title="Sweden">🇸🇪</span>
          <span title="Ireland">🇮🇪</span>
          <span title="India">🇮🇳</span>
        </div>
      </section>
    </div>
  )
}
