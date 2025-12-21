import { HardDrive, MemoryStick, Zap, type LucideIcon } from "lucide-react";

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
  // Parent Category
  electronics: {
    name: "Electronics",
    slug: "electronics",
    description: "Digital storage solutions - compare price per terabyte",
    icon: HardDrive,
    metaTitle: "Hard Drive Storage - Best Price Per TB | RealPriceData",
    metaDescription:
      "Compare hard drive and SSD prices by cost per terabyte. Find the best deals on storage from top brands like Samsung, WD, Seagate, and Crucial.",
  },

  // Electronics Children (ONLY monetized categories)
  "hard-drives": {
    name: "Hard Drives & SSDs",
    slug: "hard-drives",
    description: "HDD and SSD storage solutions - compare price per TB",
    icon: HardDrive,
    parent: "electronics",
    unitType: "TB",
    metaTitle: "Hard Drives & SSDs - Compare Price Per TB | RealPriceData",
    metaDescription:
      "Find the best hard drive and SSD deals by comparing price per terabyte. Compare internal and external storage from top brands.",
  },

  "ram": {
    name: "RAM & Memory",
    slug: "ram",
    description: "DDR4 and DDR5 RAM modules - compare price per GB",
    icon: MemoryStick,
    parent: "electronics",
    unitType: "GB",
    metaTitle: "RAM & Memory - Compare Price Per GB | RealPriceData",
    metaDescription:
      "Find the best RAM and memory deals by comparing price per gigabyte. Compare DDR4 and DDR5 modules from top brands like Crucial, Lexar, and Patriot.",
  },

  "power-supplies": {
    name: "Power Supplies",
    slug: "power-supplies",
    description: "ATX and SFX power supplies - compare price per Watt",
    icon: Zap,
    parent: "electronics",
    unitType: "W",
    metaTitle: "Power Supplies - Compare Price Per Watt | RealPriceData",
    metaDescription:
      "Find the best power supply deals by comparing price per watt. Compare 80+ Bronze, Gold, and Platinum PSUs from top brands.",
  },
};

// Get category hierarchy (parent with children)
export function getCategoryHierarchy(): CategoryHierarchy[] {
  const hierarchies: CategoryHierarchy[] = [];
  const parents = Object.values(allCategories).filter(
    (cat) => !cat.parent && !cat.hidden
  );

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
export function getCategoryPath(
  categorySlug: string,
  countryCode?: string
): string {
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
