import {
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_COUNTRY, type CountryCode } from "./countries";
import { BRAND_DOMAIN } from "./site-config";

export type UnitType = "TB" | "GB" | "W";

export type CategorySlug =
  | "electronics"
  | "hard-drives"
  | "ram"
  | "ram"
  | "power-supplies"
  | "cpu"
  | "gpu";

export interface Category {
  name: string;
  slug: CategorySlug;
  description: string;
  icon: LucideIcon;
  parent?: CategorySlug; // Parent category slug
  metaTitle?: string;
  metaDescription?: string;
  unitType?: UnitType; // e.g., "TB", "GB", "W"
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
    name: "Electronics",
    description: "Digital storage solutions - compare price per terabyte",
    icon: HardDrive,
    metaTitle: `Hard Drive Storage - Best Price Per TB | ${BRAND_DOMAIN}`,
    metaDescription:
      "Compare hard drive and SSD prices by cost per terabyte. Find the best deals on storage from top brands like Samsung, WD, Seagate, and Crucial.",
  },

  // Electronics Children (ONLY monetized categories)
  "hard-drives": {
    name: "Hard Drives & SSDs",
    description: "HDD and SSD storage solutions - compare price per TB",
    icon: HardDrive,
    parent: "electronics",
    unitType: "TB",
    metaTitle: `Hard Drives & SSDs - Compare Price Per TB | ${BRAND_DOMAIN}`,
    metaDescription:
      "Find the best hard drive and SSD deals by comparing price per terabyte. Compare internal and external storage from top brands.",
    popularFilters: [
      { label: "SSDs", params: "technology=SSD" },
      { label: "HDDs", params: "technology=HDD" },
      { label: "NVMe SSDs", params: "formFactor=M.2+NVMe" },
    ],
    aliases: ["disks", "storage", "hdd", "ssd"],
  },

  ram: {
    name: "RAM & Memory",
    description: "DDR4 and DDR5 RAM modules - compare price per GB",
    icon: MemoryStick,
    parent: "electronics",
    unitType: "GB",
    metaTitle: `RAM & Memory - Compare Price Per GB | ${BRAND_DOMAIN}`,
    metaDescription:
      "Find the best RAM and memory deals by comparing price per gigabyte. Compare DDR4 and DDR5 modules from top brands like Crucial, Lexar, and Patriot.",
    popularFilters: [
      { label: "DDR4 RAM", params: "technology=DDR4" },
      { label: "DDR5 RAM", params: "technology=DDR5" },
      { label: "Laptop RAM", params: "formFactor=SO-DIMM" },
    ],
    aliases: ["memory"],
  },

  "power-supplies": {
    name: "Power Supplies",
    description: "ATX and SFX power supplies - compare price per Watt",
    icon: Zap,
    parent: "electronics",
    unitType: "W",
    metaTitle: `Power Supplies - Compare Price Per Watt | ${BRAND_DOMAIN}`,
    metaDescription:
      "Find the best power supply deals by comparing price per watt. Compare 80+ Bronze, Gold, and Platinum PSUs from top brands.",
    popularFilters: [
      { label: "80+ Gold PSUs", params: "technology=80%2B+Gold" },
    ],
    aliases: ["psu"],
  },

  cpu: {
    name: "CPUs",
    description: "Compare processors by core count and speed",
    icon: Cpu,
    parent: "electronics",
    hidden: true,
    metaTitle: `Processors (CPUs) - Compare Prices | ${BRAND_DOMAIN}`,
    metaDescription:
      "Find the best prices on Intel and AMD processors. Compare core counts, clock speeds, and benchmarks.",
    popularFilters: [
      { label: "Intel Core i7", params: "brand=Intel&series=Core+i7" },
      { label: "AMD Ryzen 7", params: "brand=AMD&series=Ryzen+7" },
    ],
    aliases: ["processors", "chips"],
  },

  gpu: {
    name: "Graphics Cards",
    description: "Compare GPUs by VRAM and performance",
    icon: Monitor,
    parent: "electronics",
    hidden: true,
    unitType: "GB",
    metaTitle: `Graphics Cards (GPUs) - Compare Prices | ${BRAND_DOMAIN}`,
    metaDescription:
      "Find the best graphics card deals. Compare NVIDIA GeForce and AMD Radeon GPUs by price and performance.",
    popularFilters: [
      { label: "NVIDIA RTX 4070", params: "brand=NVIDIA&model=RTX+4070" },
      { label: "12GB+ VRAM", params: "min_memory=12" },
    ],
    aliases: ["video-cards", "vga"],
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
export function getCategoryPath(
  categorySlug: CategorySlug,
  countryCode?: CountryCode,
): string {
  const category = allCategories[categorySlug];
  if (!category) return "/";

  let path = "";

  if (category.parent) {
    path = `/${category.parent}/${category.slug}`;
  } else {
    path = `/${category.slug}`;
  }

  // Prepend country code if provided, but skip if it's the default country (US)
  // US content is served from root, not /us/
  if (countryCode && countryCode.toLowerCase() !== DEFAULT_COUNTRY) {
    path = `/${countryCode.toLowerCase()}${path}`;
  }

  return path;
}

// Return a copy of the category without the icon function (for serialization)
export function stripCategoryIcon(category: Category): Omit<Category, "icon"> {
  const { icon, ...rest } = category;
  return JSON.parse(JSON.stringify(rest));
}
