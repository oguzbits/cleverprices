"use client"

import { useState, useEffect } from "react"
import { Cookie, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowBanner(false)
    // Enable Amazon affiliate cookies/tracking
    if (typeof window !== 'undefined') {
      // You can set a flag here that your Amazon affiliate links can check
      (window as any).cookieConsent = 'accepted'
    }
  }

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined")
    setShowBanner(false)
    // Block Amazon affiliate cookies/tracking
    if (typeof window !== 'undefined') {
      // Set flag to indicate cookies were declined
      (window as any).cookieConsent = 'declined'
      // You should NOT set Amazon affiliate cookies or tracking parameters
      // Remove any existing affiliate tracking if present
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-500">
      <div className="relative bg-card/95 backdrop-blur-xl border border-primary/20 rounded-lg shadow-xl overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <Cookie className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">
              Help Keep This Site Free
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We earn small commissions from Amazon to keep this service free
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label={isExpanded ? "Show less" : "Show more"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="px-4 pb-3 text-xs space-y-3 border-t border-border/50 pt-3 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-muted/50 rounded p-2">
              <p className="text-foreground font-medium mb-1">💡 How it works:</p>
              <p className="text-muted-foreground">
                When you buy through our links, Amazon pays us 1-4% commission. 
                Your price stays the same. This keeps us free and ad-free.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-foreground mb-1">✓ What you get:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>• Free price comparison forever</li>
                <li>• No ads or paywalls</li>
                <li>• Independent recommendations</li>
              </ul>
            </div>

            <div className="pt-1 space-y-1.5 text-muted-foreground">
              <p>
                <strong className="text-foreground">DE:</strong> Amazon-Partnerlinks zur Verkaufsverfolgung.
              </p>
              <p>
                <strong className="text-foreground">EN:</strong> Amazon affiliate tracking cookies.
              </p>
            </div>
            
            <Link 
              href="/datenschutz" 
              className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              Privacy Policy →
            </Link>
          </div>
        )}

        {/* Action Buttons - Equal prominence for GDPR compliance */}
        <div className="flex gap-2 p-4 pt-0">
          <Button 
            onClick={acceptCookies}
            size="sm"
            className="flex-1 h-8 text-xs font-semibold"
          >
            ✓ Accept & Support Us
          </Button>
          <Button 
            onClick={declineCookies}
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}
