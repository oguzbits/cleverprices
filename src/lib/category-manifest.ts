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
  fernseher: { name: "Fernseher", singularName: "Fernseher", parent: "tv-sat" },
  staubsauger: {
    name: "Staubsauger",
    singularName: "Staubsauger",
    parent: "haushaltselektronik",
    hidden: true,
  },
  kopfhoerer: {
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
  monitore: { name: "Monitore", singularName: "Monitor", parent: "computer" },
  lautsprecher: {
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
  "wlan-router": {
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
  "av-receiver": {
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
  festplatten: {
    name: "Festplatten",
    singularName: "Festplatte",
    parent: "elektroartikel",
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
  drohnen: { name: "Drohnen", singularName: "Drohne", parent: "fotografie" },
  "nas-systeme": {
    name: "NAS-Server",
    singularName: "NAS-Server",
    parent: "computer",
  },
  "pc-komponenten": {
    name: "PC-Komponenten",
    singularName: "PC-Komponente",
    parent: "computer",
  },
  grafikkarten: {
    name: "Grafikkarten",
    singularName: "Grafikkarte",
    parent: "pc-komponenten",
  },
  mainboards: {
    name: "Mainboards",
    singularName: "Mainboard",
    parent: "pc-komponenten",
  },
  arbeitsspeicher: {
    name: "Arbeitsspeicher",
    singularName: "Arbeitsspeicher",
    parent: "pc-komponenten",
  },
  "pc-gehaeuse": {
    name: "PC-Gehäuse",
    singularName: "PC-Gehäuse",
    parent: "pc-komponenten",
  },
  netzteile: {
    name: "Netzteile",
    singularName: "Netzteil",
    parent: "pc-komponenten",
  },
  "cpu-kuehler": {
    name: "CPU-Kühler",
    singularName: "CPU-Kühler",
    parent: "pc-komponenten",
  },
  laufwerke: {
    name: "Laufwerke",
    singularName: "Laufwerk",
    parent: "pc-komponenten",
  },
  ssds: { name: "SSDs", singularName: "SSD", parent: "elektroartikel" },
  "smartwatch-zubehoer": {
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
  spielekonsolen: {
    name: "Spielekonsolen",
    singularName: "Konsole",
    parent: "gaming-elektrospielzeug",
  },
  digitalkameras: {
    name: "Digitalkameras",
    singularName: "Digitalkamera",
    parent: "fotografie",
  },
  tastaturen: {
    name: "Tastaturen",
    singularName: "Tastatur",
    parent: "computer",
  },
  maeuse: { name: "Mäuse", singularName: "Maus", parent: "computer" },
  mauspads: {
    name: "Mauspads",
    singularName: "Mauspad",
    parent: "computer",
  },
  "externe-speicher": {
    name: "Externe Speicher",
    singularName: "Externer Speicher",
    parent: "computer",
  },
  speicherkarten: {
    name: "Speicherkarten",
    singularName: "Speicherkarte",
    parent: "fotografie",
  },
  dockingstationen: {
    name: "Docking-Stationen",
    singularName: "Docking-Station",
    parent: "computer",
  },
  "netzwerk-switches": {
    name: "Netzwerk-Switches",
    singularName: "Switch",
    parent: "telekommunikation",
  },
  netzwerkkarten: {
    name: "Netzwerkkarten",
    singularName: "Netzwerkkarte",
    parent: "pc-komponenten",
  },
  "kabel-adapter": { name: "Kabel & Adapter", parent: "elektroartikel" },
  "laptop-staender": { name: "Laptop-Ständer", parent: "computer" },
  "usv-anlagen": { name: "USV", parent: "pc-komponenten" },
  kabelmanagement: { name: "Kabelmanagement", parent: "pc-komponenten" },
  monitorhalterungen: {
    name: "Monitorhalterungen",
    singularName: "Monitorhalterung",
    parent: "computer",
  },
  "schreibtisch-zubehoer": {
    name: "Schreibtisch-Zubehör",
    singularName: "Schreibtisch-Zubehör",
    parent: "computer",
  },
  "gaming-stuehle": {
    name: "Gaming-Stühle",
    singularName: "Gaming-Stuhl",
    parent: "gaming-elektrospielzeug",
  },
  buerostuehle: {
    name: "Bürostühle",
    singularName: "Bürostuhl",
    parent: "computer",
  },
  stehschreibtische: {
    name: "Stehschreibtische",
    singularName: "Stehschreibtisch",
    parent: "computer",
  },
  "tablet-zubehoer": {
    name: "Tablet-Zubehör",
    singularName: "Tablet-Zubehör",
    parent: "computer",
  },
  "handy-zubehoer": {
    name: "Handy-Zubehör",
    singularName: "Handy-Zubehör",
    parent: "telekommunikation",
  },
  "gamepad-controller": {
    name: "Game-Controller",
    singularName: "Game-Controller",
    parent: "gaming-elektrospielzeug",
  },
  "vr-brillen": {
    name: "VR-Brillen",
    singularName: "VR-Brille",
    parent: "gaming-elektrospielzeug",
  },
  mikrofone: {
    name: "Mikrofone",
    singularName: "Mikrofon",
    parent: "hifi-audio",
  },
  webcams: { name: "Webcams", singularName: "Webcam", parent: "computer" },
  "capture-karten": {
    name: "Capture-Karten",
    singularName: "Capture-Karte",
    parent: "pc-komponenten",
  },
  prozessoren: {
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
  videospiele: {
    name: "Games",
    singularName: "Game",
    parent: "gaming-elektrospielzeug",
    hidden: true,
  },
};
