"use client"

import { Search } from "lucide-react"
import { useState, useEffect } from "react"
import { SearchModal } from "@/components/SearchModal"

export function HeroSearch({ isSticky = false }: { isSticky?: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    // Only inject styles once on client side
    if (!document.getElementById('hero-search-animation')) {
      const style = document.createElement('style')
      style.id = 'hero-search-animation'
      style.textContent = `
        @keyframes border-flow {
          0%, 100% { border-color: hsl(220, 100%, 60%); }
          33% { border-color: hsl(280, 100%, 65%); }
          66% { border-color: hsl(320, 100%, 65%); }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <>
      <button
        onClick={() => setSearchOpen(true)}
        className="search-with-animated-border group w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 transition-all cursor-text rounded-2xl bg-card border-2 shadow-sm hover:shadow-lg"
        style={{
          borderColor: 'hsl(220, 100%, 60%)',
          animation: 'border-flow 4s ease-in-out infinite'
        }}
        aria-label="Open search"
      >
        <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
        <div className="flex-1 text-left">
          <span className="text-base sm:text-lg text-muted-foreground group-hover:text-foreground transition-colors">
            {isSticky ? "Search..." : "Search products..."}
          </span>
        </div>
        <kbd className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-sm border border-border/60 rounded-md bg-muted/50 text-muted-foreground font-mono shrink-0">
          <span className="text-base">⌘</span>K
        </kbd>
      </button>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
