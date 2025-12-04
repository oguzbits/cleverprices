import {
  HardDrive,
  Usb,
  Battery,
  Coffee,
  Milk,
  Wheat,
  Utensils,
  Droplets,
  Home,
  Trash2,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  parent?: string; // Parent category slug
  metaTitle?: string;
  metaDescription?: string;
  unitType?: string; // e.g., "TB", "kg", "load", "count"
  hidden?: boolean;
}

export interface CategoryHierarchy {
  parent: Category;
  children: Category[];
}

// All categories in a flat structure
export const allCategories: Record<string, Category> = {
  // Parent Categories
  "electronics": {
    name: "Electronics",
    slug: "electronics",
    description: "Digital storage solutions and tech accessories",
    icon: HardDrive,
    metaTitle: "Electronics - Best Price Per Unit | RealPriceData",
    metaDescription:
      "Compare prices for electronics and tech accessories by unit cost. Find the best deals on hard drives, SSDs, USB drives, and batteries.",
  },
  "groceries": {
    name: "Groceries",
    slug: "groceries",
    description: "Everyday food items and beverages",
    icon: Coffee,
    metaTitle: "Groceries - Best Price Per Unit | RealPriceData",
    metaDescription:
      "Compare grocery prices by weight or volume. Find the best value on coffee, protein powder, rice, pasta, and more.",
  },
  "home": {
    name: "Home",
    slug: "home",
    description: "Home cleaning and maintenance products",
    icon: Home,
    metaTitle: "Home Essentials - Best Price Per Unit | RealPriceData",
    metaDescription:
      "Compare home product prices by load or count. Find the best deals on detergent, paper products, trash bags, and dishwasher tabs.",
  },

  // Electronics Children
  "hard-drives": {
    name: "Hard Drives & SSDs",
    slug: "hard-drives",
    description: "HDD and SSD storage solutions",
    icon: HardDrive,
    parent: "electronics",
    unitType: "TB",
    metaTitle: "Hard Drives & SSDs - Compare Price Per TB | RealPriceData",
    metaDescription:
      "Find the best hard drive and SSD deals by comparing price per terabyte. Compare internal and external storage from top brands.",
  },
  "usb-drives": {
    name: "USB Drives",
    slug: "usb-drives",
    description: "Portable file storage",
    icon: Usb,
    parent: "electronics",
    unitType: "GB",
    metaTitle: "USB Drives - Compare Price Per GB | RealPriceData",
    metaDescription:
      "Compare USB flash drive prices by storage capacity. Find the best value on portable storage solutions.",
  },
  "microsd-cards": {
    name: "MicroSD Cards",
    slug: "microsd-cards",
    description: "Expandable storage for devices",
    icon: Smartphone,
    parent: "electronics",
    unitType: "GB",
    metaTitle: "MicroSD Cards - Compare Price Per GB | RealPriceData",
    metaDescription:
      "Find the best microSD card deals by comparing price per gigabyte. Perfect for phones, cameras, and tablets.",
  },
  batteries: {
    name: "Batteries",
    slug: "batteries",
    description: "AA, AAA, and coin cells",
    icon: Battery,
    parent: "electronics",
    unitType: "count",
    metaTitle: "Batteries - Compare Price Per Count | RealPriceData",
    metaDescription:
      "Compare battery prices by count. Find the best bulk deals on AA, AAA, and specialty batteries.",
  },

  // Groceries Children
  coffee: {
    name: "Coffee",
    slug: "coffee",
    description: "Whole bean, ground, and pods",
    icon: Coffee,
    parent: "groceries",
    unitType: "kg",
    metaTitle: "Coffee - Compare Price Per Kilogram | RealPriceData",
    metaDescription:
      "Find the best coffee deals by comparing price per kilogram. Compare whole bean, ground, and pod options.",
  },
  "protein-powder": {
    name: "Protein Powder",
    slug: "protein-powder",
    description: "Whey, casein, and plant-based",
    icon: Milk,
    parent: "groceries",
    unitType: "kg",
    metaTitle: "Protein Powder - Compare Price Per Kilogram | RealPriceData",
    metaDescription:
      "Compare protein powder prices by weight. Find the best value on whey, casein, and plant-based protein supplements.",
  },
  "rice-and-pasta": {
    name: "Rice & Pasta",
    slug: "rice-and-pasta",
    description: "Bulk grains and noodles",
    icon: Wheat,
    parent: "groceries",
    unitType: "kg",
    metaTitle: "Rice & Pasta - Compare Price Per Kilogram | RealPriceData",
    metaDescription:
      "Find the best bulk rice and pasta deals by comparing price per kilogram. Stock up and save.",
  },
  snacks: {
    name: "Snacks",
    slug: "snacks",
    description: "Chips, nuts, and bars",
    icon: Utensils,
    parent: "groceries",
    unitType: "kg",
    metaTitle: "Snacks - Compare Price Per Kilogram | RealPriceData",
    metaDescription:
      "Compare snack prices by weight. Find the best value on chips, nuts, protein bars, and more.",
  },

  // Home Children
  "laundry-detergent": {
    name: "Laundry Detergent",
    slug: "laundry-detergent",
    description: "Liquid, powder, and pods",
    icon: Droplets,
    parent: "home",
    unitType: "load",
    metaTitle: "Laundry Detergent - Compare Price Per Load | RealPriceData",
    metaDescription:
      "Find the best laundry detergent deals by comparing price per load. Compare liquid, powder, and pod options.",
  },
  "paper-products": {
    name: "Paper Products",
    slug: "paper-products",
    description: "Toilet paper and paper towels",
    icon: Home,
    parent: "home",
    unitType: "sheet",
    metaTitle: "Paper Products - Compare Price Per Sheet | RealPriceData",
    metaDescription:
      "Compare toilet paper and paper towel prices by sheet count. Find the best bulk deals.",
  },
  "trash-bags": {
    name: "Trash Bags",
    slug: "trash-bags",
    description: "Kitchen and outdoor bags",
    icon: Trash2,
    parent: "home",
    unitType: "count",
    metaTitle: "Trash Bags - Compare Price Per Count | RealPriceData",
    metaDescription:
      "Find the best trash bag deals by comparing price per bag. Compare kitchen, outdoor, and specialty sizes.",
  },
  "dishwasher-tabs": {
    name: "Dishwasher Tabs",
    slug: "dishwasher-tabs",
    description: "Pods and tablets",
    icon: Droplets,
    parent: "home",
    unitType: "count",
    metaTitle: "Dishwasher Tabs - Compare Price Per Count | RealPriceData",
    metaDescription:
      "Compare dishwasher tab prices by count. Find the best bulk deals on pods and tablets.",
  },

  // Legacy mappings for backward compatibility
  storage: {
    name: "Hard Drives & SSDs",
    slug: "hard-drives",
    description: "HDD and SSD storage solutions",
    icon: HardDrive,
    parent: "electronics",
    unitType: "TB",
    hidden: true,
  },
  diapers: {
    name: "Diapers",
    slug: "diapers",
    description: "Baby diapers and training pants",
    icon: Home,
    parent: "home",
    unitType: "count",
  },
};

// Get category hierarchy (parent with children)
export function getCategoryHierarchy(): CategoryHierarchy[] {
  const hierarchies: CategoryHierarchy[] = [];
  const parents = Object.values(allCategories).filter((cat) => !cat.parent && !cat.hidden);

  parents.forEach((parent) => {
    const children = Object.values(allCategories).filter(
      (cat) => cat.parent === parent.slug && !cat.hidden
    );
    hierarchies.push({ parent, children });
  });

  return hierarchies;
}

// Get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return allCategories[slug];
}

// Get parent category for a given category
export function getParentCategory(categorySlug: string): Category | undefined {
  const category = allCategories[categorySlug];
  if (!category?.parent) return undefined;
  return allCategories[category.parent];
}

// Get children of a parent category
export function getChildCategories(parentSlug: string): Category[] {
  return Object.values(allCategories).filter(
    (cat) => cat.parent === parentSlug && !cat.hidden
  );
}

// Get breadcrumb trail for a category
export function getBreadcrumbs(categorySlug: string): Category[] {
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
export function getCategoryPath(categorySlug: string, countryCode?: string): string {
  const category = allCategories[categorySlug];
  if (!category) return "/";

  let path = "";
  
  if (category.parent) {
    path = `/${category.parent}/${category.slug}`;
  } else {
    path = `/${category.slug}`;
  }
  
  // Prepend country code if provided
  if (countryCode) {
    path = `/${countryCode}${path}`;
  }
  
  return path;
}
