"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, Search } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Lazy load SearchModal - only needed when user clicks search
const SearchModal = dynamic(
  () => import("@/components/SearchModal").then((mod) => ({ default: mod.SearchModal })),
  { ssr: false }
)

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸", domain: "amazon.com" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧", domain: "amazon.co.uk" },
  { code: "CA", name: "Canada", flag: "🇨🇦", domain: "amazon.ca" },
  { code: "DE", name: "Germany", flag: "🇩🇪", domain: "amazon.de" },
  { code: "ES", name: "Spain", flag: "🇪🇸", domain: "amazon.es" },
  { code: "IT", name: "Italy", flag: "🇮🇹", domain: "amazon.it" },
  { code: "FR", name: "France", flag: "🇫🇷", domain: "amazon.fr" },
  { code: "AU", name: "Australia", flag: "🇦🇺", domain: "amazon.com.au" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", domain: "amazon.se" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", domain: "amazon.co.uk" },
  { code: "IN", name: "India", flag: "🇮🇳", domain: "amazon.in" },
]

export function Navbar() {
  const { setTheme, theme } = useTheme()
  const [country, setCountry] = React.useState(countries[0])
  const [searchOpen, setSearchOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2 no-underline">
            <span className="font-bold text-xl tracking-tight">bestprices.today</span>
          </Link>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-2">
            {/* Search Input (MUI Style) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
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

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 cursor-pointer" aria-label={`Select region, currently ${country.name}`}>
                      <span className="text-lg">{country.flag}</span>
                      <span className="hidden sm:inline-block">{country.code}</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select region</p>
                </TooltipContent>
              </Tooltip>
            <DropdownMenuContent align="end" className="w-[200px]">
              {countries.map((c) => (
                <DropdownMenuItem key={c.code} onClick={() => setCountry(c)} className="flex items-start gap-3 py-2">
                  <span className="text-xl mt-0.5">{c.flag}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.domain}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
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
