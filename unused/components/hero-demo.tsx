"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Check, X, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function HeroDemo() {
  const [showTruePrice, setShowTruePrice] = useState(false)

  return (
    <div className="relative w-full max-w-lg mx-auto perspective-1000">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 rounded-full blur-[100px] -z-10" />

      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-primary/10">
        <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <span className="text-xs font-medium text-muted-foreground ml-2">Price Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium transition-colors", showTruePrice ? "text-muted-foreground" : "text-primary")}>
              Standard View
            </span>
            <Switch 
              checked={showTruePrice} 
              onCheckedChange={setShowTruePrice}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn("text-xs font-medium transition-colors", showTruePrice ? "text-primary" : "text-muted-foreground")}>
              True Price
            </span>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Option A: The "Cheaper" Trap */}
          <div className={cn(
            "relative group rounded-xl border p-4 transition-all duration-500",
            showTruePrice 
              ? "bg-red-500/5 border-red-500/20 opacity-60" 
              : "bg-background border-primary/20 shadow-lg shadow-primary/5 scale-[1.02]"
          )}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">2TB SSD Storage</h3>
                  {showTruePrice ? (
                    <Badge variant="outline" className="h-5 px-1.5 bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">
                      Bad Value
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="h-5 px-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                      Lowest Price
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Standard Brand • 2 Year Warranty</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">$179.99</p>
              </div>
            </div>
            
            <div className={cn(
              "overflow-hidden transition-all duration-500",
              showTruePrice ? "max-h-20 opacity-100 mt-3 pt-3 border-t border-red-500/10" : "max-h-0 opacity-0"
            )}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Real Cost:</span>
                <span className="font-mono font-bold text-red-500">$90.00 / TB</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-red-500/80">
                <AlertCircle className="w-3 h-3" />
                <span>20% more expensive per unit</span>
              </div>
            </div>
          </div>

          {/* Option B: The Real Deal */}
          <div className={cn(
            "relative group rounded-xl border p-4 transition-all duration-500",
            showTruePrice 
              ? "bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/10 scale-[1.02]" 
              : "bg-muted/30 border-transparent opacity-80"
          )}>
             {showTruePrice && (
              <div className="absolute -top-3 -right-2">
                <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 shadow-lg animate-in zoom-in duration-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Best Value
                </Badge>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">4TB SSD Storage</h3>
                </div>
                <p className="text-xs text-muted-foreground">Pro Series • 5 Year Warranty</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">$299.99</p>
              </div>
            </div>

            <div className={cn(
              "overflow-hidden transition-all duration-500",
              showTruePrice ? "max-h-20 opacity-100 mt-3 pt-3 border-t border-emerald-500/10" : "max-h-0 opacity-0"
            )}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Real Cost:</span>
                <span className="font-mono font-bold text-emerald-500">$75.00 / TB</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-500/80">
                <Check className="w-3 h-3" />
                <span>You save $60.00 total value</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Floating Elements for Depth */}
      <div className={cn(
        "absolute -right-8 top-20 bg-background/80 backdrop-blur-md p-3 rounded-lg border border-border shadow-xl transition-all duration-700 delay-100",
        showTruePrice ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      )}>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
          <TrendingUp className="w-4 h-4" />
          <span>Savings Detected!</span>
        </div>
      </div>
    </div>
  )
}
