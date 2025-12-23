import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 py-8 md:py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Image 
                src="/icon-192.png" 
                alt="Real Price Data Logo" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
              <h3 className="text-lg font-black tracking-tight">
                <span className="text-(--ccc-red)">real</span>
                <span className="text-(--ccc-orange)">price</span>
                <span className="text-(--ccc-yellow)">data</span>
              </h3>
            </div>
            <p className="text-base text-muted-foreground max-w-xs">
              Compare products by price per unit to find the best value.
              Data-driven, neutral, and efficient.
            </p>
            <p className="sr-only">
              Amazon Price Tracker & Price per Unit Calculator. 
              Find the best storage deals, HDD prices, and SSD savings on Amazon DE, US, UK and International marketplaces.
            </p>
          </div>

          <nav className="text-base" aria-label="Legal information">
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/de/categories" className="text-primary hover:underline transition-all">
                  View All Categories
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-primary hover:underline transition-all">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-primary hover:underline transition-all">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-primary hover:underline transition-all">
                  Impressum / Legal Notice
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-primary hover:underline transition-all">
                  Datenschutz / Privacy
                </Link>
              </li>
            </ul>
          </nav>

          <div className="text-base text-muted-foreground md:text-right">
            <p className="mb-4 text-sm">
              As an Amazon Associate, we earn from qualifying purchases. Amazon and the Amazon logo are 
              trademarks of Amazon.com, Inc. or its affiliates.
            </p>
            <p>&copy; {new Date().getFullYear()} Real Price Data. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
