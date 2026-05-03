export type UnitType = "TB" | "GB" | "W" | "core";
export type CategoryType = "analytical" | "standard";

export type CategorySlug =
  | "pc-komponenten"
  | "computer"
  | "elektroartikel"
  | "electronics"
  | "deals"
  | "festplatten"
  | "arbeitsspeicher"
  | "netzteile"
  | "prozessoren"
  | "grafikkarten"
  | "laufwerke"
  | "ssds"
  | "externe-speicher"
  | "mainboards"
  | "pc-gehaeuse"
  | "cpu-kuehler"
  | "monitore"
  | "tastaturen"
  | "maeuse"
  | "mauspads"
  | "kopfhoerer"
  | "lautsprecher"
  | "mikrofone"
  | "webcams"
  | "wlan-router"
  | "nas-systeme"
  | "dockingstationen"
  | "netzwerk-switches"
  | "netzwerkkarten"
  | "kabel-adapter"
  | "laptop-staender"
  | "usv-anlagen"
  | "kabelmanagement"
  | "monitorhalterungen"
  | "schreibtisch-zubehoer"
  | "gaming-stuehle"
  | "buerostuehle"
  | "stehschreibtische"
  | "tablets"
  | "smartwatches"
  | "tablet-zubehoer"
  | "handy-zubehoer"
  | "gamepad-controller"
  | "vr-brillen"
  | "capture-karten"
  | "smartphones"
  | "fernseher"
  | "notebooks"
  | "spielekonsolen"
  | "soundbars"
  | "drohnen"
  | "digitalkameras"
  | "smartwatch-zubehoer"
  | "haushaltselektronik"
  | "telekommunikation"
  | "hifi-audio"
  | "tv-sat"
  | "drucker-scanner"
  | "staubsauger"
  | "gaming-elektrospielzeug"
  | "espressomaschinen"
  | "kuehlschraenke"
  | "elektrische-zahnbuersten"
  | "waschmaschinen"
  | "multifunktionsdrucker"
  | "geschirrspueler"
  | "systemkameras"
  | "backoefen"
  | "kochfelder"
  | "radios"
  | "waeschetrockner"
  | "kuechenmaschinen"
  | "bartschneider-haarschneider"
  | "av-receiver"
  | "mikrowellen"
  | "dunstabzugshauben"
  | "gefrierschraenke"
  | "herde"
  | "speicherkarten"
  | "elektrowerkzeuge"
  | "akkuschrauber"
  | "bohrmaschinen"
  | "kreissaegen"
  | "schleifmaschinen"
  | "apple-iphone"
  | "samsung-galaxy"
  | "fraesmaschinen"
  | "3d-drucker"
  | "laserdrucker"
  | "fotografie"
  | "kompaktkameras"
  | "videospiele";

export interface FilterGroup {
  label: string;
  field: string;
  type: "checkbox" | "range";
  options?: string[];
}

export interface CategoryData {
  name: string;
  singularName?: string;
  description: string;
  parent?: CategorySlug;
  metaTitle?: string;
  metaDescription?: string;
  categoryType: CategoryType;
  unitType?: UnitType;
  unitLabel?: string;
  hidden?: boolean;
  isFeatured?: boolean;
  popularFilters?: { label: string; params?: string; href?: string }[];
  imageUrl?: string;
  aliases?: string[];
  filterGroups?: FilterGroup[];
}
export interface Category extends CategoryData {
  slug: CategorySlug;
}

export interface CategoryHierarchy<T = Category> {
  parent: T;
  children: T[];
}

export interface CategoryLink {
  name: string;
  slug: CategorySlug;
  icon?: unknown; // Generic icon type to avoid direct dependency on lucide-react in core types
}
