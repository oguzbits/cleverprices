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
import {
  DEFAULT_COUNTRY,
  getAllCountries,
  getCountryByCode,
  getFlag,
  isValidCountryCode,
  saveCountryPreference,
} from "@/lib/countries";
import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CountryItem } from "./CountryItem";

export function CountrySelector({
  currentCountryCode,
}: {
  currentCountryCode?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allCountries = getAllCountries();
  const currentCountry = getCountryByCode(
    currentCountryCode || DEFAULT_COUNTRY,
  );

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

        <div className="py-1">
          {/* Live Countries */}
          {liveCountries.map((c) => {
            const segments = pathname.split("/").filter(Boolean);
            const firstSegment = segments[0];
            const hasCountryInUrl =
              firstSegment && isValidCountryCode(firstSegment);

            let targetHref = "";

            if (hasCountryInUrl) {
              if (c.code === DEFAULT_COUNTRY) {
                // Switching TO US (Default): Remove the country segment
                // e.g., /ca/categories -> /categories
                const newSegments = segments.slice(1);
                targetHref = `/${newSegments.join("/")}?set_country=us`;
              } else {
                // Switching between non-US countries
                // e.g., /ca/categories -> /de/categories
                const newSegments = [...segments];
                newSegments[0] = c.code;
                targetHref = `/${newSegments.join("/")}`;
              }
            } else {
              if (c.code === DEFAULT_COUNTRY) {
                // Staying on US (Default): Keep path as is
                targetHref = `${pathname}?set_country=us`;
              } else {
                // Switching FROM US to another country
                // e.g., /categories -> /ca/categories
                targetHref = `/${c.code}${pathname === "/" ? "" : pathname}`;
              }
            }

            const queryString = searchParams.toString();
            if (queryString) {
              const separator = targetHref.includes("?") ? "&" : "?";
              targetHref += `${separator}${queryString}`;
            }

            return (
              <DropdownMenuItem key={c.code} asChild>
                <Link
                  href={targetHref}
                  className="focus:bg-accent focus:text-accent-foreground flex w-full cursor-pointer items-center px-2 py-1.5 no-underline"
                  onClick={(e) => {
                    saveCountryPreference(c.code);
                    if (c.code === DEFAULT_COUNTRY) {
                      e.preventDefault();
                      window.location.href = targetHref;
                    }
                  }}
                  prefetch={true}
                >
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
