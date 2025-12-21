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

export type DogFoodProduct = {
  id: string;
  name: string;
  price: number;
  weight: number;
  weightUnit: string;
  pricePerUnit: number;
  size: "Small Breed" | "Medium Breed" | "Large Breed";
  type: "Dry" | "Wet";
  ageGroup: "Puppy" | "Adult" | "Senior";
  condition: "New" | "Used" | "Renewed";
  brand: string;
};

export type ProductCategory = "harddrives" | "batteries" | "dogfood";

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

// Dog Food Products (sorted by price per lb)
export const dogFoodProducts: DogFoodProduct[] = [
  {
    id: "1",
    name: "Purina Pro Plan Adult",
    price: 3999,
    weight: 15.9,
    weightUnit: "kg",
    pricePerUnit: 251.5,
    size: "Large Breed" as const,
    type: "Dry" as const,
    ageGroup: "Adult" as const,
    condition: "New" as const,
    brand: "Purina",
  },
  {
    id: "2",
    name: "Blue Buffalo Senior",
    price: 4599,
    weight: 13.6,
    weightUnit: "kg",
    pricePerUnit: 338.2,
    size: "Medium Breed" as const,
    type: "Dry" as const,
    ageGroup: "Senior" as const,
    condition: "New" as const,
    brand: "Blue Buffalo",
  },
  {
    id: "3",
    name: "Royal Canin Puppy",
    price: 4999,
    weight: 13.6,
    weightUnit: "kg",
    pricePerUnit: 367.6,
    size: "Small Breed" as const,
    type: "Dry" as const,
    ageGroup: "Puppy" as const,
    condition: "New" as const,
    brand: "Royal Canin",
  },
  {
    id: "4",
    name: "Hill's Science Diet Adult",
    price: 5399,
    weight: 13.6,
    weightUnit: "kg",
    pricePerUnit: 397.0,
    size: "Medium Breed" as const,
    type: "Dry" as const,
    ageGroup: "Adult" as const,
    condition: "New" as const,
    brand: "Hill's",
  },
  {
    id: "5",
    name: "Wellness CORE Grain-Free",
    price: 5799,
    weight: 11.8,
    weightUnit: "kg",
    pricePerUnit: 491.4,
    size: "Large Breed" as const,
    type: "Dry" as const,
    ageGroup: "Adult" as const,
    condition: "New" as const,
    brand: "Wellness",
  },
].sort((a, b) => a.pricePerUnit - b.pricePerUnit);

// Category configuration
export const categoryConfig = {
  harddrives: {
    title: "Disk Price Comparison",
    count: "100 disks",
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
    title: "Battery Price Comparison",
    count: "50 packs",
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
  dogfood: {
    title: "Dog Food Price Comparison",
    count: "75 products",
    url: "realpricedata.com/in/groceries/pet-food",
    unitLabel: "Price/kg",
    currency: "₹",
    insightText: "Buying in bulk is 2x cheaper per kg than smaller bags!",
    filters: {
      filter1: {
        title: "Size",
        options: ["Small Breed", "Medium Breed", "Large Breed"],
      },
      filter2: { title: "Type", options: ["Dry", "Wet"] },
      filter3: { title: "Age Group", options: ["Puppy", "Adult", "Senior"] },
    },
  },
} as const;

export const categories: ProductCategory[] = ["harddrives", "batteries", "dogfood"];
