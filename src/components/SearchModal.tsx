"use client"

import { useState, useEffect } from "react"
import { Search, HardDrive, Dumbbell, Battery, Droplets, Baby, Coffee } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

// Quick links data - shown immediately when search opens
const QUICK_LINKS = {
  "POPULAR CATEGORIES": [
    { name: "Hard Drives & SSDs", slug: "storage", icon: HardDrive },
    { name: "Protein Powder", slug: "protein-powder", icon: Dumbbell },
    { name: "Batteries", slug: "batteries", icon: Battery },
  ],
  "TRENDING NOW": [
    { name: "Laundry Detergent", slug: "laundry-detergent", icon: Droplets },
    { name: "Diapers", slug: "diapers", icon: Baby },
    { name: "Coffee", slug: "coffee", icon: Coffee },
  ],
}

// All categories for search
const ALL_CATEGORIES = [
  { name: "Hard Drives & SSDs", slug: "storage", icon: HardDrive },
  { name: "Protein Powder", slug: "protein-powder", icon: Dumbbell },
  { name: "Laundry Detergent", slug: "laundry-detergent", icon: Droplets },
  { name: "Diapers", slug: "diapers", icon: Baby },
  { name: "Batteries", slug: "batteries", icon: Battery },
]

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Filter categories based on query
  const filteredCategories = ALL_CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(query.toLowerCase())
  )

  // Get all available items (quick links or search results)
  const availableItems = query === "" 
    ? Object.values(QUICK_LINKS).flat()
    : filteredCategories

  // Handle keyboard shortcuts and navigation
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === "Escape") {
        onOpenChange(false)
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % availableItems.length)
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + availableItems.length) % availableItems.length)
      }
      if (e.key === "Enter" && availableItems.length > 0) {
        e.preventDefault()
        handleLinkClick(availableItems[selectedIndex].slug)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange, selectedIndex, availableItems])

  // Reset query and selection when modal closes or query changes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleLinkClick = (slug: string) => {
    router.push(`/categories/${slug}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 bg-card" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>Search categories and products</DialogTitle>
        </VisuallyHidden>
        
        {/* Search Input Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 relative">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              placeholder="What are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-base px-2 py-1 h-auto flex-1 placeholder:text-muted-foreground/60"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs border border-border rounded bg-muted/50 text-muted-foreground font-mono shrink-0">
              esc
            </kbd>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[500px] overflow-y-auto px-6 py-6">
          {query === "" ? (
            // Show quick links when no search query
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(QUICK_LINKS).map(([section, links]) => (
                <div key={section}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    {section}
                  </h3>
                  <div className="space-y-1">
                    {links.map((link, idx) => {
                      const IconComponent = link.icon
                      const globalIndex = Object.values(QUICK_LINKS).flat().findIndex(l => l.slug === link.slug)
                      const isSelected = globalIndex === selectedIndex
                      return (
                        <button
                          key={link.slug}
                          onClick={() => handleLinkClick(link.slug)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group ${
                            isSelected ? 'bg-muted/70' : 'hover:bg-muted/70'
                          }`}
                        >
                          <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                            {link.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show search results
            <>
              {filteredCategories.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {filteredCategories.map((category, idx) => {
                      const IconComponent = category.icon
                      const isSelected = idx === selectedIndex
                      return (
                        <button
                          key={category.slug}
                          onClick={() => handleLinkClick(category.slug)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left group ${
                            isSelected ? 'bg-muted/70' : 'hover:bg-muted/70'
                          }`}
                        >
                          <IconComponent className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {category.name}
                            </p>
                            <p className="text-xs text-muted-foreground">Category</p>
                          </div>
                          <Badge variant="outline" className="ml-auto shrink-0">
                            View
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try searching for categories like "batteries" or "protein"
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <kbd className="px-1.5 py-0.5 border rounded bg-muted/50 font-mono">↑↓</kbd>
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 border rounded bg-muted/50 font-mono">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 border rounded bg-muted/50 font-mono">⌘K</kbd>
            <span>to toggle</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
