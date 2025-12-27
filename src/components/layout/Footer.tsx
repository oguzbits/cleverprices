import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-muted/40 border-t">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center space-x-2">
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
            </div>
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

          <nav className="text-base" aria-label="Legal information">
            <h4 className="mb-3 font-semibold">About realpricedata</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/de/categories"
                  className="text-primary"
                >
                  View All Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-primary"
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

          <div className="text-muted-foreground text-base md:text-right">
            <p className="mb-4 text-sm">
              As an Amazon Associate, we earn from qualifying purchases. Amazon
              and the Amazon logo are trademarks of Amazon.com, Inc. or its
              affiliates.
            </p>
            <p>
              &copy; {new Date().getFullYear()} Real Price Data. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
