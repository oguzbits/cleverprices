/**
 * Demo product data for hero table
 * Separated from component for better organization
 */

// Product Type Definitions
export type HardDriveProduct = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  capacityUnit: string;
  pricePerUnit: number;
  warranty: string;
  formFactor: string;
  technology: string;
  condition: "New" | "Used" | "Renewed";
  brand: string;
};

export type BatteryProduct = {
  id: string;
  name: string;
  price: number;
  packSize: number;
  pricePerUnit: number;
  batteryType: "AA" | "AAA" | "C" | "D";
  condition: "New" | "Used" | "Renewed";
  brand: string;
  warranty: string;
};

export type PowerSupplyProduct = {
  id: string;
  name: string;
  price: number;
  wattage: number;
  pricePerUnit: number; // Price per 100W
  efficiency: "80+ Gold" | "80+ Platinum" | "80+ Bronze" | "80+ White";
  modularity: "Full" | "Semi" | "Non";
  condition: "New" | "Used" | "Renewed";
  brand: string;
  warranty: string;
};

export type ProductCategory = "harddrives" | "batteries" | "powersupplies";

// Hard Drive Products (sorted by price per TB)
export const hardDriveProducts: HardDriveProduct[] = [
  {
    id: "1",
    name: "Seagate Exos X18 18TB",
    price: 202.13,
    capacity: 18.0,
    capacityUnit: "TB",
    pricePerUnit: 11.229,
    warranty: "2 years",
    formFactor: 'External 2.5"',
    technology: "HDD",
    condition: "Used" as const,
    brand: "Seagate",
  },
  {
    id: "2",
    name: "Toshiba MG09 18TB",
    price: 215.5,
    capacity: 18.0,
    capacityUnit: "TB",
    pricePerUnit: 11.972,
    warranty: "5 years",
    formFactor: 'Internal 3.5"',
    technology: "HDD",
    condition: "New" as const,
    brand: "Toshiba",
  },
  {
    id: "3",
    name: "WD Red Pro 14TB",
    price: 239.99,
    capacity: 14.0,
    capacityUnit: "TB",
    pricePerUnit: 17.142,
    warranty: "5 years",
    formFactor: 'Internal 3.5"',
    technology: "HDD",
    condition: "New" as const,
    brand: "Western Digital",
  },
  {
    id: "4",
    name: "Samsung 870 QVO 8TB",
    price: 349.0,
    capacity: 8.0,
    capacityUnit: "TB",
    pricePerUnit: 43.625,
    warranty: "3 years",
    formFactor: 'Internal 2.5"',
    technology: "SSD",
    condition: "Used" as const,
    brand: "Samsung",
  },
  {
    id: "5",
    name: "Crucial MX500 4TB",
    price: 179.99,
    capacity: 4.0,
    capacityUnit: "TB",
    pricePerUnit: 44.997,
    warranty: "5 years",
    formFactor: 'Internal 2.5"',
    technology: "SSD",
    condition: "New" as const,
    brand: "Crucial",
  },
].sort((a, b) => a.pricePerUnit - b.pricePerUnit);

// Battery Products (sorted by price per unit)
export const batteryProducts: BatteryProduct[] = [
  {
    id: "1",
    name: "AmazonBasics AA 48-Pack",
    price: 10.99,
    packSize: 48,
    pricePerUnit: 0.23,
    batteryType: "AA" as const,
    condition: "New" as const,
    brand: "AmazonBasics",
    warranty: "1 year",
  },
  {
    id: "2",
    name: "Energizer AAA 24-Pack",
    price: 8.29,
    packSize: 24,
    pricePerUnit: 0.35,
    batteryType: "AAA" as const,
    condition: "New" as const,
    brand: "Energizer",
    warranty: "2 years",
  },
  {
    id: "3",
    name: "Duracell AA 20-Pack",
    price: 11.99,
    packSize: 20,
    pricePerUnit: 0.60,
    batteryType: "AA" as const,
    condition: "New" as const,
    brand: "Duracell",
    warranty: "5 years",
  },
  {
    id: "4",
    name: "Rayovac C 12-Pack",
    price: 9.19,
    packSize: 12,
    pricePerUnit: 0.77,
    batteryType: "C" as const,
    condition: "New" as const,
    brand: "Rayovac",
    warranty: "3 years",
  },
  {
    id: "5",
    name: "Duracell D 8-Pack",
    price: 10.99,
    packSize: 8,
    pricePerUnit: 1.37,
    batteryType: "D" as const,
    condition: "New" as const,
    brand: "Duracell",
    warranty: "5 years",
  },
].sort((a, b) => a.pricePerUnit - b.pricePerUnit);

// Power Supply Products (sorted by price per 100W)
export const powerSupplyProducts: PowerSupplyProduct[] = [
  {
    id: "1",
    name: "Corsair RM750e (2023)",
    price: 89.99,
    wattage: 750,
    pricePerUnit: 11.99,
    efficiency: "80+ Gold" as const,
    modularity: "Full" as const,
    condition: "New" as const,
    brand: "Corsair",
    warranty: "7 years",
  },
  {
    id: "2",
    name: "EVGA SuperNOVA 850 GT",
    price: 109.99,
    wattage: 850,
    pricePerUnit: 12.94,
    efficiency: "80+ Gold" as const,
    modularity: "Full" as const,
    condition: "New" as const,
    brand: "EVGA",
    warranty: "7 years",
  },
  {
    id: "3",
    name: "Thermaltake Toughpower GX2",
    price: 79.99,
    wattage: 600,
    pricePerUnit: 13.33,
    efficiency: "80+ Gold" as const,
    modularity: "Non" as const,
    condition: "New" as const,
    brand: "Thermaltake",
    warranty: "5 years",
  },
  {
    id: "4",
    name: "Seasonic FOCUS GX-750",
    price: 119.99,
    wattage: 750,
    pricePerUnit: 15.99,
    efficiency: "80+ Gold" as const,
    modularity: "Full" as const,
    condition: "New" as const,
    brand: "Seasonic",
    warranty: "10 years",
  },
  {
    id: "5",
    name: "be quiet! Straight Power 12",
    price: 189.99,
    wattage: 850,
    pricePerUnit: 22.35,
    efficiency: "80+ Platinum" as const,
    modularity: "Full" as const,
    condition: "New" as const,
    brand: "be quiet!",
    warranty: "10 years",
  },
].sort((a, b) => a.pricePerUnit - b.pricePerUnit);

// Category configuration
export const categoryConfig = {
  harddrives: {
    title: "Hard Drives",
    url: "realpricedata.com/us/electronics/hard-drives",
    unitLabel: "Price/TB",
    currency: "$",
    insightText: "The 18TB drive is 4x cheaper per TB than the 8TB SSD!",
    filters: {
      filter1: { title: "Condition", options: ["New", "Used", "Renewed"] },
      filter2: {
        title: "Capacity",
        options: ["18 TB", "14 TB", "8 TB", "4 TB"],
      },
      filter3: { title: "Technology", options: ["HDD", "SSD"] },
    },
  },
  batteries: {
    title: "Batteries",
    url: "realpricedata.com/de/electronics/batteries",
    unitLabel: "Price/Unit",
    currency: "€",
    insightText: "The 48-pack is 6x cheaper per battery than the 8-pack!",
    filters: {
      filter1: { title: "Condition", options: ["New", "Used", "Renewed"] },
      filter2: { title: "Battery Type", options: ["AA", "AAA", "C", "D"] },
      filter3: {
        title: "Pack Size",
        options: ["48 pack", "24 pack", "20 pack", "12 pack"],
      },
    },
  },
  powersupplies: {
    title: "Power Supplies",
    url: "realpricedata.com/us/electronics/power-supplies",
    unitLabel: "Price/100W",
    currency: "$",
    insightText: "Mid-range 750W units often offer the best value per watt!",
    filters: {
      filter1: { title: "Efficiency", options: ["80+ Gold", "80+ Platinum", "80+ Bronze"] },
      filter2: { title: "Modularity", options: ["Full", "Semi", "Non"] },
      filter3: { title: "Wattage", options: ["600W", "750W", "850W", "1000W"] },
    },
  },
} as const;

export const categories: ProductCategory[] = ["harddrives", "batteries", "powersupplies"];

