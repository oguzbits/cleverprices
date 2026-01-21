import { CategorySlug } from "./category-types";

export interface CategoryManifestEntry {
  name: string;
  singularName?: string;
  parent?: CategorySlug;
  hidden?: boolean;
}

export const CATEGORY_MANIFEST: Record<CategorySlug, CategoryManifestEntry> = {
  haushaltselektronik: {
    name: "Haushaltselektronik",
    parent: "elektroartikel",
    hidden: true,
  },
  computer: { name: "Computer", parent: "elektroartikel" },
  telekommunikation: { name: "Telekommunikation", parent: "elektroartikel" },
  "apple-iphone": { name: "Apple iPhone", parent: "telekommunikation" },
  "samsung-galaxy": { name: "Samsung Galaxy", parent: "telekommunikation" },
  "hifi-audio": { name: "HiFi & Audio", parent: "elektroartikel" },
  "tv-sat": { name: "TV & Sat", parent: "elektroartikel" },
  fotografie: { name: "Fotografie", parent: "elektroartikel" },
  "drucker-scanner": { name: "Drucker & Scanner", parent: "elektroartikel" },
  "gaming-elektrospielzeug": {
    name: "Gaming & Elektrospielzeug",
    parent: "elektroartikel",
  },
  elektroartikel: { name: "Elektroartikel" },
  deals: { name: "Deals" },
  electronics: { name: "Elektronik", hidden: true },
  tvs: { name: "Fernseher", singularName: "Fernseher", parent: "tv-sat" },
  staubsauger: {
    name: "Staubsauger",
    singularName: "Staubsauger",
    parent: "haushaltselektronik",
    hidden: true,
  },
  headphones: {
    name: "Kopfhörer",
    singularName: "Kopfhörer",
    parent: "hifi-audio",
  },
  notebooks: {
    name: "Notebooks",
    singularName: "Notebook",
    parent: "computer",
  },
  tablets: { name: "Tablets", singularName: "Tablet", parent: "computer" },
  espressomaschinen: {
    name: "Espressomaschinen",
    singularName: "Espressomaschine",
    parent: "haushaltselektronik",
    hidden: true,
  },
  monitors: { name: "Monitore", singularName: "Monitor", parent: "computer" },
  speakers: {
    name: "Lautsprecher",
    singularName: "Lautsprecher",
    parent: "hifi-audio",
  },
  kuehlschraenke: {
    name: "Kühlschränke",
    parent: "haushaltselektronik",
    hidden: true,
  },
  "elektrische-zahnbuersten": {
    name: "Elektrische Zahnbürsten",
    parent: "haushaltselektronik",
    hidden: true,
  },
  waschmaschinen: {
    name: "Waschmaschinen",
    parent: "haushaltselektronik",
    hidden: true,
  },
  multifunktionsdrucker: {
    name: "Multifunktionsdrucker",
    singularName: "Multifunktionsdrucker",
    parent: "drucker-scanner",
  },
  geschirrspueler: {
    name: "Geschirrspüler",
    singularName: "Geschirrspüler",
    parent: "haushaltselektronik",
    hidden: true,
  },
  routers: {
    name: "Router",
    singularName: "Router",
    parent: "telekommunikation",
  },
  systemkameras: {
    name: "Systemkameras",
    singularName: "Systemkamera",
    parent: "fotografie",
  },
  backoefen: {
    name: "Backöfen",
    singularName: "Backofen",
    parent: "haushaltselektronik",
    hidden: true,
  },
  kochfelder: {
    name: "Kochfelder",
    singularName: "Kochfeld",
    parent: "haushaltselektronik",
    hidden: true,
  },
  soundbars: {
    name: "Soundbars",
    singularName: "Soundbar",
    parent: "hifi-audio",
  },
  radios: { name: "Radios", singularName: "Radio", parent: "hifi-audio" },
  waeschetrockner: {
    name: "Wäschetrockner",
    singularName: "Wäschetrockner",
    parent: "haushaltselektronik",
    hidden: true,
  },
  kuechenmaschinen: {
    name: "Küchenmaschinen",
    singularName: "Küchenmaschine",
    parent: "haushaltselektronik",
    hidden: true,
  },
  "bartschneider-haarschneider": {
    name: "Bartschneider & Haarschneider",
    singularName: "Bartschneider",
    parent: "haushaltselektronik",
    hidden: true,
  },
  receiver: {
    name: "Receiver",
    singularName: "Receiver",
    parent: "hifi-audio",
  },
  mikrowellen: {
    name: "Mikrowellen",
    singularName: "Mikrowelle",
    parent: "haushaltselektronik",
    hidden: true,
  },
  dunstabzugshauben: {
    name: "Dunstabzugshauben",
    singularName: "Dunstabzugshaube",
    parent: "haushaltselektronik",
    hidden: true,
  },
  "hard-drives": {
    name: "Festplatten",
    singularName: "Festplatte",
    parent: "pc-komponenten",
  },
  gefrierschraenke: {
    name: "Gefrierschränke",
    singularName: "Gefrierschrank",
    parent: "haushaltselektronik",
    hidden: true,
  },
  herde: {
    name: "Herde",
    singularName: "Herd",
    parent: "haushaltselektronik",
    hidden: true,
  },
  drones: { name: "Drohnen", singularName: "Drohne", parent: "fotografie" },
  nas: { name: "NAS-Server", singularName: "NAS-Server", parent: "computer" },
  "pc-komponenten": {
    name: "PC-Komponenten",
    singularName: "PC-Komponente",
    parent: "computer",
  },
  gpu: {
    name: "Grafikkarten",
    singularName: "Grafikkarte",
    parent: "pc-komponenten",
  },
  motherboards: {
    name: "Mainboards",
    singularName: "Mainboard",
    parent: "pc-komponenten",
  },
  ram: {
    name: "Arbeitsspeicher",
    singularName: "Arbeitsspeicher",
    parent: "pc-komponenten",
  },
  "pc-cases": {
    name: "PC-Gehäuse",
    singularName: "PC-Gehäuse",
    parent: "pc-komponenten",
  },
  "power-supplies": {
    name: "Netzteile",
    singularName: "Netzteil",
    parent: "pc-komponenten",
  },
  "cpu-coolers": {
    name: "CPU-Kühler",
    singularName: "CPU-Kühler",
    parent: "pc-komponenten",
  },
  storage: {
    name: "Laufwerke",
    singularName: "Laufwerk",
    parent: "pc-komponenten",
  },
  ssds: { name: "SSDs", singularName: "SSD", parent: "pc-komponenten" },
  "smartwatch-accessories": {
    name: "Smartwatch-Zubehör",
    singularName: "Smartwatch-Zubehör",
    parent: "telekommunikation",
  },
  smartphones: {
    name: "Smartphones",
    singularName: "Smartphone",
    parent: "telekommunikation",
  },
  smartwatches: {
    name: "Smartwatches",
    singularName: "Smartwatch",
    parent: "telekommunikation",
  },
  consoles: {
    name: "Spielekonsolen",
    singularName: "Konsole",
    parent: "gaming-elektrospielzeug",
  },
  cameras: {
    name: "Digitalkameras",
    singularName: "Digitalkamera",
    parent: "fotografie",
  },
  keyboards: {
    name: "Tastaturen",
    singularName: "Tastatur",
    parent: "computer",
  },
  mice: { name: "Mäuse", singularName: "Maus", parent: "computer" },
  "mouse-pads": {
    name: "Mauspads",
    singularName: "Mauspad",
    parent: "computer",
  },
  "external-storage": {
    name: "Externe Speicher",
    singularName: "Externer Speicher",
    parent: "computer",
  },
  speicherkarten: {
    name: "Speicherkarten",
    singularName: "Speicherkarte",
    parent: "fotografie",
  },
  "docking-stations": {
    name: "Docking-Stationen",
    singularName: "Docking-Station",
    parent: "computer",
  },
  "network-switches": {
    name: "Netzwerk-Switches",
    singularName: "Switch",
    parent: "telekommunikation",
  },
  "network-cards": {
    name: "Netzwerkkarten",
    singularName: "Netzwerkkarte",
    parent: "pc-komponenten",
  },
  cables: { name: "Kabel & Adapter", parent: "elektroartikel" },
  "laptop-stands": { name: "Laptop-Ständer", parent: "computer" },
  ups: { name: "USV", parent: "pc-komponenten" },
  "cable-management": { name: "Kabelmanagement", parent: "pc-komponenten" },
  "monitor-arms": {
    name: "Monitorhalterungen",
    singularName: "Monitorhalterung",
    parent: "computer",
  },
  "desk-accessories": {
    name: "Schreibtisch-Zubehör",
    singularName: "Schreibtisch-Zubehör",
    parent: "computer",
  },
  "office-chairs": {
    name: "Bürostühle",
    singularName: "Bürostuhl",
    parent: "computer",
  },
  "standing-desks": {
    name: "Stehschreibtische",
    singularName: "Stehschreibtisch",
    parent: "computer",
  },
  "tablet-accessories": {
    name: "Tablet-Zubehör",
    singularName: "Tablet-Zubehör",
    parent: "computer",
  },
  "phone-accessories": {
    name: "Handy-Zubehör",
    singularName: "Handy-Zubehör",
    parent: "telekommunikation",
  },
  "game-controllers": {
    name: "Game-Controller",
    singularName: "Game-Controller",
    parent: "gaming-elektrospielzeug",
  },
  "vr-headsets": {
    name: "VR-Brillen",
    singularName: "VR-Brille",
    parent: "gaming-elektrospielzeug",
  },
  microphones: {
    name: "Mikrofone",
    singularName: "Mikrofon",
    parent: "hifi-audio",
  },
  "gaming-chairs": {
    name: "Gaming-Stühle",
    singularName: "Gaming-Stuhl",
    parent: "gaming-elektrospielzeug",
  },
  webcams: { name: "Webcams", singularName: "Webcam", parent: "computer" },
  "capture-cards": {
    name: "Capture-Karten",
    singularName: "Capture-Karte",
    parent: "pc-komponenten",
  },
  cpu: {
    name: "Prozessoren",
    singularName: "Prozessor",
    parent: "pc-komponenten",
  },
  elektrowerkzeuge: {
    name: "Elektrowerkzeuge",
    singularName: "Elektrowerkzeug",
    hidden: true,
    parent: "elektroartikel",
  },
  akkuschrauber: {
    name: "Akkuschrauber",
    singularName: "Akkuschrauber",
    hidden: true,
    parent: "elektrowerkzeuge",
  },
  bohrmaschinen: {
    name: "Bohrmaschinen",
    singularName: "Bohrmaschine",
    hidden: true,
    parent: "elektrowerkzeuge",
  },
  kreissaegen: {
    name: "Kreissägen",
    singularName: "Kreissäge",
    hidden: true,
    parent: "elektrowerkzeuge",
  },
  schleifmaschinen: {
    name: "Schleifmaschinen",
    singularName: "Schleifmaschine",
    hidden: true,
    parent: "elektrowerkzeuge",
  },
  fraesmaschinen: {
    name: "Fräsmaschinen",
    singularName: "Fräsmaschine",
    hidden: true,
    parent: "elektrowerkzeuge",
  },
  "3d-drucker": {
    name: "3D-Drucker",
    singularName: "3D-Drucker",
    parent: "computer",
  },
  laserdrucker: {
    name: "Laserdrucker",
    singularName: "Laserdrucker",
    parent: "drucker-scanner",
  },
  kompaktkameras: {
    name: "Kompaktkameras",
    singularName: "Kompaktkamera",
    parent: "fotografie",
  },
};
