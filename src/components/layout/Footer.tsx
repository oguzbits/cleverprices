import { Logo } from "@/components/layout/Logo";
import { COPYRIGHT_YEAR } from "@/lib/build-config";
import { getCategoryPath } from "@/lib/categories";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/countries";
import { Mail } from "lucide-react";
import Link from "next/link";

interface FooterProps {
  country?: string;
}

export function Footer({ country: propCountry }: FooterProps) {
  const country = (propCountry || DEFAULT_COUNTRY) as CountryCode;

  return (
    <footer
      className="border-t border-white/10"
      style={{ backgroundColor: "var(--footer-bg)", color: "var(--footer-fg)" }}
    >
      <div className="container mx-auto px-4 py-10 md:py-14">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo country={country} />
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              Compare products by price per unit to find the best value.
              Data-driven, neutral, and efficient.
            </p>

            {/* Contact */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="mailto:info@cleverprices.com"
                className="text-white/60 no-underline transition-colors hover:text-white"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Categories Column */}
          <nav className="text-sm" aria-label="Popular Categories">
            <h4 className="mb-4 font-semibold text-white">
              Popular Categories
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={getCategoryPath("hard-drives", country as CountryCode)}
                  className="text-white/70 no-underline transition-colors hover:text-white"
                  prefetch={true}
                >
                  Hard Drives & SSDs
                </Link>
              </li>
              <li>
                <Link
                  href={getCategoryPath("ram", country as CountryCode)}
                  className="text-white/70 no-underline transition-colors hover:text-white"
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
                  className="text-white/70 no-underline transition-colors hover:text-white"
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
                  className="text-white/70 no-underline transition-colors hover:text-white"
                  prefetch={true}
                >
                  All Categories →
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources Column */}
          <nav className="text-sm" aria-label="Resources">
            <h4 className="mb-4 font-semibold text-white">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={
                    country === DEFAULT_COUNTRY ? "/blog" : `/${country}/blog`
                  }
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href={
                    country === DEFAULT_COUNTRY ? "/faq" : `/${country}/faq`
                  }
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal Column */}
          <nav className="text-sm" aria-label="Legal information">
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              {country === "de" ? (
                <>
                  <li>
                    <Link
                      href="/impressum"
                      className="text-white/70 no-underline transition-colors hover:text-white"
                    >
                      Impressum
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/datenschutz"
                      className="text-white/70 no-underline transition-colors hover:text-white"
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
                      className="text-white/70 no-underline transition-colors hover:text-white"
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
                      className="text-white/70 no-underline transition-colors hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/60 sm:flex-row">
            <p>As an Amazon Associate, we earn from qualifying purchases.</p>
            <p>© {COPYRIGHT_YEAR} cleverprices.com. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Hidden SEO text */}
      <p className="sr-only">
        Amazon Price Tracker & Price per Unit Calculator. Find the best storage
        deals, HDD prices, and SSD savings on Amazon DE, US, UK and
        International marketplaces.
      </p>
    </footer>
  );
}
