"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Sparkles } from "lucide-react";

export function PriceComparison() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-3xl font-bold tracking-tight">
          Why Unit Pricing Matters
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Same products, different perspective. See the hidden value instantly.
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        <Card className="border-border overflow-hidden shadow-xl">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-border bg-muted/40 border-b">
                  <th className="p-4 text-left text-base font-semibold">
                    Product
                  </th>
                  <th className="p-4 text-right text-base font-semibold">
                    Total Price
                  </th>
                  <th className="p-4 text-right text-base font-semibold">
                    <div className="flex items-center justify-end gap-1.5">
                      <Sparkles className="text-primary h-4 w-4" />
                      <span className="text-primary">Price per TB</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Product 1 - Looks cheaper but isn't */}
                <tr className="border-border/50 hover:bg-muted/20 border-b transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">2TB SSD</p>
                      <p className="text-muted-foreground text-sm">Brand A</p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge
                        variant="secondary"
                        className="border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-500"
                      >
                        Lowest Price
                      </Badge>
                      <span className="text-lg font-bold">$179.99</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-muted-foreground font-mono text-lg">
                      $89.99
                    </span>
                  </td>
                </tr>

                {/* Product 2 - Actually better value */}
                <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">4TB SSD</p>
                      <p className="text-muted-foreground text-sm">Brand B</p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-lg font-bold">$299.99</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-primary font-mono text-lg font-bold">
                        $74.99
                      </span>
                      <Badge className="bg-primary text-primary-foreground border-0 text-sm">
                        <TrendingDown className="mr-1 h-3 w-3" />
                        Best Value
                      </Badge>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Insight Footer */}
          <div className="bg-primary/10 border-primary/20 border-t p-5">
            <p className="text-center text-base font-medium">
              <span className="text-primary font-bold">Save 17%</span> per TB by
              choosing the right product —
              <span className="text-muted-foreground">
                {" "}
                Real Price Data shows you this automatically
              </span>
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
