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
  cpu: {
    title: "Best CPUs (Compare Processors)",
    intro:
      "Compare Intel and AMD processors by price, core count, and performance. Find the best CPU deals for gaming, content creation, and workstation builds.",
  },
  gpu: {
    title: "Best Graphics Cards (Compare GPUs)",
    intro:
      "Compare NVIDIA GeForce and AMD Radeon graphics cards by price and VRAM. Find the best GPU deals for gaming and creative workloads.",
  },
  monitors: {
    title: "Best Monitors (Compare Displays)",
    intro:
      "Compare computer monitors by price, resolution, refresh rate, and panel type. Find the best deals on 4K, ultrawide, and gaming displays.",
  },
  keyboards: {
    title: "Best Keyboards (Compare Prices)",
    intro:
      "Compare mechanical and membrane keyboards by price, switch type, and features. Find the best deals on gaming and productivity keyboards.",
  },
  mice: {
    title: "Best Computer Mice (Compare Prices)",
    intro:
      "Compare gaming and productivity mice by price, DPI, and ergonomics. Find the best deals from Logitech, Razer, and more.",
  },
  headphones: {
    title: "Best Headphones (Compare Prices)",
    intro:
      "Compare over-ear, in-ear, and gaming headsets by price and features. Find the best deals on noise-cancelling and wireless headphones.",
  },
  webcams: {
    title: "Best Webcams (Compare Prices)",
    intro:
      "Compare HD and 4K webcams for streaming, video calls, and content creation. Find the best deals on Logitech, Razer, and more.",
  },
  "external-storage": {
    title: "External Storage (Price per TB)",
    intro:
      "Compare external hard drives and portable SSDs by price per TB. Find the best value on WD, Seagate, Samsung, and SanDisk.",
  },
  routers: {
    title: "WiFi Routers (Compare Prices)",
    intro:
      "Compare WiFi 6 and WiFi 7 routers from ASUS, TP-Link, Netgear, and more. Find the best mesh systems.",
  },
  nas: {
    title: "NAS Systems (Compare Prices)",
    intro:
      "Compare network attached storage from Synology, QNAP, and more. Find the best home server and media storage deals.",
  },
  "usb-hubs": {
    title: "USB Hubs (Compare Prices)",
    intro:
      "Compare USB-C and USB-A hubs with multiple ports. Find powered hubs and docking solutions.",
  },
  speakers: {
    title: "Computer Speakers (Compare Prices)",
    intro:
      "Compare PC speakers, soundbars, and 2.1 audio systems. Find deals from Logitech, Creative, and more.",
  },
  microphones: {
    title: "Microphones (Compare Prices)",
    intro:
      "Compare USB and XLR microphones for streaming, gaming, and podcasting. Find deals on Blue, Rode, and Shure.",
  },
  "gaming-chairs": {
    title: "Gaming Chairs (Compare Prices)",
    intro:
      "Compare gaming chairs from Secretlab, Noblechairs, and more. Find ergonomic chairs for long sessions.",
  },
  tablets: {
    title: "Tablets (Compare Prices)",
    intro:
      "Compare tablets from Apple, Samsung, and Lenovo. Find deals on iPads, Android tablets, and drawing tablets.",
  },
  smartwatches: {
    title: "Smartwatches (Compare Prices)",
    intro:
      "Compare smartwatches from Apple, Samsung, Garmin, and Fitbit. Find fitness trackers and smart bands.",
  },
  cables: {
    title: "Cables & Adapters (Compare Prices)",
    intro:
      "Compare USB-C, HDMI, and DisplayPort cables. Find adapters and accessories for your setup.",
  },
  "laptop-stands": {
    title: "Laptop Stands (Compare Prices)",
    intro:
      "Compare laptop stands, risers, and cooling pads. Improve your ergonomic workspace setup.",
  },
  "mouse-pads": {
    title: "Mouse Pads (Compare Prices)",
    intro:
      "Compare gaming mouse pads and desk mats. Find extended XXL pads and RGB options.",
  },
  "docking-stations": {
    title: "Docking Stations (Compare Prices)",
    intro:
      "Compare USB-C and Thunderbolt docking stations. Expand your laptop connectivity.",
  },
  ups: {
    title: "UPS Battery Backup (Compare Prices)",
    intro:
      "Compare uninterruptible power supplies from APC, CyberPower, and Eaton. Protect your equipment.",
  },
  "pc-cases": {
    title: "PC Cases (Compare Prices)",
    intro:
      "Compare computer cases from Fractal Design, NZXT, Corsair, and more. ATX, mATX, and ITX options.",
  },
  "cpu-coolers": {
    title: "CPU Coolers (Compare Prices)",
    intro:
      "Compare air and AIO liquid CPU coolers. Find deals on Noctua, be quiet!, Corsair, and more.",
  },
  "case-fans": {
    title: "Case Fans (Compare Prices)",
    intro:
      "Compare PC case fans from Noctua, Arctic, Corsair, and more. RGB and high-airflow options.",
  },
  "thermal-paste": {
    title: "Thermal Paste (Compare Prices)",
    intro:
      "Compare thermal compounds from Noctua, Thermal Grizzly, and Arctic. Find the best thermal paste.",
  },
  "network-switches": {
    title: "Network Switches (Compare Prices)",
    intro:
      "Compare network switches from TP-Link, Netgear, and Ubiquiti. Managed and unmanaged options.",
  },
  "network-cards": {
    title: "Network Cards (Compare Prices)",
    intro:
      "Compare WiFi and Ethernet adapters. PCIe and USB network cards for desktop and laptop.",
  },
  "cable-management": {
    title: "Cable Management (Compare Prices)",
    intro:
      "Compare cable management solutions. Cable ties, sleeves, trays, and organizers.",
  },
  "monitor-arms": {
    title: "Monitor Arms (Compare Prices)",
    intro:
      "Compare monitor arms and mounts. Single and dual monitor options from Ergotron and more.",
  },
  "desk-accessories": {
    title: "Desk Accessories (Compare Prices)",
    intro:
      "Compare desk accessories. Desk lamps, organizers, and workspace essentials.",
  },
  "office-chairs": {
    title: "Office Chairs (Compare Prices)",
    intro:
      "Compare ergonomic office chairs from Herman Miller, Steelcase, and affordable alternatives.",
  },
  "standing-desks": {
    title: "Standing Desks (Compare Prices)",
    intro:
      "Compare standing desks and sit-stand desks. Electric and manual height-adjustable options.",
  },
  "tablet-accessories": {
    title: "Tablet Accessories (Compare Prices)",
    intro:
      "Compare tablet cases, stands, and styluses for iPad and Android tablets.",
  },
  "phone-accessories": {
    title: "Phone Accessories (Compare Prices)",
    intro:
      "Compare phone cases, wireless chargers, and accessories for iPhone and Android.",
  },
  "game-controllers": {
    title: "Game Controllers (Compare Prices)",
    intro:
      "Compare game controllers and gamepads from Xbox, PlayStation, and third-party brands.",
  },
  "vr-headsets": {
    title: "VR Headsets (Compare Prices)",
    intro:
      "Compare VR headsets from Meta Quest, HTC Vive, and Valve Index. Standalone and PC VR.",
  },
  "capture-cards": {
    title: "Capture Cards (Compare Prices)",
    intro:
      "Compare capture cards from Elgato, AVerMedia, and more. USB and PCIe streaming options.",
  },
  motherboards: {
    title: "Best Motherboards (Compare Boards)",
    intro:
      "Compare motherboards for Intel and AMD builds. Find the best Z790, B650, and X670 boards for your gaming or productivity PC.",
  },
  smartphones: {
    title: "Best Smartphones (Compare Prices)",
    intro:
      "Compare smartphone prices from top brands like Apple, Samsung, Google, and Xiaomi. Find the best deals on the latest iPhones and Android devices.",
  },
  tvs: {
    title: "Best TVs (Compare Prices)",
    intro:
      "Compare 4K, OLED, and QLED TV prices. Find the best deals on televisions from LG, Samsung, Sony, and more for home theater and gaming.",
  },
  laptops: {
    title: "Best Laptops (Compare Prices)",
    intro:
      "Compare laptop prices from Apple, Dell, Lenovo, HP, and more. Find the best deals on MacBooks, gaming laptops, and ultrabooks.",
  },
  consoles: {
    title: "Best Consoles (Compare Prices)",
    intro:
      "Compare prices for PlayStation 5, Xbox Series X/S, and Nintendo Switch. Find the best deals on gaming consoles and bundles.",
  },
};

export function getCategoryContent(
  slug: CategorySlug,
): CategoryContent | undefined {
  return categoryContent[slug];
}
