import { COPYRIGHT_YEAR } from "@/lib/build-config";
import { getCategoryPath } from "@/lib/categories";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/countries";
import Image from "next/image";
import Link from "next/link";

interface FooterProps {
  country?: string;
}

export function Footer({ country: propCountry }: FooterProps) {
  const country = (propCountry || DEFAULT_COUNTRY) as CountryCode;
  return (
    <footer className="bg-muted/40 border-t">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link
              href={country === DEFAULT_COUNTRY ? "/" : `/${country}`}
              className="mb-2 flex items-center space-x-2 no-underline"
              prefetch={true}
            >
              <Image
                src="/icon-192.png"
                alt="Real Price Data Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <h3 className="text-lg font-black tracking-tight">
                <span className="text-(--ccc-red)">real</span>
                <span className="text-(--ccc-orange)">price</span>
                <span className="text-(--ccc-yellow)">data</span>
              </h3>
            </Link>
            <p className="text-muted-foreground max-w-xs text-base">
              Compare products by price per unit to find the best value.
              Data-driven, neutral, and efficient.
            </p>
            <p className="sr-only">
              Amazon Price Tracker & Price per Unit Calculator. Find the best
              storage deals, HDD prices, and SSD savings on Amazon DE, US, UK
              and International marketplaces.
            </p>
          </div>

          <nav className="text-base" aria-label="Quick Links">
            <h4 className="mb-3 font-semibold">Popular Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={getCategoryPath("hard-drives", country as CountryCode)}
                  className="text-muted-foreground hover:text-primary hover:underline"
                  prefetch={true}
                >
                  Hard Drives & SSDs
                </Link>
              </li>
              <li>
                <Link
                  href={getCategoryPath("ram", country as CountryCode)}
                  className="text-muted-foreground hover:text-primary hover:underline"
                  prefetch={true}
                >
                  RAM & Memory
                </Link>
              </li>
              <li>
                <Link
                  href={getCategoryPath(
                    "power-supplies",
                    country as CountryCode,
                  )}
                  className="text-muted-foreground hover:text-primary hover:underline"
                  prefetch={true}
                >
                  Power Supplies
                </Link>
              </li>
              <li>
                <Link
                  href={
                    country === DEFAULT_COUNTRY
                      ? "/categories"
                      : `/${country}/categories`
                  }
                  className="text-muted-foreground hover:text-primary hover:underline"
                  prefetch={true}
                >
                  All Categories
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="text-base" aria-label="Legal information">
            <h4 className="mb-3 font-semibold">About realpricedata.com</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={
                    country === DEFAULT_COUNTRY ? "/blog" : `/${country}/blog`
                  }
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href={
                    country === DEFAULT_COUNTRY ? "/faq" : `/${country}/faq`
                  }
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  FAQ
                </Link>
              </li>
              {country === "de" ? (
                <>
                  <li>
                    <Link
                      href="/impressum"
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      Impressum
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/datenschutz"
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      Datenschutz
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href={
                        country === DEFAULT_COUNTRY
                          ? "/legal-notice"
                          : `/${country}/legal-notice`
                      }
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      Legal Notice
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={
                        country === DEFAULT_COUNTRY
                          ? "/privacy"
                          : `/${country}/privacy`
                      }
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      Privacy
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <div className="text-muted-foreground text-base">
            <p className="mb-4 text-sm">
              As an Amazon Associate, we earn from qualifying purchases. Amazon
              and the Amazon logo are trademarks of Amazon.com, Inc. or its
              affiliates.
            </p>
            <p>
              &copy; {COPYRIGHT_YEAR} realpricedata.com. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
