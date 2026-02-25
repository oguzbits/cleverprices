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
  Home,
  Keyboard,
  Laptop,
  MemoryStick,
  Mic,
  Monitor,
  MonitorCheck,
  Mouse,
  Network,
  Package,
  Phone,
  Printer,
  Router,
  Server,
  Smartphone,
  Speaker,
  Tablet,
  Thermometer,
  Tv,
  Usb,
  Video,
  Watch,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CategorySlug } from "./category-types";

const CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  // Main Categories
  "pc-komponenten": Cpu,
  computer: Laptop,
  elektroartikel: Smartphone,
  electronics: HardDrive,
  deals: Zap,
  haushaltselektronik: Home,
  telekommunikation: Phone,
  "hifi-audio": Speaker,
  "tv-sat": Tv,
  fotografie: Camera,
  "drucker-scanner": Printer,
  "gaming-elektrospielzeug": Gamepad2,

  // Hardware Components
  festplatten: HardDrive,
  arbeitsspeicher: MemoryStick,
  netzteile: Zap,
  prozessoren: Cpu,
  grafikkarten: Video,
  mainboards: Server,
  "pc-gehaeuse": Server,
  "cpu-kuehler": Fan,
  ssds: HardDrive,
  "externe-speicher": HardDrive,
  laufwerke: HardDrive,
  speicherkarten: MemoryStick,

  // Peripherals
  monitore: Monitor,
  tastaturen: Keyboard,
  maeuse: Mouse,
  mauspads: Mouse,
  kopfhoerer: Headphones,
  lautsprecher: Speaker,
  mikrofone: Mic,
  webcams: Camera,
  "gamepad-controller": Gamepad2,

  // Networking
  "wlan-router": Router,
  "nas-systeme": Server,
  "netzwerk-switches": Network,
  netzwerkkarten: Network,

  // Workspace & Accessories
  "kabel-adapter": Cable,
  "laptop-staender": Laptop,
  "usv-anlagen": Battery,
  kabelmanagement: Cable,
  monitorhalterungen: MonitorCheck,
  "schreibtisch-zubehoer": Package,
  "gaming-stuehle": Armchair,
  buerostuehle: Armchair,
  stehschreibtische: Monitor,
  dockingstationen: Usb,

  // Mobile & Smart
  tablets: Tablet,
  smartwatches: Watch,
  "tablet-zubehoer": Tablet,
  "handy-zubehoer": Smartphone,
  smartphones: Smartphone,
  "apple-iphone": Smartphone,
  "samsung-galaxy": Smartphone,
  "smartwatch-zubehoer": Watch,

  // Entertainment
  fernseher: Tv,
  notebooks: Laptop,
  spielekonsolen: Gamepad2,
  videospiele: Gamepad2,
  soundbars: Speaker,
  "vr-brillen": Glasses,
  "capture-karten": Video,
  radios: Mic,

  // Household & Appliances
  staubsauger: Fan,
  espressomaschinen: Zap,
  kuehlschraenke: Thermometer,
  "elektrische-zahnbuersten": Zap,
  waschmaschinen: Zap,
  multifunktionsdrucker: Printer,
  geschirrspueler: HardDrive,
  backoefen: Zap,
  kochfelder: Zap,
  waeschetrockner: Fan,
  kuechenmaschinen: Zap,
  "bartschneider-haarschneider": Zap,
  "av-receiver": Speaker,
  mikrowellen: Zap,
  dunstabzugshauben: Fan,
  gefrierschraenke: Thermometer,
  herde: Zap,

  // Tools
  elektrowerkzeuge: Zap,
  akkuschrauber: Zap,
  bohrmaschinen: Zap,
  kreissaegen: Zap,
  schleifmaschinen: Zap,
  fraesmaschinen: Zap,

  // Specialized Printers & Cameras
  "3d-drucker": Printer,
  laserdrucker: Printer,
  drohnen: Camera,
  digitalkameras: Camera,
  systemkameras: Camera,
  kompaktkameras: Camera,
};

/**
 * Helper to get an icon for a category slug with a fallback
 */
export function getCategoryIcon(slug: string) {
  return CATEGORY_ICONS[slug as CategorySlug] || Smartphone;
}
