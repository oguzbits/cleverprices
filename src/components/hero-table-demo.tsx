"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Search, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type Product = {
  id: string
  name: string
  price: number
  capacity: number
  capacityUnit: string
  pricePerTB: number
  warranty: string
  formFactor: string
  technology: string
  condition: "New" | "Used" | "Renewed"
  brand: string
}

const products: Product[] = [
  {
    id: "1",
    name: "Seagate Exos X18 18TB",
    price: 202.13,
    capacity: 18.0,
    capacityUnit: "TB",
    pricePerTB: 11.229,
    warranty: "2 years",
    formFactor: "External 2.5\"",
    technology: "HDD",
    condition: "Used",
    brand: "Seagate"
  },
  {
    id: "2",
    name: "Toshiba MG09 18TB",
    price: 215.50,
    capacity: 18.0,
    capacityUnit: "TB",
    pricePerTB: 11.972,
    warranty: "5 years",
    formFactor: "Internal 3.5\"",
    technology: "HDD",
    condition: "New",
    brand: "Toshiba"
  },
  {
    id: "3",
    name: "WD Red Pro 14TB",
    price: 239.99,
    capacity: 14.0,
    capacityUnit: "TB",
    pricePerTB: 17.142,
    warranty: "5 years",
    formFactor: "Internal 3.5\"",
    technology: "HDD",
    condition: "New",
    brand: "Western Digital"
  },
  {
    id: "4",
    name: "Samsung 870 QVO 8TB",
    price: 349.00,
    capacity: 8.0,
    capacityUnit: "TB",
    pricePerTB: 43.625,
    warranty: "3 years",
    formFactor: "Internal 2.5\"",
    technology: "SSD",
    condition: "New",
    brand: "Samsung"
  },
  {
    id: "5",
    name: "Crucial MX500 4TB",
    price: 179.99,
    capacity: 4.0,
    capacityUnit: "TB",
    pricePerTB: 44.997,
    warranty: "5 years",
    formFactor: "Internal 2.5\"",
    technology: "SSD",
    condition: "New",
    brand: "Crucial"
  }
].sort((a, b) => a.pricePerTB - b.pricePerTB) // Pre-sorted by unit price

export function HeroTableDemo() {
  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1000">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary/10 rounded-full blur-[120px] -z-10" />

      <Card className="border-border/50 bg-card shadow-2xl overflow-hidden ring-1 ring-border">
        {/* Top Bar (Browser/App Header) */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1">
              <Search className="w-3 h-3 shrink-0" />
              <span className="truncate">bestprices.today/categories/storage</span>
            </div>
          </div>
          
          {/* Value Proposition Badge */}
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] animate-pulse shrink-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Sorted by Unit Price
          </Badge>
        </div>

        <div className="flex h-[400px]">
          {/* Sidebar */}
          <div className="w-32 sm:w-48 border-r border-border bg-muted/20 p-2 sm:p-4 hidden sm:block">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3">Filters</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[3px] bg-primary" />
                    <span className="text-[11px] text-muted-foreground">Condition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[3px] border border-border" />
                    <span className="text-[11px] text-muted-foreground">Capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[3px] border border-border" />
                    <span className="text-[11px] text-muted-foreground">Technology</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3">Condition</h3>
                <div className="space-y-2">
                  {["New", "Used", "Renewed"].map((c) => (
                    <div key={c} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-[3px] bg-primary/80" />
                      <span className="text-[11px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/40">
            {/* Page Header */}
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Disk Price Comparison</h2>
                <span className="text-[10px] text-muted-foreground">· 100 disks</span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full min-w-[600px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[10px] font-semibold text-muted-foreground bg-muted/50">
                  <div className="col-span-2 flex items-center gap-1 text-primary">
                    <TrendingUp className="w-3 h-3" />
                    Price/TB
                  </div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Capacity</div>
                  <div className="col-span-2">Warranty</div>
                  <div className="col-span-1">Tech</div>
                  <div className="col-span-1">Cond.</div>
                  <div className="col-span-2">Link</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {products.map((product, idx) => (
                    <div 
                      key={product.id}
                      className={cn(
                        "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-[11px] transition-colors hover:bg-muted/50",
                        idx === 0 && "bg-primary/10 ring-1 ring-primary/20"
                      )}
                    >
                      <div className="col-span-2 font-mono font-medium text-primary flex items-center gap-2">
                        ${product.pricePerTB?.toFixed(3) || "0.000"}
                        {idx === 0 && (
                          <Badge className="bg-emerald-500 text-white border-0 h-4 px-1 text-[8px] animate-in zoom-in">
                            Best
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2 font-medium text-foreground">
                        ${product.price?.toFixed(2) || "0.00"}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {product.capacity} {product.capacityUnit}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {product.warranty}
                      </div>
                      <div className="col-span-1 text-muted-foreground">
                        {product.technology}
                      </div>
                      <div className="col-span-1">
                        <Badge variant="secondary" className={cn(
                          "h-4 px-1 text-[9px] border-0",
                          product.condition === "New" ? "bg-purple-500/20 text-purple-400" : 
                          product.condition === "Used" ? "bg-orange-500/20 text-orange-400" :
                          "bg-blue-500/20 text-blue-400"
                        )}>
                          {product.condition}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <span className="text-blue-400 hover:underline cursor-pointer truncate block">
                          {product.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Floating Insight - Always visible */}
      <div className="absolute -right-6 top-1/3 bg-background/90 backdrop-blur-md p-3 rounded-xl border border-primary/30 shadow-xl max-w-[180px] animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-primary/10 rounded-full shrink-0">
            <Check className="w-3 h-3 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-primary mb-0.5">Hidden Value Found</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              The 18TB drive is 4x cheaper per TB than the 8TB SSD!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
