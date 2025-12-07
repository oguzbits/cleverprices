"use client"

import { Search } from "lucide-react"
import { useState, useEffect } from "react"
import { SearchModal } from "@/components/SearchModal"

export function HeroSearch({ isSticky = false }: { isSticky?: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    // Inject styles on client side only to avoid hydration mismatch
    const styleId = 'hero-search-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes border-flow {
          0%, 100% { border-color: hsl(220, 100%, 60%); }
          33% { border-color: hsl(280, 100%, 65%); }
          66% { border-color: hsl(320, 100%, 65%); }
        }
        
        .search-with-animated-border {
          border: 2px solid hsl(220, 100%, 60%);
          border-radius: 1rem;
          background: hsl(var(--card));
          animation: border-flow 4s ease-in-out infinite;
        }
        
        .search-with-animated-border:hover {
          box-shadow: 
            0 0 20px hsla(220, 100%, 60%, 0.2),
            0 0 40px hsla(280, 100%, 65%, 0.1);
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <>
      <button
        onClick={() => setSearchOpen(true)}
        className="search-with-animated-border group w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 transition-all cursor-text"
        aria-label="Open search"
      >
        <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
        <div className="flex-1 text-left">
          <span className="text-base sm:text-lg text-muted-foreground group-hover:text-foreground transition-colors">
            {isSticky ? "Search..." : "Search products..."}
          </span>
        </div>
        <kbd className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border/60 rounded-md bg-muted/50 text-muted-foreground font-mono shrink-0">
          <span className="text-sm">⌘</span>K
        </kbd>
      </button>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
