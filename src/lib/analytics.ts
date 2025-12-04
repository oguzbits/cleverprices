/**
 * Analytics Tracking Utilities
 * 
 * Wrapper für Vercel Analytics mit SEO-fokussierten Custom Events
 */

import { track } from '@vercel/analytics';

/**
 * SEO-relevante Events tracken
 */
export const trackSEO = {
  /**
   * Track Kategorie-Ansichten
   * Hilft zu verstehen, welche Kategorien am beliebtesten sind
   */
  categoryView: (category: string, country: string) => {
    track('category_view', { 
      category, 
      country,
      timestamp: new Date().toISOString() 
    });
  },

  /**
   * Track Produkt-Ansichten
   * Zeigt, welche Produkte am meisten Interesse wecken
   */
  productView: (product: string, category: string, country: string) => {
    track('product_view', { 
      product, 
      category, 
      country 
    });
  },

  /**
   * Track Affiliate-Klicks (wichtigste Conversion-Metrik!)
   * Zeigt ROI deiner SEO-Bemühungen
   */
  affiliateClick: (params: {
    productName: string;
    category: string;
    country: string;
    price: number;
    pricePerUnit?: number;
    position?: number; // Position in der Liste
  }) => {
    track('affiliate_click', {
      product: params.productName,
      category: params.category,
      country: params.country,
      price: params.price,
      price_per_unit: params.pricePerUnit,
      list_position: params.position,
    });
  },

  /**
   * Track Filter-Nutzung
   * Zeigt User-Intent und hilft bei Content-Optimierung
   */
  filterApplied: (filter: string, value: string | string[], category: string) => {
    track('filter_applied', { 
      filter, 
      value: Array.isArray(value) ? value.join(',') : value,
      category 
    });
  },

  /**
   * Track Sortierung
   * Zeigt, wie Nutzer Produkte priorisieren
   */
  sortChanged: (sortBy: string, order: 'asc' | 'desc', category: string) => {
    track('sort_changed', { 
      sort_by: sortBy, 
      order, 
      category 
    });
  },

  /**
   * Track Country-Switches
   * Zeigt geografisches Interesse und Internationalisierungs-Bedarf
   */
  countryChanged: (from: string, to: string) => {
    track('country_changed', { 
      from, 
      to,
      timestamp: new Date().toISOString() 
    });
  },

  /**
   * Track Suche (falls implementiert)
   * Zeigt fehlende Keywords und Content-Lücken
   */
  searchPerformed: (query: string, resultsCount: number, category?: string) => {
    track('search_performed', { 
      query: query.toLowerCase(), 
      results: resultsCount,
      category: category || 'all' 
    });
  },

  /**
   * Track externe Links (z.B. zu Amazon)
   * Unterscheidet zwischen verschiedenen Link-Typen
   */
  externalLink: (url: string, linkType: 'affiliate' | 'info' | 'other') => {
    track('external_link', { 
      url: new URL(url).hostname, // Nur Domain, keine sensiblen Daten
      type: linkType 
    });
  },

  /**
   * Track Navigation
   * Zeigt User-Journey und wichtige Pfade
   */
  navigation: (from: string, to: string, method: 'click' | 'breadcrumb' | 'menu') => {
    track('navigation', { 
      from, 
      to, 
      method 
    });
  },

  /**
   * Track Theme-Wechsel
   * Zeigt Präferenz für Dark/Light Mode
   */
  themeChanged: (theme: 'light' | 'dark' | 'system') => {
    track('theme_changed', { theme });
  },
};

/**
 * User-Journey Tracking
 * Trackt den kompletten Pfad eines Nutzers
 */
export const trackJourney = {
  /**
   * Landing Page
   */
  landing: (page: string, referrer: string) => {
    track('journey_landing', { 
      page, 
      referrer: referrer || 'direct' 
    });
  },

  /**
   * Conversion (Affiliate-Klick)
   */
  conversion: (product: string, value: number, journey: string[]) => {
    track('journey_conversion', { 
      product, 
      value,
      steps: journey.length,
      path: journey.join(' → ') 
    });
  },
};

/**
 * Performance Tracking
 * Kombiniert mit Speed Insights für vollständiges Bild
 */
export const trackPerformance = {
  /**
   * Track langsame Interaktionen
   */
  slowInteraction: (interaction: string, duration: number) => {
    if (duration > 100) { // Nur wenn > 100ms
      track('slow_interaction', { 
        interaction, 
        duration 
      });
    }
  },

  /**
   * Track Fehler
   */
  error: (error: string, component: string) => {
    track('error', { 
      error, 
      component 
    });
  },
};

/**
 * Engagement Tracking
 */
export const trackEngagement = {
  /**
   * Track Zeit auf Seite (bei Verlassen)
   */
  timeOnPage: (page: string, seconds: number) => {
    if (seconds > 5) { // Nur wenn > 5 Sekunden
      track('time_on_page', { 
        page, 
        seconds,
        bucket: getTimeBucket(seconds) 
      });
    }
  },

  /**
   * Track Scroll-Tiefe
   */
  scrollDepth: (page: string, percentage: number) => {
    if (percentage >= 25) { // Nur bei signifikantem Scroll
      track('scroll_depth', { 
        page, 
        percentage: Math.round(percentage / 25) * 25 // Runde auf 25, 50, 75, 100
      });
    }
  },

  /**
   * Track Wiederkehrende Besucher
   */
  returningVisitor: (visitCount: number) => {
    track('returning_visitor', { 
      visit_count: visitCount 
    });
  },
};

/**
 * Helper Functions
 */

function getTimeBucket(seconds: number): string {
  if (seconds < 30) return '0-30s';
  if (seconds < 60) return '30-60s';
  if (seconds < 180) return '1-3min';
  if (seconds < 300) return '3-5min';
  return '5min+';
}

/**
 * Batch Tracking
 * Für Performance-Optimierung bei vielen Events
 */
class AnalyticsBatcher {
  private queue: Array<{ event: string; data: any }> = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 2000; // 2 Sekunden

  add(event: string, data: any) {
    this.queue.push({ event, data });

    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.BATCH_DELAY);
    }
  }

  private flush() {
    if (this.queue.length === 0) return;

    // Sende alle Events
    this.queue.forEach(({ event, data }) => {
      track(event, data);
    });

    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const analyticsBatcher = new AnalyticsBatcher();

/**
 * Debug Mode
 * Für lokale Entwicklung
 */
export const setAnalyticsDebug = (enabled: boolean) => {
  if (typeof window !== 'undefined') {
    (window as any).__ANALYTICS_DEBUG__ = enabled;
  }
};

/**
 * Wrapper für track() mit Debug-Logging
 */
export const debugTrack = (event: string, data?: any) => {
  if (typeof window !== 'undefined' && (window as any).__ANALYTICS_DEBUG__) {
    console.log('📊 Analytics Event:', event, data);
  }
  track(event, data);
};
