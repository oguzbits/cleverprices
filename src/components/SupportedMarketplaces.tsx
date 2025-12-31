"use client";

import { getFlag } from "@/lib/countries";
import { saveCountryPreference } from "@/lib/countries";
import Image from "next/image";
import Link from "next/link";
import { type Country } from "@/lib/countries";

export function SupportedMarketplaces({
  allCountries,
  currentCountry,
}: {
  allCountries: Country[];
  currentCountry: string;
}) {
  return (
    <div className="border-border mb-16 flex flex-col items-center justify-center border-y py-10">
      <p className="text-muted-foreground mb-6 text-sm font-bold tracking-widest uppercase">
        Supported Marketplaces
      </p>
      <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
        {allCountries.map((c) => {
          const isActive = c.code === currentCountry;
          const flagUrl = getFlag(c.code);
          const href = c.isLive
            ? c.code === "us"
              ? "/?set_country=us"
              : `/${c.code}`
            : "#";

          return (
            <Link
              key={c.code}
              href={href}
              prefetch={c.code !== "us"}
              onClick={() => {
                if (c.isLive) {
                  // Save preference to cookie + localStorage
                  saveCountryPreference(c.code);
                }
              }}
              className={`group relative flex flex-col items-center no-underline transition-all ${
                c.isLive
                  ? "cursor-pointer"
                  : "pointer-events-none cursor-not-allowed opacity-20 grayscale"
              }`}
              aria-disabled={!c.isLive}
            >
              <div
                className={`flex items-center justify-center overflow-hidden border-2 transition-all duration-300 ${
                  isActive
                    ? "border-primary/30 bg-primary/10 rounded-2xl p-4 shadow-sm"
                    : "border-transparent bg-transparent p-4"
                }`}
              >
                <Image
                  src={flagUrl}
                  alt={c.name}
                  width={64}
                  height={40}
                  className="h-8 w-12 object-cover transition-all sm:h-10 sm:w-16"
                  priority={isActive}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
