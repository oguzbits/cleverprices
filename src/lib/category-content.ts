import { CategorySlug } from "./categories";

export interface CategoryContent {
  title: string;
  intro: string;
  guide?: {
    title: string;
    content: string;
  }[];
}

export const categoryContent: Record<CategorySlug, CategoryContent> = {
  electronics: {
    title: "Electronics Price Tracker",
    intro:
      "Find the best value electronics by comparing price per unit (GB, TB, Watt). We track real-time prices across major retailers.",
  },
  "hard-drives": {
    title: "Best Hard Drives & SSDs (Price per TB)",
    intro:
      "Finding the best storage value requires looking beyond the sticker price. We calculate the true cost per terabyte for hundreds of HDDs and SSDs daily. Whether you need a lightning-fast Gen4 NVMe for your PS5 or a high-capacity drive for your NAS, our price-per-TB comparison helps you spot the best deals instantly.",
    guide: [
      {
        title: "SSD vs. HDD: Which do you need?",
        content:
          "Solid State Drives (SSDs) are essential for operating systems, games, and applications due to their speed. Hard Disk Drives (HDDs) remain the king of cheap bulk storage, ideal for backups, media servers, and NAS setups.",
      },
      {
        title: "NVMe vs. SATA",
        content:
          "Modern NVMe M.2 drives communicate directly with your CPU via PCIe lanes, offering speeds up to 7,000 MB/s or more. older SATA SSDs cap out around 550 MB/s but are still excellent for game libraries and secondary storage.",
      },
    ],
  },
  ram: {
    title: "Best RAM Deals (Price per GB)",
    intro:
      "Memory prices fluctuate constantly. We track the price per gigabyte for DDR4 and DDR5 kits to ensure you get the most capacity for your money. From budget 16GB kits to high-end 64GB RGB modules, find the sweet spot for your build.",
    guide: [
      {
        title: "DDR4 vs. DDR5",
        content:
          "DDR5 is the new standard for Ryzen 7000 and Intel 12th/13th/14th Gen, offering higher bandwidth and future-proofing. DDR4 remains a cost-effective choice for AM4 and older Intel platforms, often offering better bang-for-buck for budget builds.",
      },
      {
        title: "Capacity vs. Speed",
        content:
          "For gaming, 32GB is becoming the new recommended standard (2x16GB). Speed matters (e.g., 6000MHz CL30 for Ryzen), but capacity is king. Don't overspend on speed if it means compromising on capacity.",
      },
    ],
  },
  "power-supplies": {
    title: "Best Power Supplies (Price per Watt)",
    intro:
      "A quality PSU is the heart of your PC. We compare power supplies based on price per watt, efficiency, and modularity. calculate the true value of Gold and Platinum rated units to power your GPU safely.",
    guide: [
      {
        title: "How much wattage do you need?",
        content:
          "As a rule of thumb, aim for 50-60% load for peak efficiency. For an RTX 4070 build, 650W is plenty. For RTX 4080/4090, target 850W or 1000W to handle transient spikes and future upgrades.",
      },
      {
        title: "Efficiency Ratings",
        content:
          "80+ Gold is the sweet spot for most gamers, offering ~90% efficiency without the premium price of Platinum or Titanium units. Avoid unrated units for gaming PCs.",
      },
    ],
  },
};

export function getCategoryContent(
  slug: CategorySlug,
): CategoryContent | undefined {
  return categoryContent[slug];
}
