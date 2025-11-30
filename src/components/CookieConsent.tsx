"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

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
    // Enable Amazon affiliate cookies here if needed
  }

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined")
    setShowBanner(false)
    // Block Amazon affiliate cookies
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto max-w-6xl">
        <div className="relative bg-card/95 backdrop-blur-xl border border-primary/20 rounded-lg shadow-2xl p-6 md:p-8">
          <button
            type="button"
            onClick={declineCookies}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid md:grid-cols-[1fr,auto] gap-6 items-center pr-8">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Cookie-Einstellungen / Cookie Settings</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">DE:</strong> Wir verwenden Cookies für Amazon-Partnerlinks. 
                  Diese sind notwendig, um Verkäufe zu verfolgen, die über unsere Links getätigt werden.
                </p>
                <p>
                  <strong className="text-foreground">EN:</strong> We use cookies for Amazon affiliate links. 
                  These are necessary to track purchases made through our links.
                </p>
                <p className="text-xs">
                  Mehr Informationen / More Information: {" "}
                  <Link href="/datenschutz" className="text-primary hover:underline">
                    Datenschutz / Privacy
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:flex-col">
              <Button 
                onClick={acceptCookies}
                className="whitespace-nowrap"
              >
                Akzeptieren / Accept
              </Button>
              <Button 
                onClick={declineCookies}
                variant="outline"
                className="whitespace-nowrap"
              >
                Ablehnen / Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
