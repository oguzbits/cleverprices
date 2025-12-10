"use client"

import { Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useCountry } from "@/hooks/use-country"
import { getAllCountries } from "@/lib/countries"

export function CountrySelector() {
  const { country, currentCountry, changeCountry } = useCountry()
  const allCountries = getAllCountries()
  
  // Separate live and coming soon countries
  const liveCountries = allCountries.filter(c => c.isLive)
  const comingSoonCountries = allCountries.filter(c => !c.isLive)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 sm:gap-2 px-2 sm:px-3 min-w-[auto] sm:min-w-[140px]"
          aria-label="Select country"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentCountry?.flag}</span>
          <span className="hidden md:inline">{currentCountry?.name}</span>
          <span className="md:hidden font-semibold">{currentCountry?.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Select Your Region</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Live Countries */}
        {liveCountries.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => changeCountry(c.code)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.domain}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  Live
                </Badge>
                {country === c.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        {comingSoonCountries.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Coming Soon
            </DropdownMenuLabel>
            
            {/* Coming Soon Countries */}
            {comingSoonCountries.map((c) => (
              <DropdownMenuItem
                key={c.code}
                disabled
                className="cursor-not-allowed opacity-60"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.domain}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Soon
                    </Badge>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
