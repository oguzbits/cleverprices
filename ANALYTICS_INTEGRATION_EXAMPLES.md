# Analytics Integration - Beispiele für deine Components

## 🎯 Wie du die Analytics-Funktionen nutzt

Hier sind konkrete Beispiele, wie du das neue `analytics.ts` Modul in deinen bestehenden Components verwendest.

---

## 1. Product Links / Affiliate Clicks

### Beispiel: In einer Produkt-Tabelle oder Card

```tsx
// src/components/ProductTable.tsx oder ähnlich
import { trackSEO } from "@/lib/analytics";

export function ProductTable({ products, category, country }: Props) {
  const handleAffiliateClick = (product: Product, index: number) => {
    // Track den Affiliate-Klick für SEO-Analyse
    trackSEO.affiliateClick({
      productName: product.name,
      category: category,
      country: country,
      price: product.price,
      pricePerUnit: product.pricePerUnit,
      position: index + 1, // Position in der Liste
    });
  };

  return (
    <table>
      <tbody>
        {products.map((product, index) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.price}</td>
            <td>
              <a
                href={product.affiliateUrl}
                onClick={() => handleAffiliateClick(product, index)}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                View on Amazon
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 2. Filter Components

### Beispiel: Wenn Nutzer Filter anwenden

```tsx
// src/components/ProductFilters.tsx oder ähnlich
import { trackSEO } from "@/lib/analytics";
import { useProductFilters } from "@/hooks/useProductFilters";

export function ProductFilters({ category }: Props) {
  const { filters, setFilter } = useProductFilters();

  const handleFilterChange = (filterName: string, value: string | string[]) => {
    // Setze den Filter
    setFilter(filterName, value);

    // Track für SEO-Analyse
    trackSEO.filterApplied(filterName, value, category);
  };

  return (
    <div>
      <Checkbox
        checked={filters.condition.includes("new")}
        onCheckedChange={(checked) => {
          const newValue = checked
            ? [...filters.condition, "new"]
            : filters.condition.filter((c) => c !== "new");
          handleFilterChange("condition", newValue);
        }}
      >
        New Only
      </Checkbox>
    </div>
  );
}
```

---

## 3. Sort Functionality

### Beispiel: Wenn Nutzer Sortierung ändern

```tsx
// src/components/ProductSort.tsx oder ähnlich
import { trackSEO } from "@/lib/analytics";

export function ProductSort({ category }: Props) {
  const [sortBy, setSortBy] = useState("pricePerUnit");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const handleSortChange = (newSortBy: string, newOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setOrder(newOrder);

    // Track für SEO-Analyse
    trackSEO.sortChanged(newSortBy, newOrder, category);
  };

  return (
    <Select
      value={`${sortBy}-${order}`}
      onValueChange={(value) => {
        const [sortBy, order] = value.split("-");
        handleSortChange(sortBy, order as "asc" | "desc");
      }}
    >
      <SelectItem value="pricePerUnit-asc">
        Price per Unit (Low to High)
      </SelectItem>
      <SelectItem value="pricePerUnit-desc">
        Price per Unit (High to Low)
      </SelectItem>
      <SelectItem value="price-asc">Total Price (Low to High)</SelectItem>
    </Select>
  );
}
```

---

## 4. Country Selector

### Beispiel: Track Country-Switches

```tsx
// src/components/country-selector.tsx (deine bestehende Datei)
import { trackSEO } from "@/lib/analytics";

export function CountrySelector() {
  const { country, setCountry } = useCountry();

  const handleCountryChange = (newCountry: string) => {
    const oldCountry = country;

    // Setze neues Land
    setCountry(newCountry);

    // Track für SEO-Analyse
    trackSEO.countryChanged(oldCountry, newCountry);
  };

  return (
    <Select value={country} onValueChange={handleCountryChange}>
      {/* Country options */}
    </Select>
  );
}
```

---

## 5. Category Pages

### Beispiel: Track Category Views

```tsx
// src/app/[country]/[parent]/[category]/page.tsx
"use client";

import { useEffect } from "react";
import { trackSEO } from "@/lib/analytics";

export default function CategoryPage({ params }: Props) {
  const { country, category } = params;

  useEffect(() => {
    // Track Category View beim Laden der Seite
    trackSEO.categoryView(category, country);
  }, [category, country]);

  return <div>{/* Category content */}</div>;
}
```

---

## 6. Navigation Tracking

### Beispiel: Track wichtige Navigation

```tsx
// src/components/layout/Navbar.tsx
import { trackSEO } from "@/lib/analytics";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const handleNavClick = (to: string, method: "menu" | "breadcrumb") => {
    trackSEO.navigation(pathname, to, method);
  };

  return (
    <nav>
      <Link
        href="/us/categories"
        onClick={() => handleNavClick("/us/categories", "menu")}
      >
        Categories
      </Link>
    </nav>
  );
}
```

---

## 7. Theme Toggle

### Beispiel: Track Theme-Präferenz

```tsx
// src/components/layout/Navbar.tsx (Theme Toggle)
import { trackSEO } from "@/lib/analytics";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);

    // Track für SEO-Analyse (zeigt User-Präferenz)
    trackSEO.themeChanged(newTheme);
  };

  return (
    <Button
      onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
    >
      Toggle Theme
    </Button>
  );
}
```

---

## 8. Scroll Depth Tracking

### Beispiel: Track wie weit Nutzer scrollen

```tsx
// src/components/ScrollTracker.tsx (neues Component)
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEngagement } from "@/lib/analytics";

export function ScrollTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let maxScroll = 0;
    let tracked25 = false;
    let tracked50 = false;
    let tracked75 = false;
    let tracked100 = false;

    const handleScroll = () => {
      const scrollPercentage =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;

      maxScroll = Math.max(maxScroll, scrollPercentage);

      // Track bei Meilensteinen
      if (maxScroll >= 25 && !tracked25) {
        trackEngagement.scrollDepth(pathname, 25);
        tracked25 = true;
      }
      if (maxScroll >= 50 && !tracked50) {
        trackEngagement.scrollDepth(pathname, 50);
        tracked50 = true;
      }
      if (maxScroll >= 75 && !tracked75) {
        trackEngagement.scrollDepth(pathname, 75);
        tracked75 = true;
      }
      if (maxScroll >= 100 && !tracked100) {
        trackEngagement.scrollDepth(pathname, 100);
        tracked100 = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return null; // Unsichtbares Component
}

// Füge in layout.tsx hinzu:
// <ScrollTracker />
```

---

## 9. Time on Page Tracking

### Beispiel: Track wie lange Nutzer auf Seite bleiben

```tsx
// src/components/TimeTracker.tsx (neues Component)
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEngagement } from "@/lib/analytics";

export function TimeTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const startTime = Date.now();

    const handleUnload = () => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      trackEngagement.timeOnPage(pathname, timeOnPage);
    };

    // Track beim Verlassen der Seite
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      // Track auch bei Route-Wechsel (SPA)
      handleUnload();
    };
  }, [pathname]);

  return null;
}

// Füge in layout.tsx hinzu:
// <TimeTracker />
```

---

## 10. Search Tracking (falls du Suche implementierst)

### Beispiel: Track Suchanfragen

```tsx
// src/components/SearchModal.tsx (deine bestehende Datei)
import { trackSEO } from "@/lib/analytics";

export function SearchModal() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  const handleSearch = async (searchQuery: string) => {
    const searchResults = await searchProducts(searchQuery);
    setResults(searchResults);

    // Track für SEO-Analyse (zeigt fehlende Keywords!)
    trackSEO.searchPerformed(
      searchQuery,
      searchResults.length,
      getCurrentCategory()
    );
  };

  return (
    <Dialog>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch(query);
          }
        }}
      />
    </Dialog>
  );
}
```

---

## 11. Complete Integration Example

### Beispiel: Vollständige Produkt-Seite mit allen Trackings

```tsx
// src/app/[country]/[parent]/[category]/page.tsx
"use client";

import { useEffect } from "react";
import { trackSEO, trackJourney } from "@/lib/analytics";

export default function CategoryPage({ params }: Props) {
  const { country, category } = params;

  useEffect(() => {
    // 1. Track Category View
    trackSEO.categoryView(category, country);

    // 2. Track Landing (falls erste Seite)
    if (document.referrer) {
      trackJourney.landing(
        `/${country}/${category}`,
        new URL(document.referrer).hostname
      );
    }
  }, [category, country]);

  const handleProductClick = (product: Product, index: number) => {
    // 3. Track Product View
    trackSEO.productView(product.name, category, country);

    // 4. Track Affiliate Click
    trackSEO.affiliateClick({
      productName: product.name,
      category: category,
      country: country,
      price: product.price,
      pricePerUnit: product.pricePerUnit,
      position: index + 1,
    });

    // 5. Track Conversion Journey
    trackJourney.conversion(product.name, product.price, [
      "landing",
      "category_view",
      "product_click",
    ]);
  };

  return <div>{/* Product list */}</div>;
}
```

---

## 12. Layout Integration

### Füge globale Tracker zum Layout hinzu

```tsx
// src/app/layout.tsx
import { ScrollTracker } from "@/components/ScrollTracker";
import { TimeTracker } from "@/components/TimeTracker";

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NuqsProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <LazyCookieConsent />

            {/* Analytics Components */}
            <ScrollTracker />
            <TimeTracker />

            {/* Vercel Analytics */}
            <SpeedInsights />
            <Analytics />
          </NuqsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 📊 Was du damit erreichen kannst

### SEO-Insights die du bekommst:

1. **Content-Performance**

   - Welche Kategorien sind am beliebtesten?
   - Welche Produkte werden am meisten angeklickt?
   - Wo springen Nutzer ab?

2. **User-Intent**

   - Welche Filter werden am meisten genutzt?
   - Wie sortieren Nutzer Produkte?
   - Welche Suchbegriffe werden verwendet?

3. **Conversion-Optimierung**

   - Welche Positionen in der Liste konvertieren am besten?
   - Welche Traffic-Quellen haben höchste Conversion?
   - Wie ist die User-Journey bis zum Klick?

4. **Internationalisierung**

   - Welche Länder sind am aktivsten?
   - Wohin wechseln Nutzer?
   - Welche Länder brauchen mehr Content?

5. **Engagement**
   - Wie tief scrollen Nutzer?
   - Wie lange bleiben sie auf der Seite?
   - Wie viele Seiten besuchen sie?

---

## 🚀 Nächste Schritte

1. **Implementiere die wichtigsten Trackings:**

   - ✅ Affiliate Clicks (höchste Priorität!)
   - ✅ Category Views
   - ✅ Filter Usage
   - ✅ Country Switches

2. **Teste lokal:**

   ```tsx
   import { setAnalyticsDebug } from "@/lib/analytics";

   // In deiner App während Development
   setAnalyticsDebug(true);
   ```

3. **Deploy und beobachte:**
   - Deploy to Vercel
   - Öffne Analytics Dashboard
   - Warte 24-48h für erste Daten
   - Analysiere und optimiere!

---

## 💡 Pro-Tipps

### Nicht zu viel tracken!

```tsx
// ❌ Schlecht: Trackt jede Mausbewegung
onMouseMove={() => track('mouse_move')}

// ✅ Gut: Trackt nur wichtige Aktionen
onClick={() => trackSEO.affiliateClick(...)}
```

### Privacy beachten

```tsx
// ❌ Schlecht: Trackt persönliche Daten
track("user_email", { email: user.email });

// ✅ Gut: Nur anonyme Metriken
track("user_action", { action: "signup" });
```

### Performance im Auge behalten

```tsx
// ✅ Nutze passive Event Listeners
window.addEventListener("scroll", handleScroll, { passive: true });

// ✅ Debounce häufige Events
const debouncedTrack = debounce(() => track("scroll"), 1000);
```

---

Viel Erfolg mit deiner SEO-Optimierung! 🎯
