"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Search } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { trackSEO } from "@/lib/analytics"

// Lazy load SearchModal - only needed when user clicks search
const SearchModal = dynamic(
  () => import("@/components/SearchModal").then((mod) => ({ default: mod.SearchModal })),
  { ssr: false }
)

import { CountrySelector } from "@/components/country-selector"

export function Navbar() {
  const { setTheme, theme } = useTheme()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/" className="flex items-center space-x-2 no-underline">
            <Image 
              src="/icon-192.png" 
              alt="Real Price Data Logo" 
              width={28} 
              height={28}
              className="w-7 h-7"
            />
            <span className="font-bold text-base sm:text-lg md:text-xl tracking-tight whitespace-nowrap">Real Price Data</span>
          </Link>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Input (MUI Style) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-w-[240px]"
                  aria-label="Open search"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground flex-1 text-left">Search...</span>
                  <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs border rounded bg-background">
                    ⌘K
                  </kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search products</p>
              </TooltipContent>
            </Tooltip>

            {/* Mobile Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden cursor-pointer"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
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
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          
          </div>
        </TooltipProvider>
      </div>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
