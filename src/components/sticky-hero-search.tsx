"use client"

import { useEffect, useState } from "react"
import { HeroSearch } from "@/components/hero-search"

export function StickyHeroSearch() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When hero is NOT intersecting (scrolled out of view), show sticky search
        setIsVisible(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: "-80px 0px 0px 0px", // Offset for navbar height
      }
    )

    const heroElement = document.getElementById("hero-section")
    if (heroElement) {
      observer.observe(heroElement)
    }

    return () => {
      if (heroElement) {
        observer.unobserve(heroElement)
      }
    }
  }, [])

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <HeroSearch isSticky={true} />
        </div>
      </div>
    </div>
  )
}
