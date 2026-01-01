"use client";

import { cn } from "@/lib/utils";

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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CountryItem } from "./CountryItem";

export function CountrySelector({
  currentCountryCode,
}: {
  currentCountryCode?: string;
}) {
  const router = useRouter();
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

            const baseSegments = hasCountryInUrl ? segments.slice(1) : segments;

            // Map localized paths (e.g. impressum <-> legal-notice)
            const mappedSegments = baseSegments.map((segment) => {
              const isTargetGerman = c.code === "de";
              if (isTargetGerman) {
                if (segment === "legal-notice") return "impressum";
                if (segment === "privacy") return "datenschutz";
              } else {
                if (segment === "impressum") return "legal-notice";
                if (segment === "datenschutz") return "privacy";
              }
              return segment;
            });

            let targetHref = "";

            if (c.code === DEFAULT_COUNTRY) {
              targetHref = `/${mappedSegments.join("/")}`;
            } else {
              targetHref = `/${c.code}${
                mappedSegments.length > 0 ? `/${mappedSegments.join("/")}` : ""
              }`;
            }

            const queryString = searchParams.toString();
            if (queryString) {
              const separator = targetHref.includes("?") ? "&" : "?";
              targetHref += `${separator}${queryString}`;
            }

            const isActive = currentCountryCode === c.code;

            return (
              <DropdownMenuItem key={c.code} asChild>
                <Link
                  href={targetHref}
                  className={cn(
                    "focus:bg-accent focus:text-accent-foreground flex w-full cursor-pointer items-center px-2 py-1.5 no-underline",
                    isActive && "bg-emerald-50/80 dark:bg-emerald-500/10",
                  )}
                  onClick={() => {
                    saveCountryPreference(c.code);
                    // Explicitly refresh to update server components with new cookie
                    router.refresh();
                  }}
                  prefetch={true}
                >
                  <CountryItem
                    code={c.code}
                    name={c.name}
                    domain={c.domain}
                    isLive={true}
                    isActive={isActive}
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
