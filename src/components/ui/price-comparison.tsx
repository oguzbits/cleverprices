"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, Sparkles } from "lucide-react"

export function PriceComparison() {
  return (
    <section className="container px-4 mx-auto py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-3">Why Unit Pricing Matters</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Same products, different perspective. See the hidden value instantly.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden border-border shadow-xl">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left p-4 font-semibold text-base">Product</th>
                  <th className="text-right p-4 font-semibold text-base">Total Price</th>
                  <th className="text-right p-4 font-semibold text-base">
                    <div className="flex items-center justify-end gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-primary">Price per TB</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Product 1 - Looks cheaper but isn't */}
                <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">2TB SSD</p>
                      <p className="text-sm text-muted-foreground">Brand A</p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-sm">
                        Lowest Price
                      </Badge>
                      <span className="text-lg font-bold">$179.99</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-lg font-mono text-muted-foreground">$89.99</span>
                  </td>
                </tr>

                {/* Product 2 - Actually better value */}
                <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">4TB SSD</p>
                      <p className="text-sm text-muted-foreground">Brand B</p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-lg font-bold">$299.99</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-lg font-mono font-bold text-primary">$74.99</span>
                      <Badge className="bg-primary text-primary-foreground border-0 text-sm">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Best Value
                      </Badge>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Insight Footer */}
          <div className="bg-primary/10 p-5 border-t border-primary/20">
            <p className="text-center text-base font-medium">
              <span className="text-primary font-bold">Save 17%</span> per TB by choosing the right product — 
              <span className="text-muted-foreground"> Real Price Data shows you this automatically</span>
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
