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
  MonitorSpeaker,
  Mouse,
  Network,
  Package,
  Router,
  Server,
  Smartphone,
  Speaker,
  Tablet,
  Thermometer,
  Usb,
  Video,
  Watch,
  Zap,
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
  | "electronics"
  // Analytical categories (price-per-unit)
  | "hard-drives"
  | "ram"
  | "power-supplies"
  | "cpu"
  | "gpu"
  | "external-storage"
  // PC Components
  | "pc-cases"
  | "cpu-coolers"
  | "case-fans"
  | "thermal-paste"
  // Peripherals
  | "monitors"
  | "keyboards"
  | "mice"
  | "mouse-pads"
  | "headphones"
  | "speakers"
  | "microphones"
  | "webcams"
  // Networking
  | "routers"
  | "nas"
  | "usb-hubs"
  | "docking-stations"
  | "network-switches"
  | "network-cards"
  // Accessories
  | "cables"
  | "laptop-stands"
  | "ups"
  | "cable-management"
  | "monitor-arms"
  | "desk-accessories"
  // Furniture
  | "gaming-chairs"
  | "office-chairs"
  | "standing-desks"
  // Mobile & Wearables
  | "tablets"
  | "smartwatches"
  | "tablet-accessories"
  | "phone-accessories"
  // Gaming
  | "game-controllers"
  | "vr-headsets"
  | "capture-cards";

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
  popularFilters?: { label: string; params: string }[];
  aliases?: string[]; // SEO and URL aliases
}

export interface CategoryHierarchy {
  parent: Category;
  children: Category[];
}

// Internal base categories object to derive slugs from
const CATEGORY_MAP: Record<CategorySlug, Omit<Category, "slug">> = {
  // Parent Category
  electronics: {
    name: "Elektronik",
    description: "Digitale Speicherlösungen - Preis pro Terabyte vergleichen",
    icon: HardDrive,
    categoryType: "standard", // Parent categories are standard
    metaTitle: `Festplatten & Speicher - Bester Preis pro TB | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Festplatten- und SSD-Preise nach Kosten pro Terabyte. Finden Sie die besten Angebote für Speicher von Samsung, WD, Seagate und Crucial.",
  },

  // Electronics Children (ONLY monetized categories)
  "hard-drives": {
    name: "Festplatten & SSDs",
    description: "HDD- und SSD-Speicherlösungen - Preis pro TB vergleichen",
    icon: HardDrive,
    parent: "electronics",
    categoryType: "analytical",
    unitType: "TB",
    unitLabel: "pro TB",
    metaTitle: `Festplatten & SSDs - Preis pro TB vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Festplatten- und SSD-Angebote durch Preisvergleich pro Terabyte. Vergleichen Sie interne und externe Speicher von Top-Marken.",
    popularFilters: [
      { label: "SSDs", params: "technology=SSD" },
      { label: "HDDs", params: "technology=HDD" },
      { label: "NVMe SSDs", params: "formFactor=M.2+NVMe" },
    ],
    aliases: ["disks", "storage", "hdd", "ssd"],
  },

  ram: {
    name: "Arbeitsspeicher",
    description: "DDR4- und DDR5-RAM-Module - Preis pro GB vergleichen",
    icon: MemoryStick,
    parent: "electronics",
    categoryType: "analytical",
    unitType: "GB",
    unitLabel: "pro GB",
    metaTitle: `Arbeitsspeicher (RAM) - Preis pro GB vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten RAM-Angebote durch Preisvergleich pro Gigabyte. Vergleichen Sie DDR4- und DDR5-Module von Crucial, Lexar und Patriot.",
    popularFilters: [
      { label: "DDR4 RAM", params: "technology=DDR4" },
      { label: "DDR5 RAM", params: "technology=DDR5" },
      { label: "Laptop RAM", params: "formFactor=SO-DIMM" },
    ],
    aliases: ["memory"],
  },

  "power-supplies": {
    name: "Netzteile",
    description: "ATX- und SFX-Netzteile - Preis pro Watt vergleichen",
    icon: Zap,
    parent: "electronics",
    categoryType: "analytical",
    unitType: "W",
    unitLabel: "pro Watt",
    metaTitle: `Netzteile - Preis pro Watt vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Netzteil-Angebote durch Preisvergleich pro Watt. Vergleichen Sie 80+ Bronze, Gold und Platinum PSUs von Top-Marken.",
    popularFilters: [{ label: "80+ Gold", params: "technology=80%2B+Gold" }],
    aliases: ["psu"],
  },

  cpu: {
    name: "Prozessoren",
    description: "Prozessoren nach Kernanzahl und Leistung vergleichen",
    icon: HardDrive,
    parent: "electronics",
    categoryType: "analytical",
    unitType: "core",
    unitLabel: "pro Kern",
    hidden: false, // Unhide when ready to launch
    metaTitle: `Prozessoren (CPUs) - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Preise für Intel- und AMD-Prozessoren. Vergleichen Sie Kernanzahl, Taktfrequenzen und Benchmarks.",
    popularFilters: [
      { label: "Intel Core i7", params: "brand=Intel&series=Core+i7" },
      { label: "AMD Ryzen 7", params: "brand=AMD&series=Ryzen+7" },
    ],
    aliases: ["processors", "chips"],
  },

  gpu: {
    name: "Grafikkarten",
    description: "GPUs nach VRAM und Leistung vergleichen",
    icon: HardDrive,
    parent: "electronics",
    categoryType: "analytical",
    unitType: "GB",
    unitLabel: "pro GB VRAM",
    hidden: false, // Unhide when ready to launch
    metaTitle: `Grafikkarten (GPUs) - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Grafikkarten-Angebote. Vergleichen Sie NVIDIA GeForce und AMD Radeon GPUs nach Preis und Leistung.",
    popularFilters: [
      { label: "NVIDIA RTX 4070", params: "brand=NVIDIA&model=RTX+4070" },
      { label: "12GB+ VRAM", params: "min_memory=12" },
    ],
    aliases: ["video-cards", "vga"],
  },

  // ======================
  // Standard Categories (no price-per-unit)
  // ======================

  monitors: {
    name: "Monitore",
    description:
      "Monitore nach Größe, Auflösung und Bildwiederholrate vergleichen",
    icon: Monitor,
    parent: "electronics",
    categoryType: "standard",
    hidden: false, // Unhide when ready to launch
    metaTitle: `Monitore - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Monitor-Angebote. Vergleichen Sie 4K-, Ultrawide- und Gaming-Monitore von LG, Samsung, Dell und ASUS.",
    popularFilters: [
      { label: "4K Monitore", params: "resolution=4K" },
      { label: "Gaming 144Hz+", params: "refresh_rate=144" },
      { label: "Ultrawide", params: "aspect_ratio=21:9" },
    ],
    aliases: ["displays", "screens"],
  },

  keyboards: {
    name: "Tastaturen",
    description: "Mechanische und Membran-Tastaturen für Gaming und Arbeit",
    icon: Keyboard,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Tastaturen - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Tastatur-Angebote. Vergleichen Sie mechanische, Membran- und kabellose Tastaturen von Logitech, Razer, Corsair und mehr.",
    popularFilters: [
      { label: "Mechanisch", params: "type=mechanical" },
      { label: "Kabellos", params: "connectivity=wireless" },
      { label: "RGB", params: "features=rgb" },
    ],
    aliases: ["tastaturen"],
  },

  mice: {
    name: "Mäuse",
    description: "Gaming- und Produktivitätsmäuse für Präzision und Komfort",
    icon: Mouse,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Computer-Mäuse - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Maus-Angebote. Vergleichen Sie Gaming-Mäuse, ergonomische Mäuse und kabellose Mäuse von Logitech, Razer und SteelSeries.",
    popularFilters: [
      { label: "Gaming-Mäuse", params: "type=gaming" },
      { label: "Kabellos", params: "connectivity=wireless" },
      { label: "Ergonomisch", params: "type=ergonomic" },
    ],
    aliases: ["mäuse", "maus"],
  },

  headphones: {
    name: "Kopfhörer",
    description: "Over-Ear-, In-Ear- und Gaming-Headsets",
    icon: Headphones,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Kopfhörer & Headsets - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Kopfhörer-Angebote. Vergleichen Sie Over-Ear-, In-Ear- und Gaming-Headsets von Sony, Bose, Sennheiser und mehr.",
    popularFilters: [
      { label: "Over-Ear", params: "type=over-ear" },
      { label: "Kabellos", params: "connectivity=wireless" },
      { label: "Gaming-Headsets", params: "type=gaming" },
      { label: "Noise Cancelling", params: "features=anc" },
    ],
    aliases: ["kopfhörer", "headsets"],
  },

  webcams: {
    name: "Webcams",
    description: "HD- und 4K-Webcams für Streaming und Videokonferenzen",
    icon: Camera,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Webcams - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Finden Sie die besten Webcam-Angebote. Vergleichen Sie HD- und 4K-Webcams für Streaming, Videokonferenzen und Content-Erstellung.",
    popularFilters: [
      { label: "4K Webcams", params: "resolution=4K" },
      { label: "1080p", params: "resolution=1080p" },
      { label: "Streaming", params: "type=streaming" },
    ],
    aliases: ["kameras", "webkameras"],
  },

  // ======================
  // Additional Standard Categories
  // ======================

  "external-storage": {
    name: "Externe Speicher",
    description: "Externe Festplatten und tragbare SSDs",
    icon: HardDrive,
    parent: "electronics",
    categoryType: "analytical",
    unitType: "TB",
    unitLabel: "pro TB",
    hidden: false,
    metaTitle: `Externe Speicher - Preis pro TB vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie externe Festplatten und tragbare SSDs nach Preis pro TB. Finden Sie die besten Angebote von WD, Seagate, Samsung und SanDisk.",
    popularFilters: [
      { label: "Portable SSD", params: "type=ssd" },
      { label: "USB-C", params: "interface=usb-c" },
    ],
    aliases: ["externe-festplatten", "portable-ssd"],
  },

  routers: {
    name: "WLAN-Router",
    description: "WiFi-Router und Mesh-Systeme",
    icon: Router,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `WLAN-Router - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie WiFi 6- und WiFi 7-Router von ASUS, TP-Link, Netgear und mehr. Finden Sie die besten Angebote für Mesh-Systeme.",
    popularFilters: [
      { label: "WiFi 6", params: "wifi=6" },
      { label: "WiFi 7", params: "wifi=7" },
      { label: "Mesh-Systeme", params: "type=mesh" },
    ],
    aliases: ["wlan-router", "mesh"],
  },

  nas: {
    name: "NAS-Systeme",
    description: "Netzwerkspeicher für Zuhause und Büro",
    icon: Server,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `NAS-Systeme - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie NAS-Geräte von Synology, QNAP und mehr. Finden Sie die besten Angebote für Home-Server und Medienspeicher.",
    popularFilters: [
      { label: "2-Bay", params: "bays=2" },
      { label: "4-Bay", params: "bays=4" },
      { label: "Synology", params: "brand=Synology" },
    ],
    aliases: ["netzwerkspeicher", "home-server"],
  },

  "usb-hubs": {
    name: "USB-Hubs",
    description: "USB-Hubs und Port-Erweiterungen",
    icon: Usb,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `USB-Hubs - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie USB-C- und USB-A-Hubs. Finden Sie Angebote für aktive Hubs und Docking-Lösungen.",
    popularFilters: [
      { label: "USB-C", params: "type=usb-c" },
      { label: "Aktiv", params: "powered=true" },
    ],
    aliases: ["usb-verteiler"],
  },

  speakers: {
    name: "Lautsprecher",
    description: "PC-Lautsprecher und Audiosysteme",
    icon: Speaker,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `PC-Lautsprecher - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie PC-Lautsprecher, Soundbars und 2.1-Systeme. Finden Sie Angebote von Logitech, Creative und mehr.",
    popularFilters: [
      { label: "2.1-Systeme", params: "type=2.1" },
      { label: "Bluetooth", params: "connectivity=bluetooth" },
    ],
    aliases: ["lautsprecher", "pc-lautsprecher"],
  },

  microphones: {
    name: "Mikrofone",
    description: "USB- und XLR-Mikrofone für Streaming und Podcasting",
    icon: Mic,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Mikrofone - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie USB- und XLR-Mikrofone für Streaming, Gaming und Podcasting. Finden Sie Angebote von Blue, Rode und Shure.",
    popularFilters: [
      { label: "USB-Mikrofone", params: "type=usb" },
      { label: "XLR", params: "type=xlr" },
      { label: "Kondensator", params: "type=condenser" },
    ],
    aliases: ["mikrofone", "streaming-mikrofon"],
  },

  "gaming-chairs": {
    name: "Gaming-Stühle",
    description: "Ergonomische Gaming- und Bürostühle",
    icon: Armchair,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Gaming-Stühle - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Gaming-Stühle von Secretlab, Noblechairs und mehr. Finden Sie ergonomische Stühle für lange Gaming-Sessions.",
    popularFilters: [
      { label: "Secretlab", params: "brand=Secretlab" },
      { label: "Ergonomisch", params: "features=ergonomic" },
    ],
    aliases: ["gaming-stühle", "bürostühle"],
  },

  tablets: {
    name: "Tablets",
    description: "iPads, Android-Tablets und Grafik-Tablets",
    icon: Tablet,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Tablets - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Tablets von Apple, Samsung und Lenovo. Finden Sie Angebote für iPads, Android-Tablets und Grafik-Tablets.",
    popularFilters: [
      { label: "iPad", params: "brand=Apple" },
      { label: "Samsung Galaxy Tab", params: "brand=Samsung" },
      { label: "Grafik-Tablets", params: "type=drawing" },
    ],
    aliases: ["tablet-pc"],
  },

  smartwatches: {
    name: "Smartwatches",
    description: "Smartwatches und Fitness-Tracker",
    icon: Watch,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Smartwatches - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Smartwatches von Apple, Samsung, Garmin und Fitbit. Finden Sie Angebote für Fitness-Tracker und Smart-Bänder.",
    popularFilters: [
      { label: "Apple Watch", params: "brand=Apple" },
      { label: "Garmin", params: "brand=Garmin" },
      { label: "Fitness-Tracker", params: "type=fitness" },
    ],
    aliases: ["fitness-tracker", "smart-uhren"],
  },

  cables: {
    name: "Kabel & Adapter",
    description: "USB-, HDMI- und DisplayPort-Kabel und -Adapter",
    icon: Cable,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Kabel & Adapter - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie USB-C-, HDMI- und DisplayPort-Kabel. Finden Sie Angebote für Adapter und Kabelzubehör.",
    popularFilters: [
      { label: "USB-C", params: "type=usb-c" },
      { label: "HDMI 2.1", params: "type=hdmi-2.1" },
      { label: "DisplayPort", params: "type=displayport" },
    ],
    aliases: ["kabel", "adapter"],
  },

  "laptop-stands": {
    name: "Laptop-Ständer",
    description: "Laptop-Ständer, Erhöhungen und Kühlpads",
    icon: Laptop,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Laptop-Ständer - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Laptop-Ständer, Erhöhungen und Kühlpads für ergonomische Setups.",
    popularFilters: [
      { label: "Verstellbar", params: "type=adjustable" },
      { label: "Mit Kühlung", params: "features=cooling" },
    ],
    aliases: ["laptop-ständer", "notebook-halter"],
  },

  "mouse-pads": {
    name: "Mauspads",
    description: "Gaming- und Schreibtisch-Mauspads",
    icon: Mouse,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Mauspads - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Gaming-Mauspads und Schreibtischunterlagen. Finden Sie Angebote für XXL-Pads und RGB-Mauspads.",
    popularFilters: [
      { label: "Extended/XXL", params: "size=xxl" },
      { label: "RGB", params: "features=rgb" },
    ],
    aliases: ["mauspads", "schreibtischunterlagen"],
  },

  "docking-stations": {
    name: "Docking-Stationen",
    description: "USB-C- und Thunderbolt-Docking-Stationen",
    icon: Usb,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Docking-Stationen - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie USB-C- und Thunderbolt-Docking-Stationen. Finden Sie Angebote für Laptop-Docks mit mehreren Anschlüssen.",
    popularFilters: [
      { label: "Thunderbolt 4", params: "type=thunderbolt-4" },
      { label: "USB-C", params: "type=usb-c" },
    ],
    aliases: ["dock", "laptop-dock"],
  },

  ups: {
    name: "USV / Notstromversorgung",
    description: "Unterbrechungsfreie Stromversorgungen für PCs und NAS",
    icon: Battery,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `USV Notstromversorgung - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie USV-Systeme von APC, CyberPower und Eaton. Schützen Sie Ihren PC und NAS vor Stromausfällen.",
    popularFilters: [
      { label: "600VA+", params: "capacity=600" },
      { label: "1000VA+", params: "capacity=1000" },
    ],
    aliases: ["usv", "notstrom"],
  },

  "pc-cases": {
    name: "PC-Gehäuse",
    description: "Computer-Gehäuse für Gaming- und Workstation-Builds",
    icon: Server,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `PC-Gehäuse - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie PC-Gehäuse von Fractal Design, NZXT, Corsair und mehr. Finden Sie Angebote für ATX-, mATX- und ITX-Gehäuse.",
    popularFilters: [
      { label: "ATX", params: "form-factor=atx" },
      { label: "mATX", params: "form-factor=matx" },
      { label: "ITX", params: "form-factor=itx" },
    ],
    aliases: ["gehäuse", "pc-gehäuse"],
  },

  // ======================
  // NEW: 15 Additional Categories
  // ======================

  "cpu-coolers": {
    name: "CPU-Kühler",
    description: "Luft- und Flüssigkeits-CPU-Kühler für optimale Temperaturen",
    icon: Fan,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `CPU-Kühler - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Luft- und AIO-Flüssigkeits-CPU-Kühler. Finden Sie Angebote von Noctua, be quiet!, Corsair und mehr.",
    popularFilters: [
      { label: "Luftkühler", params: "type=air" },
      { label: "AIO-Wasserkühlung", params: "type=aio" },
    ],
    aliases: ["kühler", "cpu-kühler"],
  },

  "case-fans": {
    name: "Gehäuselüfter",
    description: "PC-Gehäuselüfter und Lüftersteuerungen",
    icon: Fan,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Gehäuselüfter - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie PC-Gehäuselüfter von Noctua, Arctic, Corsair und mehr. Finden Sie RGB- und High-Airflow-Optionen.",
    popularFilters: [
      { label: "120mm", params: "size=120" },
      { label: "140mm", params: "size=140" },
      { label: "RGB", params: "features=rgb" },
    ],
    aliases: ["lüfter", "gehäuselüfter"],
  },

  "thermal-paste": {
    name: "Wärmeleitpaste",
    description: "Thermische Verbindungen und Pads für CPU und GPU",
    icon: Thermometer,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Wärmeleitpaste - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Wärmeleitpaste von Noctua, Thermal Grizzly und Arctic. Finden Sie die besten thermischen Verbindungen.",
    popularFilters: [
      { label: "High Performance", params: "type=premium" },
      { label: "Thermal Pads", params: "type=pad" },
    ],
    aliases: ["wärmeleitpaste"],
  },

  "network-switches": {
    name: "Netzwerk-Switches",
    description: "Ethernet-Switches für Heim- und Büronetzwerke",
    icon: Network,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Netzwerk-Switches - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Netzwerk-Switches von TP-Link, Netgear und Ubiquiti. Managed- und Unmanaged-Optionen.",
    popularFilters: [
      { label: "8 Port", params: "ports=8" },
      { label: "PoE", params: "features=poe" },
      { label: "Managed", params: "type=managed" },
    ],
    aliases: ["netzwerk-switch"],
  },

  "network-cards": {
    name: "Netzwerkkarten",
    description: "PCIe-WLAN- und Ethernet-Adapter",
    icon: Network,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Netzwerkkarten - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie WLAN- und Ethernet-Adapter. PCIe- und USB-Netzwerkkarten für Desktop und Laptop.",
    popularFilters: [
      { label: "WiFi 6", params: "wifi=6" },
      { label: "2.5GbE", params: "speed=2.5gbe" },
    ],
    aliases: ["netzwerkkarten", "wlan-karten"],
  },

  "cable-management": {
    name: "Kabelmanagement",
    description: "Kabelbinder, Kabelkanäle und Organisationslösungen",
    icon: Cable,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Kabelmanagement - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Kabelmanagement-Lösungen. Kabelbinder, Kabelkanäle, Kabelwannen und Schreibtisch-Organizer.",
    popularFilters: [
      { label: "Kabelkanäle", params: "type=sleeve" },
      { label: "Kabelbinder", params: "type=ties" },
    ],
    aliases: ["kabelmanagement"],
  },

  "monitor-arms": {
    name: "Monitorhalterungen",
    description: "Monitorhalterungen und Schreibtisch-Arme",
    icon: Monitor,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Monitorhalterungen - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Monitorhalterungen und -arme von Ergotron, AmazonBasics und mehr. Einzel- und Dual-Optionen.",
    popularFilters: [
      { label: "Einzelmonitor", params: "type=single" },
      { label: "Dual-Monitor", params: "type=dual" },
    ],
    aliases: ["monitorhalterung", "monitor-arm"],
  },

  "desk-accessories": {
    name: "Schreibtisch-Zubehör",
    description: "Schreibtisch-Organizer, Lampen und Zubehör",
    icon: Package,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Schreibtisch-Zubehör - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Schreibtisch-Zubehör. Schreibtischlampen, Organizer und Arbeitsplatz-Essentials.",
    popularFilters: [
      { label: "Schreibtischlampen", params: "type=lamp" },
      { label: "Organizer", params: "type=organizer" },
    ],
    aliases: ["schreibtisch-zubehör"],
  },

  "office-chairs": {
    name: "Bürostühle",
    description: "Ergonomische Bürostühle für Produktivität",
    icon: Armchair,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Bürostühle - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie ergonomische Bürostühle von Herman Miller, Steelcase und günstigen Alternativen.",
    popularFilters: [
      { label: "Ergonomisch", params: "features=ergonomic" },
      { label: "Mesh-Rücken", params: "type=mesh" },
    ],
    aliases: ["bürostühle"],
  },

  "standing-desks": {
    name: "Stehschreibtische",
    description: "Höhenverstellbare Schreibtische und Stehpulte",
    icon: Monitor,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Stehschreibtische - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Stehschreibtische und Sitz-Steh-Tische. Elektrische und manuelle höhenverstellbare Optionen.",
    popularFilters: [
      { label: "Elektrisch", params: "type=electric" },
      { label: "Manuell", params: "type=manual" },
    ],
    aliases: ["stehschreibtisch", "höhenverstellbar"],
  },

  "tablet-accessories": {
    name: "Tablet-Zubehör",
    description: "Hüllen, Ständer und Zubehör für Tablets",
    icon: Tablet,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Tablet-Zubehör - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Tablet-Hüllen, -Ständer und -Stifte. iPad- und Android-Tablet-Zubehör.",
    popularFilters: [
      { label: "iPad-Hüllen", params: "type=ipad-case" },
      { label: "Stifte", params: "type=stylus" },
    ],
    aliases: ["tablet-zubehör"],
  },

  "phone-accessories": {
    name: "Handy-Zubehör",
    description: "Handyhüllen, Ladegeräte und Zubehör",
    icon: Smartphone,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Handy-Zubehör - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Handyhüllen, kabellose Ladegeräte und Handy-Zubehör für iPhone und Android.",
    popularFilters: [
      { label: "Kabellose Ladegeräte", params: "type=wireless-charger" },
      { label: "Handyhüllen", params: "type=case" },
    ],
    aliases: ["handy-zubehör"],
  },

  "game-controllers": {
    name: "Game-Controller",
    description: "Gamepads, Controller und Joysticks",
    icon: Gamepad2,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Game-Controller - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Game-Controller und Gamepads von Xbox, PlayStation und Drittanbietern.",
    popularFilters: [
      { label: "Xbox Controller", params: "brand=Xbox" },
      { label: "PlayStation", params: "brand=PlayStation" },
    ],
    aliases: ["controller", "gamepad"],
  },

  "vr-headsets": {
    name: "VR-Brillen",
    description: "Virtual-Reality-Headsets und Zubehör",
    icon: Glasses,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `VR-Brillen - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie VR-Headsets von Meta Quest, HTC Vive und Valve Index. Standalone- und PC-VR-Optionen.",
    popularFilters: [
      { label: "Standalone", params: "type=standalone" },
      { label: "PC VR", params: "type=pcvr" },
    ],
    aliases: ["vr-brille", "virtual-reality"],
  },

  "capture-cards": {
    name: "Capture-Karten",
    description: "Videoaufnahme-Karten für Streaming und Recording",
    icon: Video,
    parent: "electronics",
    categoryType: "standard",
    hidden: false,
    metaTitle: `Capture-Karten - Preise vergleichen | ${BRAND_DOMAIN}`,
    metaDescription:
      "Vergleichen Sie Capture-Karten von Elgato, AVerMedia und mehr. USB- und PCIe-Optionen für Streaming.",
    popularFilters: [
      { label: "USB", params: "type=usb" },
      { label: "PCIe", params: "type=pcie" },
      { label: "4K", params: "resolution=4k" },
    ],
    aliases: ["capture-karte", "game-capture"],
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
  const category = allCategories[categorySlug];

  if (!category) return breadcrumbs;

  if (category.parent) {
    const parent = allCategories[category.parent];
    if (parent) breadcrumbs.push(parent);
  }

  breadcrumbs.push(category);
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
 * Get all standard categories (regular price comparison)
 */
export function getStandardCategories(): Category[] {
  return Object.values(allCategories).filter(
    (cat) => cat.categoryType === "standard" && !cat.hidden,
  );
}
