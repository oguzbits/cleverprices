"use client"

import { CountryItem } from "@/components/CountryItem"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCountry } from "@/hooks/use-country"
import { getAllCountries } from "@/lib/countries"
import { Globe } from "lucide-react"

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
            <CountryItem 
              flag={c.flag}
              name={c.name}
              domain={c.domain}
              isLive={true}
              isActive={country === c.code}
            />
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
                <CountryItem 
                  flag={c.flag}
                  name={c.name}
                  domain={c.domain}
                  isLive={false}
                />
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
