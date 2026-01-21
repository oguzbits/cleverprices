export type UnitType = "TB" | "GB" | "W" | "core";
export type CategoryType = "analytical" | "standard";

export type CategorySlug =
  | "pc-komponenten"
  | "computer"
  | "elektroartikel"
  | "electronics"
  | "deals"
  | "hard-drives"
  | "ram"
  | "power-supplies"
  | "cpu"
  | "gpu"
  | "storage"
  | "ssds"
  | "external-storage"
  | "motherboards"
  | "pc-cases"
  | "cpu-coolers"
  | "monitors"
  | "keyboards"
  | "mice"
  | "mouse-pads"
  | "headphones"
  | "speakers"
  | "microphones"
  | "webcams"
  | "routers"
  | "nas"
  | "docking-stations"
  | "network-switches"
  | "network-cards"
  | "cables"
  | "laptop-stands"
  | "ups"
  | "cable-management"
  | "monitor-arms"
  | "desk-accessories"
  | "gaming-chairs"
  | "office-chairs"
  | "standing-desks"
  | "tablets"
  | "smartwatches"
  | "tablet-accessories"
  | "phone-accessories"
  | "game-controllers"
  | "vr-headsets"
  | "capture-cards"
  | "smartphones"
  | "tvs"
  | "notebooks"
  | "consoles"
  | "soundbars"
  | "drones"
  | "cameras"
  | "smartwatch-accessories"
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
  | "receiver"
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
  | "games";

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
