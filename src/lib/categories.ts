import {
  Armchair,
  Battery,
  Cable,
  Camera,
  Cpu,
  Fan,
  Gamepad2,
  Glasses,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  MemoryStick,
  Mic,
  Monitor,
  MonitorCheck,
  MonitorSpeaker,
  Mouse,
  Network,
  Package,
  Phone,
  Printer,
  Router,
  Server,
  Search,
  Smartphone,
  Speaker,
  Tablet,
  Thermometer,
  Tv,
  Usb,
  Video,
  Watch,
  Zap,
  Home,
  type LucideIcon,
} from "lucide-react";
import { BRAND_DOMAIN } from "./site-config";

export type UnitType = "TB" | "GB" | "W" | "core";

/**
 * Category type determines the comparison mode:
 * - "analytical": Price-per-unit calculation (e.g., $/TB, $/GB, $/W)
 * - "standard": Regular price comparison without unit metrics
 */
export type CategoryType = "analytical" | "standard";

export type CategorySlug =
  | "pc-komponenten"
  | "computer"
  | "elektroartikel"
  | "electronics"
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
  | "kompaktkameras";

export interface FilterGroup {
  label: string;
  field: string;
  type: "checkbox" | "range";
  options?: string[]; // Hardcoded options if needed
}

export interface Category {
  name: string;
  slug: CategorySlug;
  description: string;
  icon: LucideIcon;
  parent?: CategorySlug; // Parent category slug
  metaTitle?: string;
  metaDescription?: string;
  /** Category comparison type */
  categoryType: CategoryType;
  /** Unit for price-per-unit calculation (only for analytical categories) */
  unitType?: UnitType;
  /** Display label for unit (e.g., "per TB", "per GB") */
  unitLabel?: string;
  hidden?: boolean;
  isFeatured?: boolean; // Show in popular categories on homepage
  popularFilters?: { label: string; params?: string; href?: string }[];
  imageUrl?: string;
  aliases?: string[]; // SEO and URL aliases
  /** Tailwind filter groups for this category */
  filterGroups?: FilterGroup[];
}

export interface CategoryHierarchy {
  parent: Category;
  children: Category[];
}

// Internal base categories object to derive slugs from
const CATEGORY_MAP: Record<CategorySlug, Omit<Category, "slug">> = {
  // Parent Category
  haushaltselektronik: {
    name: "Haushaltselektronik",
    description: "Kühlschränke, Waschmaschinen und Küchengeräte",
    icon: Home,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/household-electronics.jpg",
    hidden: true,
    popularFilters: [
      { label: "Kühlschränke", href: "/kuehlschraenke" },
      { label: "Waschmaschinen", href: "/waschmaschinen" },
      { label: "Espressomaschinen", href: "/espressomaschinen" },
      { label: "Staubsauger", href: "/staubsauger" },
      { label: "Backöfen", href: "/backoefen" },
    ],
  },

  computer: {
    name: "Computer",
    description: "Notebooks, Monitore, Tablets und Zubehör",
    icon: Laptop,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/pc-case.jpg",
    popularFilters: [
      { label: "PC-Komponenten", href: "/pc-komponenten" },
      { label: "Notebooks", href: "/notebooks" },
      { label: "Tablets", href: "/tablets" },
      { label: "Tastaturen", href: "/keyboards" },
      { label: "Grafikkarten", href: "/gpu" },
    ],
    metaTitle: `Computer & Zubehör Preisvergleich | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Preise für Laptops, Monitore und Computer-Zubehör.",
  },

  telekommunikation: {
    name: "Telekommunikation",
    description: "Smartphones, Smartwatches und Zubehör",
    icon: Phone,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/smartphone.jpg",
    popularFilters: [
      { label: "Handys & Smartphones", href: "/smartphones" },
      { label: "Apple iPhone", href: "/smartphones?brand=Apple" },
      { label: "Samsung Galaxy", href: "/smartphones?brand=Samsung" },
      { label: "Google Pixel", href: "/smartphones?brand=Google" },
      { label: "Xiaomi", href: "/smartphones?brand=Xiaomi" },
      { label: "Smartwatches", href: "/smartwatches" },
    ],
  },
  "apple-iphone": {
    name: "Apple iPhone",
    description: "Alle iPhone Modelle im Preisvergleich",
    icon: Smartphone,
    parent: "telekommunikation",
    categoryType: "standard",
    imageUrl: "/images/category/iphone.jpg",
    popularFilters: [
      { label: "iPhone 15", params: "model=iphone-15" },
      { label: "iPhone 15 Pro", params: "model=iphone-15-pro" },
      { label: "iPhone 14", params: "model=iphone-14" },
    ],
  },
  "samsung-galaxy": {
    name: "Samsung Galaxy",
    description: "Galaxy S, Z und A Serie",
    icon: Smartphone,
    parent: "telekommunikation",
    categoryType: "standard",
    imageUrl: "/images/category/galaxy.jpg",
    popularFilters: [
      { label: "Galaxy S24", params: "model=s24" },
      { label: "Galaxy Z Fold", params: "series=z-fold" },
      { label: "Galaxy A55", params: "model=a55" },
    ],
  },

  "hifi-audio": {
    name: "HiFi & Audio",
    description: "Kopfhörer, Lautsprecher und Soundbars",
    icon: Speaker,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/headphone.jpg",
    popularFilters: [
      { label: "Receiver", href: "/receiver" },
      { label: "Kopfhörer", href: "/headphones" },
      { label: "Lautsprecher", href: "/speakers" },
      { label: "Soundbars", href: "/soundbars" },
      { label: "Radios", href: "/radios" },
    ],
  },

  "tv-sat": {
    name: "TV & Sat",
    description: "Fernseher, Heimkino und Zubehör",
    icon: Tv,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/tv.jpg",
    popularFilters: [
      { label: "Fernseher", href: "/tvs" },
      { label: "Soundbars", href: "/soundbars" },
      { label: "Receiver", href: "/receiver" },
    ],
  },
  fotografie: {
    name: "Fotografie",
    description: "Kameras, Objektive und Zubehör",
    icon: Camera,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/camera.jpg",
    popularFilters: [
      { label: "Systemkameras", href: "/systemkameras" },
      { label: "Digitalkameras", href: "/cameras" },
      { label: "Kompaktkameras", href: "/kompaktkameras" },
      { label: "Speicherkarten", href: "/speicherkarten" },
    ],
  },

  "drucker-scanner": {
    name: "Drucker & Scanner",
    description: "Multifunktionsdrucker, Tinte und Toner",
    icon: Printer,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/printer.jpg",
    popularFilters: [
      { label: "Multifunktionsdrucker", href: "/multifunktionsdrucker" },
      { label: "Laserdrucker", href: "/laserdrucker" },
      { label: "3D-Drucker", href: "/3d-drucker" },
    ],
  },

  "gaming-elektrospielzeug": {
    name: "Gaming & Elektrospielzeug",
    description: "Konsolen, Drohnen und E-Spielzeuge",
    icon: Gamepad2,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/drone.jpg",
    popularFilters: [
      { label: "Spielekonsolen", href: "/consoles" },
      { label: "Drohnen", href: "/drones" },
      { label: "VR-Brillen", href: "/vr-headsets" },
      { label: "Gaming-Stühle", href: "/gaming-chairs" },
      { label: "Game-Controller", href: "/game-controllers" },
    ],
  },

  elektroartikel: {
    name: "Elektroartikel",
    description: "Smartphones, TVs, Kopfhörer und Wearables",
    icon: Smartphone,
    categoryType: "standard",
    metaTitle: `Elektroartikel & Multimedia Preisvergleich | ${BRAND_DOMAIN}`,
    metaDescription:
      "Top-Angebote für Smartphones, Fernseher und Unterhaltungselektronik.",
  },

  electronics: {
    name: "Elektronik",
    description: "Hardware, Computer & Multimedia",
    icon: HardDrive,
    hidden: true,
    categoryType: "standard",
  },

  tvs: {
    name: "Fernseher",
    description: "OLED, QLED und Smart TVs",
    icon: Tv,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/tv.jpg",
    popularFilters: [
      { label: "55 Zoll", params: "size=55" },
      { label: "65 Zoll", params: "size=65" },
      { label: "OLED", params: "panel=oled" },
      { label: "Samsung", params: "brand=Samsung" },
      { label: "LG", params: "brand=LG" },
    ],
  },

  staubsauger: {
    name: "Staubsauger",
    description: "Akku-Staubsauger und Saugroboter",
    icon: Fan,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/vacuum-cleaner.jpg",
    hidden: true,
    popularFilters: [
      { label: "Dyson", params: "brand=Dyson" },
      { label: "Saugroboter", params: "type=robot" },
      { label: "Akku-Staubsauger", params: "type=cordless" },
      { label: "Miele", params: "brand=Miele" },
    ],
  },

  headphones: {
    name: "Kopfhörer",
    description: "In-Ear, Over-Ear und Bluetooth Kopfhörer",
    icon: Headphones,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/headphone.jpg",
    popularFilters: [
      { label: "Apple", params: "brand=Apple" },
      { label: "Bluetooth", params: "type=bluetooth" },
      { label: "Noise-Cancelling", params: "features=anc" },
      { label: "In-Ear", params: "type=in-ear" },
    ],
  },

  notebooks: {
    name: "Notebooks",
    description: "Laptops, MacBooks und Convertibles",
    icon: Laptop,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/notebook.jpg",
    popularFilters: [
      { label: "Apple MacBook", params: "brand=Apple" },
      { label: "Gaming Laptops", params: "type=gaming" },
      { label: "16 GB RAM", params: "ram=16" },
      { label: "Intel Core Ultra", params: "cpu=intel-ultra" },
    ],
  },

  tablets: {
    name: "Tablets",
    description: "iPads und Android Tablets",
    icon: Tablet,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/tablet.jpg",
    popularFilters: [
      { label: "Apple iPad", params: "brand=Apple" },
      { label: "Samsung Galaxy Tab", params: "brand=Samsung" },
      { label: "Android-Tablet", params: "os=android" },
      { label: "5G-Tablet", params: "connectivity=5g" },
    ],
  },

  espressomaschinen: {
    name: "Espressomaschinen",
    description: "Kaffeevollautomaten und Siebträgermaschinen",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/espresso-machine.jpg",
    hidden: true,
    popularFilters: [
      { label: "Kaffeevollautomat", params: "type=fully-automatic" },
      { label: "Siebträgermaschine", params: "type=portafilter" },
      { label: "De'Longhi", params: "brand=delonghi" },
      { label: "Siemens EQ.6", params: "model=eq6" },
    ],
  },

  monitors: {
    name: "Monitore",
    description: "Gaming und Office Monitore",
    icon: Monitor,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/monitor.jpg",
    popularFilters: [
      { label: "27 Zoll", params: "size=27" },
      { label: "144 Hz", params: "refresh=144" },
      { label: "4K Monitor", params: "resolution=4k" },
      { label: "Gaming Monitor", params: "type=gaming" },
    ],
  },

  speakers: {
    name: "Lautsprecher",
    description: "Bluetooth, Regal und Standlautsprecher",
    icon: Speaker,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/speakers.jpg",
    popularFilters: [
      { label: "JBL", params: "brand=jbl" },
      { label: "Sonos", params: "brand=sonos" },
      { label: "Bluetooth Lautsprecher", params: "type=bluetooth" },
      { label: "Subwoofer", params: "type=subwoofer" },
    ],
  },

  kuehlschraenke: {
    name: "Kühlschränke",
    description: "Kühl-Gefrierkombinationen und Side-by-Side",
    icon: Thermometer,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/refrigerator.jpg",
    hidden: true,
    popularFilters: [
      { label: "Bosch", params: "brand=bosch" },
      { label: "Liebherr", params: "brand=liebherr" },
      { label: "Einbaukühlschrank", params: "type=built-in" },
      { label: "Side-by-Side", params: "type=side-by-side" },
    ],
  },

  "elektrische-zahnbuersten": {
    name: "Elektrische Zahnbürsten",
    description: "Schall- und oszillierende Zahnbürsten",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/electric-toothbrush.jpg",
    hidden: true,
    popularFilters: [
      { label: "Oral-B iO", params: "model=io" },
      { label: "Philips Sonicare", params: "model=sonicare" },
      { label: "Schallzahnbürste", params: "type=sonic" },
    ],
  },

  waschmaschinen: {
    name: "Waschmaschinen",
    description: "Frontlader und Toplader",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/washing-machine.jpg",
    hidden: true,
    popularFilters: [
      { label: "Miele", params: "brand=miele" },
      { label: "Bosch", params: "brand=bosch" },
      { label: "9 kg", params: "capacity=9" },
      { label: "Frontlader", params: "type=front-loader" },
    ],
  },

  multifunktionsdrucker: {
    name: "Multifunktionsdrucker",
    description: "Drucken, Scannen und Kopieren",
    icon: Printer,
    parent: "drucker-scanner",
    categoryType: "standard",
    imageUrl: "/images/category/printer.jpg",
    popularFilters: [
      { label: "Canon", params: "brand=Canon" },
      { label: "HP", params: "brand=HP" },
      { label: "EcoTank", params: "series=ecotank" },
    ],
  },

  geschirrspueler: {
    name: "Geschirrspüler",
    description: "Einbau- und Standgeschirrspüler",
    icon: HardDrive,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/dishwasher.jpg",
    hidden: true,
    popularFilters: [
      { label: "Bosch", params: "brand=Bosch" },
      { label: "Miele", params: "brand=Miele" },
      { label: "Vollintegriert", params: "type=integrated" },
    ],
  },

  routers: {
    name: "Router",
    description: "WLAN & Internet Router",
    icon: Router,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/router.jpg",
    popularFilters: [
      { label: "AVM Fritz!Box", params: "brand=AVM" },
      { label: "WiFi 6", params: "standard=wifi-6" },
      { label: "TP-Link", params: "brand=TP-Link" },
    ],
  },

  systemkameras: {
    name: "Systemkameras",
    description: "Spiegellose Profikameras",
    icon: Camera,
    parent: "fotografie",
    categoryType: "standard",
    imageUrl: "/images/category/camera.jpg",
    popularFilters: [
      { label: "Nikon", params: "brand=Nikon" },
      { label: "Sony", params: "brand=Sony" },
      { label: "Panasonic", params: "brand=Panasonic" },
      { label: "Fujifilm", params: "brand=Fujifilm" },
      { label: "Vollformat", params: "sensor=Full+Frame" },
      { label: "APS-C", params: "sensor=APS-C" },
    ],
  },

  backoefen: {
    name: "Backöfen",
    description: "Einbaubacköfen und Sets",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/oven.jpg",
    hidden: true,
    popularFilters: [
      { label: "Bosch", params: "brand=Bosch" },
      { label: "Siemens", params: "brand=Siemens" },
      { label: "Pyrolyse", params: "features=pyrolysis" },
    ],
  },

  kochfelder: {
    name: "Kochfelder",
    description: "Induktion, Ceran und Gas",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/cooktop.jpg",
    hidden: true,
    popularFilters: [
      { label: "Induktion", params: "type=induction" },
      { label: "Kochfeldabzug", params: "features=extractor" },
      { label: "80 cm breit", params: "width=80" },
    ],
  },

  soundbars: {
    name: "Soundbars",
    description: "Heimkino-Soundsysteme",
    icon: Speaker,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/soundbar.jpg",
    popularFilters: [
      { label: "Sonos", params: "brand=Sonos" },
      { label: "Samsung", params: "brand=Samsung" },
      { label: "Dolby Atmos", params: "features=atmos" },
    ],
  },

  radios: {
    name: "Radios",
    description: "DAB+, Internet- und Kurbelradios",
    icon: Mic,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/radio.jpg",
    popularFilters: [
      { label: "DAB+", params: "type=dab-plus" },
      { label: "Internetradio", params: "type=internet" },
      { label: "TechniSat", params: "brand=TechniSat" },
    ],
  },

  waeschetrockner: {
    name: "Wäschetrockner",
    description: "Wärmepumpen- und Kondenstrockner",
    icon: Fan,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/clothes-dryer.jpg",
    hidden: true,
    popularFilters: [
      { label: "Wärmepumpentrockner", params: "type=heat-pump" },
      { label: "Miele", params: "brand=Miele" },
      { label: "AEG", params: "brand=AEG" },
    ],
  },

  kuechenmaschinen: {
    name: "Küchenmaschinen",
    description: "Knet- und Multifunktionsmaschinen",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/kitchen-machine.jpg",
    hidden: true,
    popularFilters: [
      { label: "KitchenAid", params: "brand=KitchenAid" },
      { label: "Bosch MUM", params: "series=mum" },
      { label: "Thermomix", params: "brand=Vorwerk" },
    ],
  },

  "bartschneider-haarschneider": {
    name: "Bartschneider & Haarschneider",
    description: "Haarpflege für Männer",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/beard-trimmer.jpg",
    hidden: true,
    popularFilters: [
      { label: "Philips OneBlade", params: "model=oneblade" },
      { label: "Braun", params: "brand=Braun" },
      { label: "Haarschneider", params: "type=hair" },
    ],
  },

  receiver: {
    name: "Receiver",
    description: "AV-Receiver und Verstärker",
    icon: Speaker,
    parent: "elektroartikel",
    categoryType: "standard",
    popularFilters: [
      { label: "AV-Receiver", params: "type=av" },
      { label: "Yamaha", params: "brand=Yamaha" },
      { label: "Denon", params: "brand=Denon" },
      { label: "Marantz", params: "brand=Marantz" },
      { label: "7.2 Kanal", params: "channels=7.2" },
    ],
  },

  mikrowellen: {
    name: "Mikrowellen",
    description: "Stand- und Einbaumikrowellen",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/microwave.jpg",
    hidden: true,
    popularFilters: [
      { label: "Einbau-Mikrowelle", params: "type=built-in" },
      { label: "Samsung", params: "brand=Samsung" },
    ],
  },

  dunstabzugshauben: {
    name: "Dunstabzugshauben",
    description: "Wand-, Insel- und Unterbauhauben",
    icon: Fan,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/cooker-hood.jpg",
    hidden: true,
    popularFilters: [
      { label: "Kopffreihaube", params: "type=angled" },
      { label: "60 cm breit", params: "width=60" },
    ],
  },

  "hard-drives": {
    name: "Festplatten",
    description: "HDD Speicherlösungen",
    icon: HardDrive,
    parent: "elektroartikel",
    categoryType: "analytical",
    imageUrl: "/images/category/hdd.jpg",
    unitType: "TB",
    unitLabel: "pro TB",
    popularFilters: [
      { label: "4 TB", params: "capacity=4" },
      { label: "NAS-Festplatte", params: "type=nas" },
    ],
  },

  gefrierschraenke: {
    name: "Gefrierschränke",
    description: "Gefrierschränke und Truhen",
    icon: Thermometer,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/freezer.jpg",
    hidden: true,
    popularFilters: [
      { label: "Liebherr", params: "brand=Liebherr" },
      { label: "NoFrost", params: "features=nofrost" },
    ],
  },

  herde: {
    name: "Herde",
    description: "Stand- und Einbauherde",
    icon: Zap,
    parent: "elektroartikel",
    categoryType: "standard",
    imageUrl: "/images/category/stove.jpg",
    hidden: true,
    popularFilters: [
      { label: "Induktionsherd", params: "type=induction" },
      { label: "Herd-Set", params: "type=set" },
    ],
  },

  drones: {
    name: "Drohnen",
    description: "Kameradrohnen und Quadcopters",
    icon: Camera,
    parent: "gaming-elektrospielzeug",
    categoryType: "standard",
    imageUrl: "/images/category/drone.jpg",
    popularFilters: [
      { label: "DJI Mini", params: "series=mini" },
      { label: "4K Kamera", params: "resolution=4k" },
    ],
  },

  nas: {
    name: "NAS-Server",
    description: "Netzwerkspeicher für zuhause",
    icon: Server,
    parent: "elektroartikel",
    categoryType: "standard",
    popularFilters: [
      { label: "Synology", params: "brand=Synology" },
      { label: "4-Bay NAS", params: "bays=4" },
    ],
  },

  // --- PC-KOMPONENTEN (Hardware focus) ---
  "pc-komponenten": {
    name: "PC-Komponenten",
    description: "Hardware für Ihren PC",
    icon: Cpu,
    parent: "computer",
    categoryType: "standard",
    imageUrl: "/images/category/festplatten-&-ssds.jpg",
    popularFilters: [
      { label: "Grafikkarten", href: "/gpu" },
      { label: "Laufwerke", href: "/storage" },
      { label: "RAM", href: "/ram" },
      { label: "CPU", href: "/cpu" },
      { label: "PC-Gehäuse", href: "/pc-cases" },
    ],
  },
  gpu: {
    name: "Grafikkarten",
    description: "NVIDIA, AMD & Intel GPUs vergleichen",
    icon: Video,
    parent: "pc-komponenten",
    categoryType: "analytical",
    unitType: "GB",
    unitLabel: "pro GB VRAM",
    popularFilters: [
      { label: "RTX 4070", params: "model=RTX+4070" },
      { label: "RTX 4080", params: "model=RTX+4080" },
      { label: "RX 7800 XT", params: "model=RX+7800+XT" },
    ],
  },
  motherboards: {
    name: "Mainboards",
    description: "Motherboards für Intel & AMD",
    icon: Server,
    parent: "pc-komponenten",
    categoryType: "standard",
    imageUrl: "/images/category/mainboard.jpg",
    popularFilters: [
      { label: "AM5 Mainboards", params: "socket=AM5" },
      { label: "LGA 1700", params: "socket=LGA1700" },
      { label: "B650 Chipsatz", params: "chipset=B650" },
    ],
  },
  ram: {
    name: "Arbeitsspeicher",
    description: "DDR4 & DDR5 RAM Module",
    icon: MemoryStick,
    parent: "pc-komponenten",
    categoryType: "analytical",
    unitType: "GB",
    unitLabel: "pro GB",
    popularFilters: [
      { label: "DDR5 RAM", params: "type=DDR5" },
      { label: "32GB Kits", params: "capacity=32" },
      { label: "6000 MHz", params: "speed=6000" },
    ],
  },
  "pc-cases": {
    name: "PC-Gehäuse",
    description: "Computergehäuse für Ihren Build",
    icon: Server,
    parent: "pc-komponenten",
    categoryType: "standard",
    imageUrl: "/images/category/pc-case.jpg",
    popularFilters: [
      { label: "Midi-Tower", params: "type=midi-tower" },
      { label: "Big-Tower", params: "type=big-tower" },
      { label: "Mini-ITX Gehäuse", params: "type=mini-itx" },
    ],
  },
  "power-supplies": {
    name: "Netzteile",
    description: "Effiziente Stromversorgung",
    icon: Zap,
    parent: "pc-komponenten",
    categoryType: "analytical",
    imageUrl: "/images/category/power-supply.jpg",
    unitType: "W",
    unitLabel: "pro Watt",
    popularFilters: [
      { label: "80 PLUS Gold", params: "efficiency=gold" },
      { label: "750 Watt", params: "wattage=750" },
      { label: "Vollmodular", params: "modularity=full" },
    ],
  },
  "cpu-coolers": {
    name: "CPU-Kühler",
    description: "Luft- & Wasserkühlung",
    icon: Fan,
    parent: "pc-komponenten",
    categoryType: "standard",
    imageUrl: "/images/category/cpu-cooler.jpg",
    popularFilters: [
      { label: "Luftkühler", params: "type=air" },
      { label: "Wasserkühlung (AiO)", params: "type=aio" },
    ],
  },
  storage: {
    name: "Laufwerke",
    description: "Interne & externe Speicherlösungen",
    icon: HardDrive,
    parent: "pc-komponenten",
    categoryType: "standard",
    imageUrl: "images/category/ssd.jpg",
    popularFilters: [
      { label: "SSDs", href: "/ssds" },
      { label: "Festplatten (HDD)", params: "type=hdd" },
      { label: "Externe Festplatten", href: "/external-storage" },
    ],
  },
  ssds: {
    name: "SSDs",
    description: "Schnelle Solid State Drives",
    icon: HardDrive,
    parent: "elektroartikel",
    categoryType: "analytical",
    imageUrl: "/images/category/ssd.jpg",
    unitType: "TB",
    unitLabel: "pro TB",
    popularFilters: [
      { label: "M.2 SSDs (NVMe)", params: "interface=m2-nvme" },
      { label: "SATA SSDs", params: "interface=sata" },
      { label: "PS5 SSDs", params: "compatible=ps5" },
    ],
  },

  "smartwatch-accessories": {
    name: "Smartwatch-Zubehör",
    description: "Bänder & Ladestationen",
    icon: Watch,
    parent: "telekommunikation",
    categoryType: "standard",
    imageUrl: "/images/category/smartwatch-accessories.jpg",
  },

  smartphones: {
    name: "Smartphones",
    description: "Handys & Smartphones",
    icon: Smartphone,
    parent: "telekommunikation",
    categoryType: "standard",
    imageUrl: "/images/category/smartphone.jpg",
    popularFilters: [
      { label: "iPhone", params: "brand=Apple" },
      { label: "Samsung Galaxy", params: "brand=Samsung" },
    ],
  },

  smartwatches: {
    name: "Smartwatches",
    description: "Wearables & Watches",
    icon: Watch,
    parent: "telekommunikation",
    categoryType: "standard",
    imageUrl: "/images/category/smartwatch.jpg",
  },

  consoles: {
    name: "Spielekonsolen",
    description: "PS5, Xbox, Switch",
    icon: Gamepad2,
    parent: "gaming-elektrospielzeug",
    categoryType: "standard",
    imageUrl: "/images/category/console.jpg",
    popularFilters: [
      { label: "Spielekonsolen", href: "/consoles" },
      { label: "Drohnen", href: "/drones" },
      { label: "VR-Brillen", href: "/vr-headsets" },
      { label: "Gaming-Stühle", href: "/gaming-chairs" },
      { label: "Game-Controller", href: "/game-controllers" },
    ],
  },

  cameras: {
    name: "Digitalkameras",
    description: "Kameras & Optik",
    icon: Camera,
    parent: "fotografie",
    categoryType: "standard",
    imageUrl: "/images/category/camera.jpg",
    popularFilters: [
      { label: "Canon", params: "brand=Canon" },
      { label: "Fujifilm", params: "brand=Fujifilm" },
      { label: "Sony", params: "brand=Sony" },
      { label: "Nikon", params: "brand=Nikon" },
      { label: "Vollformat", params: "sensor=Full+Frame" },
    ],
  },

  keyboards: {
    name: "Tastaturen",
    description: "Keyboards & Eingabegeräte",
    icon: Keyboard,
    parent: "computer",
    categoryType: "standard",
    imageUrl: "/images/category/keyboard.jpg",
  },

  mice: {
    name: "Mäuse",
    description: "Präzisionsmäuse",
    icon: Mouse,
    parent: "computer",
    categoryType: "standard",
    imageUrl: "/images/category/mouse.jpg",
  },

  "mouse-pads": {
    name: "Mauspads",
    description: "Unterlagen",
    icon: Mouse,
    parent: "computer",
    categoryType: "standard",
    imageUrl: "/images/category/mouse-pad.jpg",
  },

  "external-storage": {
    name: "Externe Speicher",
    description: "Portable HDDs & SSDs",
    icon: HardDrive,
    parent: "storage",
    categoryType: "analytical",
    unitType: "TB",
    unitLabel: "pro TB",
    imageUrl: "/images/category/external-storage.jpg",
  },

  speicherkarten: {
    name: "Speicherkarten",
    description: "SD, microSD & CFexpress",
    icon: MemoryStick,
    parent: "fotografie",
    categoryType: "analytical",
    imageUrl: "/images/category/sd-card.jpg",
    unitType: "GB",
    unitLabel: "pro GB",
    popularFilters: [
      { label: "microSDXC", params: "form=microSDXC" },
      { label: "SanDisk", params: "brand=SanDisk" },
      { label: "Samsung", params: "brand=Samsung" },
    ],
  },

  "docking-stations": {
    name: "Docking-Stationen",
    description: "Laptop-Docks",
    icon: Usb,
    parent: "computer",
    categoryType: "standard",
    imageUrl: "/images/category/docking-station.jpg",
  },

  "network-switches": {
    name: "Netzwerk-Switches",
    description: "Ethernet-Verteiler",
    icon: Network,
    parent: "computer",
    categoryType: "standard",
    imageUrl: "/images/category/network-switch.jpg",
  },

  "network-cards": {
    name: "Netzwerkkarten",
    description: "WLAN-Karten",
    icon: Network,
    parent: "computer",
    categoryType: "standard",
  },

  cables: {
    name: "Kabel & Adapter",
    description: "Verbindungen",
    icon: Cable,
    parent: "computer",
    categoryType: "standard",
  },

  "laptop-stands": {
    name: "Laptop-Ständer",
    description: "Halterungen",
    icon: Laptop,
    parent: "computer",
    categoryType: "standard",
  },

  ups: {
    name: "USV",
    description: "Notstrom",
    icon: Battery,
    parent: "computer",
    categoryType: "standard",
  },

  "cable-management": {
    name: "Kabelmanagement",
    description: "Ordnung",
    icon: Cable,
    parent: "computer",
    categoryType: "standard",
  },

  "monitor-arms": {
    name: "Monitorhalterungen",
    description: "Arme & Halter",
    icon: MonitorCheck,
    parent: "computer",
    categoryType: "standard",
  },

  "desk-accessories": {
    name: "Schreibtisch-Zubehör",
    description: "Ordnung am Tisch",
    icon: Package,
    parent: "computer",
    categoryType: "standard",
  },

  "office-chairs": {
    name: "Bürostühle",
    description: "Ergonomie",
    icon: Armchair,
    parent: "computer",
    categoryType: "standard",
  },

  "standing-desks": {
    name: "Stehschreibtische",
    description: "Höhenverstellbar",
    icon: Monitor,
    parent: "computer",
    categoryType: "standard",
  },

  "tablet-accessories": {
    name: "Tablet-Zubehör",
    description: "Hüllen & Stifte",
    icon: Tablet,
    parent: "computer",
    categoryType: "standard",
  },

  "phone-accessories": {
    name: "Handy-Zubehör",
    description: "Schutz & Power",
    icon: Smartphone,
    parent: "telekommunikation",
    categoryType: "standard",
  },

  "game-controllers": {
    name: "Game-Controller",
    description: "Gamepads",
    icon: Gamepad2,
    parent: "gaming-elektrospielzeug",
    categoryType: "standard",
    imageUrl: "/images/category/game-controller.jpg",
  },

  "vr-headsets": {
    name: "VR-Brillen",
    description: "Virtual Reality",
    icon: Glasses,
    parent: "gaming-elektrospielzeug",
    categoryType: "standard",
    imageUrl: "/images/category/vr-glasses.jpg",
    popularFilters: [
      { label: "Meta Quest", params: "series=quest" },
      { label: "PlayStation VR2", params: "platform=ps5" },
    ],
  },

  microphones: {
    name: "Mikrofone",
    description: "Audio-Aufnahme",
    icon: Mic,
    parent: "hifi-audio",
    categoryType: "standard",
  },

  "gaming-chairs": {
    name: "Gaming-Stühle",
    description: "Zocker-Sessel",
    icon: Armchair,
    parent: "gaming-elektrospielzeug",
    categoryType: "standard",
    imageUrl: "/images/category/gaming-chair.jpg",
    popularFilters: [
      { label: "Secretlab", params: "brand=Secretlab" },
      { label: "Noblechairs", params: "brand=Noblechairs" },
      { label: "Stoffbezug", params: "material=fabric" },
    ],
  },

  webcams: {
    name: "Webcams",
    description: "Videokonferenz",
    icon: Camera,
    parent: "computer",
    categoryType: "standard",
  },

  "capture-cards": {
    name: "Capture-Karten",
    description: "Streaming-Hardware",
    icon: Video,
    parent: "computer",
    categoryType: "standard",
  },

  cpu: {
    name: "Prozessoren",
    description: "CPUs von Intel & AMD",
    icon: Cpu,
    parent: "pc-komponenten",
    categoryType: "analytical",
    unitType: "core",
    unitLabel: "pro Kern",
    popularFilters: [
      { label: "Sockel AM5", params: "socket=AM5" },
      { label: "Sockel 1700", params: "socket=LGA1700" },
    ],
  },

  // --- Elektrowerkzeuge ---
  elektrowerkzeuge: {
    name: "Elektrowerkzeuge",
    description: "Bohren, Sägen & Schleifen",
    icon: Zap,
    categoryType: "standard",
    imageUrl: "/images/category/power-tools.jpg",
    hidden: true,
  },
  akkuschrauber: {
    name: "Akkuschrauber",
    description: "Kabelloses Schrauben",
    icon: Zap,
    parent: "elektrowerkzeuge",
    categoryType: "standard",
    imageUrl: "/images/category/drill.jpg",
    hidden: true,
    popularFilters: [
      { label: "Makita 18V", params: "series=18v" },
      { label: "Bosch Professional", params: "brand=Bosch+Professional" },
    ],
  },
  bohrmaschinen: {
    name: "Bohrmaschinen",
    description: "Schlag- & Hammerbohrer",
    icon: Zap,
    parent: "elektrowerkzeuge",
    categoryType: "standard",
    imageUrl: "/images/category/hammer-drill.jpg",
    hidden: true,
  },
  kreissaegen: {
    name: "Kreissägen",
    description: "Hand- & Tischkreissägen",
    icon: Zap,
    parent: "elektrowerkzeuge",
    categoryType: "standard",
    imageUrl: "/images/category/circular-saw.jpg",
    hidden: true,
    popularFilters: [
      { label: "Tauchsäge", params: "type=plunge" },
      { label: "Festool", params: "brand=Festool" },
    ],
  },
  schleifmaschinen: {
    name: "Schleifmaschinen",
    description: "Exzenter- & Winkelschleifer",
    icon: Zap,
    parent: "elektrowerkzeuge",
    categoryType: "standard",
    imageUrl: "/images/category/sander.jpg",
    hidden: true,
  },
  fraesmaschinen: {
    name: "Fräsmaschinen",
    description: "Oberfräsen & Kantenfräsen",
    icon: Zap,
    parent: "elektrowerkzeuge",
    categoryType: "standard",
    imageUrl: "/images/category/router-tool.jpg",
    hidden: true,
  },
  "3d-drucker": {
    name: "3D-Drucker",
    description: "3D-Drucker für Hobby und Industrie",
    icon: Printer,
    parent: "drucker-scanner",
    categoryType: "standard",
    imageUrl: "/images/category/3d-printer.jpg",
    popularFilters: [
      { label: "Bambu Lab", params: "brand=Bambu+Lab" },
      { label: "Anycubic", params: "brand=Anycubic" },
      { label: "Creality", params: "brand=Creality" },
      { label: "Mehrfarbdruck", params: "features=multicolor" },
    ],
  },
  laserdrucker: {
    name: "Laserdrucker",
    description: "Schnelle und effiziente Laserdrucker",
    icon: Printer,
    parent: "drucker-scanner",
    categoryType: "standard",
    imageUrl: "/images/category/laser-printer.jpg",
    popularFilters: [
      { label: "HP LaserJet", params: "brand=HP" },
      { label: "Brother", params: "brand=Brother" },
      { label: "Farblaserdrucker", params: "features=color" },
      { label: "WLAN", params: "features=wifi" },
    ],
  },
  kompaktkameras: {
    name: "Kompaktkameras",
    description: "Kleine Kameras für unterwegs",
    icon: Camera,
    parent: "fotografie",
    categoryType: "standard",
    imageUrl: "/images/category/compact-camera.jpg",
    popularFilters: [
      { label: "Sony", params: "brand=Sony" },
      { label: "Canon", params: "brand=Canon" },
      { label: "Panasonic", params: "brand=Panasonic" },
      { label: "Vlogging", params: "type=vlogging" },
    ],
  },
};

// All categories in a flat structure with slug added
export const allCategories: Record<CategorySlug, Category> = Object.entries(
  CATEGORY_MAP,
).reduce(
  (acc, [slug, data]) => {
    acc[slug as CategorySlug] = {
      ...(data as Omit<Category, "slug">),
      slug: slug as CategorySlug,
    } as Category;
    return acc;
  },
  {} as Record<CategorySlug, Category>,
);

// Get category hierarchy (parent with children)
export function getCategoryHierarchy(): CategoryHierarchy[] {
  const hierarchies: CategoryHierarchy[] = [];
  const parents = Object.values(allCategories).filter(
    (cat) => !cat.parent && !cat.hidden,
  );

  parents.forEach((parent) => {
    const children = Object.values(allCategories).filter(
      (cat) => cat.parent === parent.slug && !cat.hidden,
    );
    hierarchies.push({
      parent: stripCategoryIcon(parent) as Category,
      children: children.map(stripCategoryIcon) as Category[],
    });
  });

  return hierarchies;
}

// Get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return allCategories[slug as CategorySlug];
}

// Get parent category for a given category
export function getParentCategory(
  categorySlug: CategorySlug,
): Category | undefined {
  const category = allCategories[categorySlug];
  if (!category?.parent) return undefined;
  return allCategories[category.parent];
}

// Get children of a parent category
export function getChildCategories(parentSlug: CategorySlug): Category[] {
  return Object.values(allCategories).filter(
    (cat) => cat.parent === parentSlug && !cat.hidden,
  );
}

// Get breadcrumb trail for a category
export function getBreadcrumbs(categorySlug: CategorySlug): Category[] {
  const breadcrumbs: Category[] = [];
  let current: Category | undefined = allCategories[categorySlug];

  while (current) {
    breadcrumbs.unshift(current);
    if (current.parent) {
      current = allCategories[current.parent];
    } else {
      current = undefined;
    }
  }

  return breadcrumbs;
}

// Get full URL path for a category
export function getCategoryPath(categorySlug: CategorySlug): string {
  const category = allCategories[categorySlug];
  if (!category) return "/";

  return `/${category.slug}`;
}

// Return a copy of the category without the icon function (for serialization)
export function stripCategoryIcon(category: Category): Omit<Category, "icon"> {
  const { icon, ...rest } = category;
  return JSON.parse(JSON.stringify(rest));
}

/**
 * Check if a category is analytical (price-per-unit)
 */
export function isAnalyticalCategory(category: Category): boolean {
  return category.categoryType === "analytical";
}

/**
 * Get all analytical categories (price-per-unit categories)
 */
export function getAnalyticalCategories(): Category[] {
  return Object.values(allCategories).filter(
    (cat) => cat.categoryType === "analytical" && !cat.hidden,
  );
}

/**
 * Get all categories
 */
export function getAllCategories(): Category[] {
  return Object.values(allCategories);
}

/**
 * Get all standard categories (regular price comparison)
 */
export function getStandardCategories(): Category[] {
  return Object.values(allCategories).filter(
    (cat) => cat.categoryType === "standard" && !cat.hidden,
  );
}
