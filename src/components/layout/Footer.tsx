import { getCategoryPath } from "@/lib/categories";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/countries";
import Image from "next/image";
import Link from "next/link";

interface FooterProps {
  country?: CountryCode;
}

export function Footer({ country = DEFAULT_COUNTRY }: FooterProps) {
  return (
    <footer className="bg-muted/40 border-t">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link
              href={country === DEFAULT_COUNTRY ? "/" : `/${country}`}
              className="mb-2 flex items-center space-x-2 no-underline"
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
                <Link href={getCategoryPath("hard-drives", country as CountryCode)} className="text-primary hover:underline">
                  Hard Drives & SSDs
                </Link>
              </li>
              <li>
                <Link href={getCategoryPath("ram", country as CountryCode)} className="text-primary hover:underline">
                  RAM & Memory
                </Link>
              </li>
              <li>
                <Link href={getCategoryPath("power-supplies", country as CountryCode)} className="text-primary hover:underline">
                  Power Supplies
                </Link>
              </li>
              <li>
                <Link href={`/${country}/categories`} className="text-primary hover:underline">
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
                  href={country === DEFAULT_COUNTRY ? "/blog" : `/${country}/blog`}
                  className="text-primary hover:underline"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-primary"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="text-primary"
                >
                  Impressum / Legal Notice
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-primary"
                >
                  Datenschutz / Privacy
                </Link>
              </li>
            </ul>
          </nav>

          <div className="text-muted-foreground text-base">
            <p className="mb-4 text-sm">
              As an Amazon Associate, we earn from qualifying purchases. Amazon
              and the Amazon logo are trademarks of Amazon.com, Inc. or its
              affiliates.
            </p>
            <p>
              &copy; {new Date().getFullYear()} realpricedata.com. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
