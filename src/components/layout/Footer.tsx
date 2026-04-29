import { Logo } from "@/components/layout/Logo";
import { ClientDate } from "@/components/ui/ClientDate";
import { COPYRIGHT_YEAR, BUILD_TIME } from "@/lib/build-config";
import { CACHE_VERSION, BRAND_DOMAIN } from "@/lib/site-config";
import { Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="border-t border-white/10"
      style={{ backgroundColor: "var(--footer-bg)", color: "var(--footer-fg)" }}
    >
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:py-14">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              Der unabhängige Preisvergleich für Technik und Hardware. Finden
              Sie das beste Preis-Leistungs-Verhältnis.
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
          <nav className="text-sm" aria-label="Kategorien">
            <h4 className="mb-4 text-[14px] font-bold tracking-wider text-white uppercase">
              Kategorien
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/smartphones"
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  Smartphones
                </Link>
              </li>
              <li>
                <Link
                  href="/notebooks"
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  Notebooks
                </Link>
              </li>
              <li>
                <Link
                  href="/ssds"
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  SSDs
                </Link>
              </li>
              <li>
                <Link
                  href="/grafikkarten"
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  Grafikkarten
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-[#ff9900] no-underline transition-colors hover:text-white"
                >
                  Deals & Angebote
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources Column */}
          <nav className="text-sm" aria-label="Ressourcen">
            <h4 className="mb-4 text-[14px] font-bold tracking-wider text-white uppercase">
              Informationen
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/blog"
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  Ratgeber & Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-white/70 no-underline transition-colors hover:text-white"
                >
                  Häufige Fragen (FAQ)
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal Column */}
          <nav className="text-sm" aria-label="Rechtliches">
            <h4 className="mb-4 text-[14px] font-bold tracking-wider text-white uppercase">
              Rechtliches
            </h4>
            <ul className="space-y-3">
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
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/60 sm:flex-row">
            <p>
              * Alle Preise inkl. MwSt., zzgl. Versandkosten. Die Angaben können
              sich seit der letzten Aktualisierung geändert haben. Als
              Amazon-Partner verdiene ich an qualifizierten Verkäufen.
            </p>
            <div className="flex flex-col items-end gap-1">
              <p>
                © {COPYRIGHT_YEAR} {BRAND_DOMAIN}. Alle Rechte vorbehalten.
              </p>
              <div className="text-[10px] opacity-30 select-none flex flex-col items-end">
                <span>Version: {CACHE_VERSION}</span>
                <ClientDate date={BUILD_TIME} className="mt-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
