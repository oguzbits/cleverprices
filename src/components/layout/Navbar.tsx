"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Search } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { trackSEO } from "@/lib/analytics"
import { cn } from "@/lib/utils"

import dynamic from "next/dynamic"
import { CountrySelector } from "@/components/country-selector"

const SearchModal = dynamic(() => import("@/components/SearchModal").then(mod => mod.SearchModal), {
  ssr: true,
})

export function Navbar() {
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // Observe hero search wrapper to show/hide navbar search
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When hero search is NOT visible, show navbar search
        setShowSearch(!entry.isIntersecting)
      },
      {
        threshold: 0.5, // Trigger when 50% of search is out of view
        rootMargin: "0px",
      }
    )

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const heroSearchElement = document.querySelector('.search-with-animated-border')
      if (heroSearchElement) {
        observer.observe(heroSearchElement)
        // Check initial state
        setShowSearch(!heroSearchElement.getBoundingClientRect().top || heroSearchElement.getBoundingClientRect().top < 0)
      } else {
        // No hero element found - show navbar search by default
        setShowSearch(true)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      const heroSearchElement = document.querySelector('.search-with-animated-border')
      if (heroSearchElement) {
        observer.unobserve(heroSearchElement)
      }
    }
  }, [pathname]) // Re-run when route changes

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container px-4 flex h-16 items-center mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <Link 
            href="/" 
            className="flex items-center space-x-2 no-underline"
            title="Amazon Price Per Unit Tracker, Storage Deals & True Value"
            aria-label="Real Price Data Home - Amazon Price Per Unit Tracker"
          >
            <Image 
              src="/icon-192.png" 
              alt="Real Price Data Logo" 
              width={28} 
              height={28}
              className="w-7 h-7"
            />
            <h3 className="text-lg font-black tracking-tight">
              <span className="text-(--ccc-red)">real</span>
              <span className="text-(--ccc-orange)">price</span>
              <span className="text-(--ccc-yellow)">data</span>
            </h3>
          </Link>
        </div>

        {/* Center: Global Search Button - shows when hero is scrolled out */}
        <div className={`flex-1 flex justify-center px-4 ${showSearch ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-md border border-border bg-card hover:bg-card/80 hover:border-primary/50 cursor-pointer w-full max-w-[320px] lg:max-w-[400px] shadow-sm"
            aria-label="Search all products"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-base text-muted-foreground flex-1 text-left">Search all products...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-sm border rounded bg-background/80 text-muted-foreground font-medium">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Controls */}
        <TooltipProvider>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden cursor-pointer relative"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <div className="absolute inset-0 rounded-md bg-primary/10 blur-sm" />
                  <Search className="h-5 w-5 text-primary relative z-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Search products</p>
              </TooltipContent>
            </Tooltip>

            <CountrySelector />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => {
                    const newTheme = theme === "light" ? "dark" : "light"
                    setTheme(newTheme)
                    // Track theme change for SEO analytics
                    trackSEO.themeChanged(newTheme as 'light' | 'dark')
                  }}
                  aria-label={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Toggle theme"}
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          
          </div>
        </TooltipProvider>
      </div>

      {/* Search Modal */}
      {showSearch && <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />}
    </header>
  )
}
