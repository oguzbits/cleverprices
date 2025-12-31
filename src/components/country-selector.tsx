"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_COUNTRY, getAllCountries, getCountryByCode, getFlag, isValidCountryCode } from "@/lib/countries";
import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountryItem } from "./CountryItem";

export function CountrySelector({ currentCountryCode }: { currentCountryCode?: string }) {
  const pathname = usePathname();
  const allCountries = getAllCountries();
  const currentCountry = getCountryByCode(currentCountryCode || DEFAULT_COUNTRY);

  // Separate live and coming soon countries
  const liveCountries = allCountries.filter((c) => c.isLive);
  const comingSoonCountries = allCountries.filter((c) => !c.isLive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-auto gap-1 px-2 sm:min-w-[140px] sm:gap-2 sm:px-3"
          aria-label="Select country"
        >
          <Globe className="h-4 w-4" />
          {currentCountry && (
            <Image
              src={getFlag(currentCountry.code)}
              alt={currentCountry.name}
              width={20}
              height={12}
              className="hidden h-3 w-5 object-cover shadow-sm sm:inline"
            />
          )}
          <span className="hidden md:inline">{currentCountry?.name}</span>
          <span className="font-semibold md:hidden">
            {currentCountry?.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Select Your Region</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Live Countries */}
        {liveCountries.map((c) => {
          // Build target path that preserves the current relative URL
          const segments = pathname.split('/').filter(Boolean);
          const firstSegment = segments[0];
          const hasCountryInUrl = firstSegment && isValidCountryCode(firstSegment);
          
          let targetHref = "";
          if (hasCountryInUrl) {
            const newSegments = [...segments];
            newSegments[0] = c.code;
            targetHref = `/${newSegments.join('/')}`;
          } else {
            // No country code in URL (likely on a root or shared page)
            targetHref = `/${c.code}${pathname === '/' ? '' : pathname}`;
          }

          return (
            <DropdownMenuItem
              key={c.code}
              asChild
              className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
            >
              <Link href={targetHref} prefetch={false} className="no-underline w-full">
                <CountryItem
                  code={c.code}
                  name={c.name}
                  domain={c.domain}
                  isLive={true}
                  isActive={currentCountryCode === c.code}
                />
              </Link>
            </DropdownMenuItem>
          );
        })}

        {comingSoonCountries.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-sm">
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
                  code={c.code}
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
  );
}
