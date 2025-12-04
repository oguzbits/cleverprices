# Vercel Analytics für SEO - Quick Start Checkliste

## ✅ Was bereits erledigt ist

- [x] Vercel Analytics installiert (`@vercel/analytics@1.6.1`)
- [x] Analytics in `layout.tsx` eingebunden
- [x] Speed Insights aktiv
- [x] Analytics-Tracking-Utilities erstellt (`src/lib/analytics.ts`)
- [x] ScrollTracker Component erstellt
- [x] TimeTracker Component erstellt

---

## 🚀 Nächste Schritte (Empfohlene Reihenfolge)

### Phase 1: Basis-Tracking aktivieren (30 Min)

#### 1. Engagement-Tracker zum Layout hinzufügen

```tsx
// src/app/layout.tsx
import { ScrollTracker } from "@/components/ScrollTracker";
import { TimeTracker } from "@/components/TimeTracker";

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
        <ThemeProvider>
          <NuqsProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <LazyCookieConsent />

            {/* ✅ Füge diese beiden Zeilen hinzu */}
            <ScrollTracker />
            <TimeTracker />

            <SpeedInsights />
            <Analytics />
          </NuqsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Was das bringt:**

- ✅ Trackt Scroll-Tiefe (zeigt ob Content engaging ist)
- ✅ Trackt Zeit auf Seite (zeigt Content-Qualität)
- ✅ Automatisch für alle Seiten aktiv

---

#### 2. Country-Switch Tracking aktivieren

Finde deine `country-selector.tsx` und füge Tracking hinzu:

```tsx
// src/components/country-selector.tsx
import { trackSEO } from "@/lib/analytics";

export function CountrySelector() {
  const { country, setCountry } = useCountry();

  const handleCountryChange = (newCountry: string) => {
    const oldCountry = country;
    setCountry(newCountry);

    // ✅ Füge diese Zeile hinzu
    trackSEO.countryChanged(oldCountry, newCountry);
  };

  // Rest deines Codes...
}
```

**Was das bringt:**

- ✅ Zeigt welche Länder-Kombinationen interessant sind
- ✅ Hilft bei Internationalisierungs-Strategie

---

#### 3. Theme-Toggle Tracking aktivieren

Finde deinen Theme-Toggle in der Navbar:

```tsx
// src/components/layout/Navbar.tsx
import { trackSEO } from "@/lib/analytics";

// In deinem Theme-Toggle Button
const handleThemeToggle = () => {
  const newTheme = theme === "dark" ? "light" : "dark";
  setTheme(newTheme);

  // ✅ Füge diese Zeile hinzu
  trackSEO.themeChanged(newTheme);
};
```

**Was das bringt:**

- ✅ Zeigt User-Präferenz für Dark/Light Mode
- ✅ Hilft bei Design-Entscheidungen

---

### Phase 2: Conversion-Tracking (1 Std)

#### 4. Affiliate-Click Tracking (WICHTIGSTE METRIK!)

Finde wo deine Amazon-Links sind und füge Tracking hinzu:

```tsx
// Beispiel: In deiner Produkt-Tabelle oder Card
import { trackSEO } from "@/lib/analytics";

const handleAffiliateClick = (product: Product, index: number) => {
  trackSEO.affiliateClick({
    productName: product.name,
    category: currentCategory,
    country: currentCountry,
    price: product.price,
    pricePerUnit: product.pricePerUnit,
    position: index + 1,
  });
};

// In deinem JSX:
<a
  href={product.amazonUrl}
  onClick={() => handleAffiliateClick(product, index)}
  target="_blank"
  rel="noopener noreferrer sponsored"
>
  View on Amazon
</a>;
```

**Was das bringt:**

- ✅ Zeigt welche Produkte am meisten konvertieren
- ✅ Zeigt welche Positionen in der Liste am besten performen
- ✅ Zeigt ROI deiner SEO-Bemühungen

---

#### 5. Category-View Tracking

Füge in deinen Category-Pages hinzu:

```tsx
// src/app/[country]/[parent]/[category]/page.tsx
"use client";

import { useEffect } from "react";
import { trackSEO } from "@/lib/analytics";

export default function CategoryPage({ params }: Props) {
  const { country, category } = params;

  useEffect(() => {
    // ✅ Füge diese Zeile hinzu
    trackSEO.categoryView(category, country);
  }, [category, country]);

  // Rest deines Codes...
}
```

**Was das bringt:**

- ✅ Zeigt welche Kategorien am beliebtesten sind
- ✅ Zeigt geografische Unterschiede
- ✅ Hilft bei Content-Priorisierung

---

### Phase 3: Filter & Sort Tracking (1 Std)

#### 6. Filter-Tracking

Falls du `useProductFilters` nutzt:

```tsx
// In deiner Filter-Component
import { trackSEO } from "@/lib/analytics";

const handleFilterChange = (filterName: string, value: string | string[]) => {
  setFilter(filterName, value);

  // ✅ Füge diese Zeile hinzu
  trackSEO.filterApplied(filterName, value, currentCategory);
};
```

**Was das bringt:**

- ✅ Zeigt welche Filter wichtig für Nutzer sind
- ✅ Zeigt User-Intent (z.B. "nur neue Produkte")
- ✅ Hilft bei Filter-Optimierung

---

#### 7. Sort-Tracking

Falls du Sortierung hast:

```tsx
// In deiner Sort-Component
import { trackSEO } from "@/lib/analytics";

const handleSortChange = (sortBy: string, order: "asc" | "desc") => {
  setSortBy(sortBy);
  setOrder(order);

  // ✅ Füge diese Zeile hinzu
  trackSEO.sortChanged(sortBy, order, currentCategory);
};
```

**Was das bringt:**

- ✅ Zeigt wie Nutzer Produkte priorisieren
- ✅ Hilft bei Default-Sort-Entscheidung

---

### Phase 4: Deploy & Beobachten (5 Min)

#### 8. Zu Vercel deployen

```bash
# Committe deine Änderungen
git add .
git commit -m "Add Vercel Analytics tracking for SEO"
git push

# Oder deploy direkt
vercel --prod
```

#### 9. Analytics Dashboard öffnen

1. Gehe zu [vercel.com](https://vercel.com)
2. Öffne dein Projekt
3. Klicke auf "Analytics" Tab
4. Warte 24-48h für erste Daten

---

## 📊 Was du nach 1 Woche tun solltest

### Woche 1: Daten sammeln

- ✅ Lass Analytics laufen
- ✅ Keine Änderungen machen
- ✅ Baseline-Daten sammeln

### Woche 2: Erste Analyse

```markdown
Öffne Analytics Dashboard und checke:

1. Top Pages

   - Welche Kategorien sind am beliebtesten?
   - Welche Länder-Versionen performen am besten?

2. Traffic Sources

   - Wie viel % kommt von Google?
   - Welche externen Seiten verlinken auf dich?

3. Geographic Distribution

   - Aus welchen Ländern kommt Traffic?
   - Welche Länder haben hohe Bounce-Rate?

4. Device Breakdown

   - Mobile vs Desktop?
   - Optimiere für dominantes Device

5. Custom Events (falls implementiert)
   - Welche Produkte werden am meisten geklickt?
   - Welche Filter werden am meisten genutzt?
   - Welche Country-Switches sind häufig?
```

### Woche 3: Erste Optimierungen

Basierend auf den Daten:

```markdown
Wenn Hard-Drives am meisten Traffic hat:
→ Erstelle mehr Storage-Kategorien (NVMe, External HDDs, etc.)
→ Optimiere Meta-Descriptions für Hard-Drives
→ Füge FAQ-Sektion für Hard-Drives hinzu

Wenn viel Traffic aus Deutschland kommt:
→ Verbessere deutsche Übersetzungen
→ Füge hreflang-Tags hinzu
→ Optimiere für deutsche Keywords

Wenn Mobile-Traffic > 50%:
→ Priorisiere Mobile Core Web Vitals
→ Teste Mobile Usability
→ Optimiere Touch-Targets

Wenn Bounce-Rate hoch auf bestimmter Seite:
→ Überprüfe Page Speed
→ Verbessere Content-Qualität
→ Füge interne Links hinzu
```

---

## 🎯 SEO-Ziele für die nächsten 3 Monate

### Monat 1: Foundation

- [x] Analytics eingerichtet ✅
- [ ] Basis-Tracking implementiert
- [ ] Conversion-Tracking aktiv
- [ ] Erste Daten gesammelt

### Monat 2: Optimization

- [ ] Top 10 Seiten optimiert
- [ ] Hreflang-Tags für alle Länder
- [ ] Meta-Descriptions verbessert
- [ ] Interne Verlinkung optimiert

### Monat 3: Growth

- [ ] Content-Strategie basierend auf Daten
- [ ] Backlink-Strategie implementiert
- [ ] Featured Snippets targeten
- [ ] Schema.org Markup hinzugefügt

---

## 📈 Erwartete Ergebnisse

Nach 3 Monaten solltest du sehen:

```markdown
Traffic:
├── +50-100% organischer Traffic
├── +30% Unique Visitors
└── +20% Pages per Session

SEO:
├── Top 10 Rankings für Haupt-Keywords
├── Featured Snippets für FAQ-Seiten
└── Backlinks von 5-10 relevanten Seiten

Conversion:
├── 3-5% Affiliate-Click-Rate
├── +25% Returning Visitors
└── Niedrigere Bounce-Rate (-10%)
```

---

## 🆘 Troubleshooting

### "Ich sehe keine Daten im Dashboard"

```markdown
Mögliche Gründe:

1. Noch nicht deployed zu Vercel
   → Deploy mit `vercel --prod`

2. Zu früh (< 24h nach Deploy)
   → Warte 24-48h für erste Daten

3. Kein Traffic
   → Teile deine Seite, erstelle Backlinks

4. Analytics nicht aktiviert
   → Checke ob <Analytics /> in layout.tsx ist
```

### "Custom Events werden nicht getrackt"

```markdown
Debugging:

1. Aktiviere Debug-Mode:
   import { setAnalyticsDebug } from '@/lib/analytics';
   setAnalyticsDebug(true);

2. Öffne Browser Console
   → Siehst du "📊 Analytics Event" Logs?

3. Checke ob track() importiert ist:
   import { track } from '@vercel/analytics';

4. Checke ob Events in Production sind:
   → Custom Events funktionieren nur in Production!
```

### "Performance-Probleme nach Analytics"

```markdown
Lösungen:

1. Nutze passive Event Listeners:
   window.addEventListener('scroll', handler, { passive: true });

2. Throttle/Debounce häufige Events:
   const throttled = throttle(() => track(...), 1000);

3. Batch Events:
   import { analyticsBatcher } from '@/lib/analytics';
   analyticsBatcher.add('event', data);

4. Reduziere Tracking-Frequenz:
   → Nicht jeden Scroll tracken, nur Milestones
```

---

## 📚 Weitere Ressourcen

### Dokumentation

- [SEO Analytics Guide](./SEO_ANALYTICS_GUIDE.md) - Vollständiger SEO-Leitfaden
- [Integration Examples](./ANALYTICS_INTEGRATION_EXAMPLES.md) - Code-Beispiele
- [Analytics Setup](./ANALYTICS_SETUP.md) - Technische Details

### Externe Links

- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Google Search Console](https://search.google.com/search-console)
- [Schema.org](https://schema.org)
- [Hreflang Guide](https://developers.google.com/search/docs/specialty/international)

---

## ✅ Quick Checklist

Kopiere diese Checklist und hake ab, was du erledigt hast:

```markdown
Phase 1: Basis-Tracking

- [x] ScrollTracker zum Layout hinzugefügt
- [x] TimeTracker zum Layout hinzugefügt
- [x] Country-Switch Tracking aktiviert
- [x] Theme-Toggle Tracking aktiviert

Phase 2: Conversion-Tracking

- [x] Affiliate-Click Tracking implementiert
- [x] Category-View Tracking implementiert

Phase 3: Filter & Sort

- [x] Filter-Tracking implementiert
- [x] Sort-Tracking implementiert

Phase 4: Deploy

- [ ] Zu Vercel deployed
- [ ] Analytics Dashboard geöffnet
- [ ] Erste Daten sichtbar (nach 24-48h)

Phase 5: Optimierung

- [ ] Wöchentliche Analytics-Review eingerichtet
- [ ] Top 10 Seiten identifiziert
- [ ] Erste Optimierungen basierend auf Daten
```

---

**Viel Erfolg! 🚀**

Bei Fragen oder Problemen, schau in die anderen Guides oder frag mich!
