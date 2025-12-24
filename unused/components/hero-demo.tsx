"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, TrendingUp } from "lucide-react";
import { useState } from "react";

export function HeroDemo() {
  const [showTruePrice, setShowTruePrice] = useState(false);

  return (
    <div className="perspective-1000 relative mx-auto w-full max-w-lg">
      {/* Background Glow */}
      <div className="bg-primary/20 absolute top-1/2 left-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />

      <Card className="border-border/50 bg-background/60 hover:shadow-primary/10 overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-500">
        <div className="border-border/50 bg-muted/30 flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20" />
              <div className="h-3 w-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
              <div className="h-3 w-3 rounded-full border border-green-500/50 bg-green-500/20" />
            </div>
            <span className="text-muted-foreground ml-2 text-xs font-medium">
              Price Analysis
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                showTruePrice ? "text-muted-foreground" : "text-primary",
              )}
            >
              Standard View
            </span>
            <Switch
              checked={showTruePrice}
              onCheckedChange={setShowTruePrice}
              className="data-[state=checked]:bg-primary"
            />
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                showTruePrice ? "text-primary" : "text-muted-foreground",
              )}
            >
              True Price
            </span>
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          {/* Option A: The "Cheaper" Trap */}
          <div
            className={cn(
              "group relative rounded-xl border p-4 transition-all duration-500",
              showTruePrice
                ? "border-red-500/20 bg-red-500/5 opacity-60"
                : "bg-background border-primary/20 shadow-primary/5 scale-[1.02] shadow-lg",
            )}
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold">2TB SSD Storage</h3>
                  {showTruePrice ? (
                    <Badge
                      variant="outline"
                      className="h-5 border-red-500/20 bg-red-500/10 px-1.5 text-[10px] text-red-500"
                    >
                      Bad Value
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="h-5 border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-500"
                    >
                      Lowest Price
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Standard Brand • 2 Year Warranty
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">$179.99</p>
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-500",
                showTruePrice
                  ? "mt-3 max-h-20 border-t border-red-500/10 pt-3 opacity-100"
                  : "max-h-0 opacity-0",
              )}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Real Cost:</span>
                <span className="font-mono font-bold text-red-500">
                  $90.00 / TB
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-red-500/80">
                <AlertCircle className="h-3 w-3" />
                <span>20% more expensive per unit</span>
              </div>
            </div>
          </div>

          {/* Option B: The Real Deal */}
          <div
            className={cn(
              "group relative rounded-xl border p-4 transition-all duration-500",
              showTruePrice
                ? "scale-[1.02] border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                : "bg-muted/30 border-transparent opacity-80",
            )}
          >
            {showTruePrice && (
              <div className="absolute -top-3 -right-2">
                <Badge className="animate-in zoom-in border-0 bg-emerald-500 shadow-lg duration-300 hover:bg-emerald-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Best Value
                </Badge>
              </div>
            )}

            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold">4TB SSD Storage</h3>
                </div>
                <p className="text-muted-foreground text-xs">
                  Pro Series • 5 Year Warranty
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">$299.99</p>
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-500",
                showTruePrice
                  ? "mt-3 max-h-20 border-t border-emerald-500/10 pt-3 opacity-100"
                  : "max-h-0 opacity-0",
              )}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Real Cost:</span>
                <span className="font-mono font-bold text-emerald-500">
                  $75.00 / TB
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-500/80">
                <Check className="h-3 w-3" />
                <span>You save $60.00 total value</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Elements for Depth */}
      <div
        className={cn(
          "bg-background/80 border-border absolute top-20 -right-8 rounded-lg border p-3 shadow-xl backdrop-blur-md transition-all delay-100 duration-700",
          showTruePrice
            ? "translate-x-0 opacity-100"
            : "translate-x-4 opacity-0",
        )}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
          <TrendingUp className="h-4 w-4" />
          <span>Savings Detected!</span>
        </div>
      </div>
    </div>
  );
}
