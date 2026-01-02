import type { CategorySlug } from "./categories";
import type { FAQItem } from "@/components/category/FAQSchema";

/**
 * Category FAQs for structured data (SEO)
 * These appear in Google search results as rich snippets
 */
export const categoryFAQs: Record<CategorySlug, FAQItem[]> = {
  // Parent category - no FAQs needed for parent categories
  electronics: [],

  // Hard Drives & SSDs
  "hard-drives": [
    {
      question: "What is the best value SSD right now?",
      answer:
        "The best value SSD depends on your needs. For most users, NVMe SSDs with a price per terabyte under $50/TB offer excellent value. Check our real-time price comparisons to find the current best deals on SSDs by price per TB.",
    },
    {
      question: "How much should I pay per TB for an SSD?",
      answer:
        "In 2025, a good price per TB for consumer NVMe SSDs is between $40-60/TB for Gen 4 drives. Budget SATA SSDs can be found for $30-40/TB. Premium Gen 5 SSDs command higher prices around $80-120/TB.",
    },
    {
      question: "Is SSD or HDD better for storage?",
      answer:
        "SSDs are faster, more durable, and consume less power, making them better for boot drives and frequently accessed files. HDDs offer better price per TB for bulk storage and archival purposes. Many users combine both for optimal cost and performance.",
    },
    {
      question: "What's the difference between NVMe and SATA SSDs?",
      answer:
        "NVMe SSDs connect directly to the PCIe bus and offer speeds up to 7,000+ MB/s, while SATA SSDs are limited to around 550 MB/s. NVMe drives are ideal for gaming and creative work. SATA SSDs are more affordable and still much faster than HDDs.",
    },
    {
      question: "How do I calculate price per terabyte?",
      answer:
        "Divide the total price by the capacity in terabytes. For example, a 2TB drive costing $100 has a price per TB of $50. Our tool does this automatically, helping you compare true value across different capacities.",
    },
  ],

  // RAM & Memory
  ram: [
    {
      question: "How much RAM do I need for gaming in 2025?",
      answer:
        "For modern gaming, 16GB is the minimum recommended, but 32GB provides headroom for streaming, multitasking, and future games. 64GB is only necessary for professional content creation or heavy workstation use.",
    },
    {
      question: "Is DDR5 worth the upgrade over DDR4?",
      answer:
        "DDR5 offers higher bandwidth and will be the standard for new platforms. However, DDR4 still provides excellent performance at lower cost. If you're building a new Intel 12th/13th gen or AMD Ryzen 7000 series system, DDR5 is recommended. For older platforms, DDR4 remains the better value.",
    },
    {
      question: "What is a good price per GB for RAM?",
      answer:
        "In 2025, DDR4 RAM typically costs $2-4 per GB, while DDR5 ranges from $3-6 per GB. Look for deals under these thresholds for good value. Our price tracker helps you find the best deals by comparing price per gigabyte.",
    },
    {
      question: "Does RAM speed really matter for gaming?",
      answer:
        "RAM speed has a moderate impact on gaming performance, especially with AMD Ryzen CPUs. For Intel, the difference is smaller. DDR4-3200 or DDR5-5600 are sweet spots that balance price and performance for most gamers.",
    },
    {
      question: "What does CAS latency (CL) mean for RAM?",
      answer:
        "CAS latency (CL) measures how many clock cycles it takes for RAM to respond to a request. Lower is better. However, effective latency depends on both CL and speed. DDR4-3200 CL16 has similar real-world latency to DDR4-3600 CL18.",
    },
  ],

  // Power Supplies
  "power-supplies": [
    {
      question: "How many watts do I need for my gaming PC?",
      answer:
        "Most gaming PCs need 650-850W. A system with an RTX 4070 needs about 650W, while RTX 4080/4090 builds should have 850W or more. Use a PSU calculator or add 100-150W headroom above your estimated total draw.",
    },
    {
      question: "What does 80 Plus certification mean?",
      answer:
        "80 Plus certification indicates power supply efficiency. 80+ Bronze is at least 82% efficient, Gold is 87%, Platinum is 90%, and Titanium is 94% at typical loads. Higher efficiency means less wasted energy as heat and lower electricity bills.",
    },
    {
      question: "Is a modular PSU worth it?",
      answer:
        "Modular PSUs allow you to use only the cables you need, improving airflow and cable management. Fully modular units cost more but make building easier. Semi-modular PSUs offer a good balance of convenience and value.",
    },
    {
      question: "What is a good price per watt for a PSU?",
      answer:
        "For 80+ Gold PSUs, expect to pay around $0.10-0.15 per watt. Bronze units are cheaper at $0.08-0.12/W, while Platinum can reach $0.15-0.25/W. Our tracker compares price per watt to help you find the best value.",
    },
    {
      question:
        "What's the difference between ATX, SFX, and SFX-L power supplies?",
      answer:
        "ATX is the standard desktop size (150mm x 86mm x 140-180mm). SFX is smaller (125mm x 63.5mm x 100mm) for compact builds. SFX-L is slightly larger than SFX with better cooling. Choose based on your case compatibility.",
    },
  ],
};

/**
 * Get FAQs for a specific category
 */
export function getCategoryFAQs(
  categorySlug: CategorySlug | string,
): FAQItem[] {
  return categoryFAQs[categorySlug as CategorySlug] || [];
}
