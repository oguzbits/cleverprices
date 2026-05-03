import { Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Global 404 Page
 * Standardizing 404s helps GSC distinguish between missing pages and server errors.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <Search className="text-muted-foreground h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Seite nicht gefunden
      </h1>
      <p className="text-muted-foreground mt-4 mb-8 max-w-[500px] text-lg">
        Die gesuchte Seite existiert leider nicht mehr oder wurde verschoben.
        Nutzen Sie unsere Suche oder stöbern Sie in unseren Kategorien, um das
        passende Produkt zu finden.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/">Zur Startseite</Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/categories">Kategorien durchsuchen</Link>
        </Button>
      </div>
    </div>
  );
}
