import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true, // Enable "use cache" directive for caching
  // Configure MDX file extensions
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Enable experimental features for better performance
  experimental: {
    ppr: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
  // Cache Life Profiles for Next.js 16 "use cache"
  cacheLife: {
    category: {
      stale: 39600, // 11 hours
      revalidate: 39600,
      expire: 604800,
    },
    product: {
      stale: 21600, // 6 hours
      revalidate: 21600,
      expire: 604800,
    },
    static: {
      stale: 86400, // 24 hours
      revalidate: 86400,
      expire: 2592000, // 30 days
    },
    // Keep legacy name for backward compatibility during migration
    prices: {
      stale: 39600,
      revalidate: 39600,
      expire: 604800,
    },
  },
  // Optimize images
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    qualities: [50, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
        pathname: "/images/**",
      },
    ],
  },
  async redirects() {
    return [
      // Legacy Product URL Redirects (Top Traffic Recovery)
      {
        source: "/p/wd-black-sn850x-2tb",
        destination: "/p/sandisk-technologies-inc-wd-black-sn850x-2tb-z3qh",
        permanent: true,
      },
      {
        source: "/p/samsung-990-pro-2tb",
        destination: "/p/samsung-990-pro-schwarz-2tb-dkkg",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-i7-12700kf-12-generation-desktop-prozessor-basistakt-36ghz-turboboost-50ghz-b09gyjj1pt",
        destination:
          "/p/intel-core-i7-12700kf-12-generation-desktop-128gb-j1pt",
        permanent: true,
      },
      {
        source:
          "/p/sony-sony-bravia-7-qled-xr-l-mini-led-75-zoll-4k-hdr-google-smart-tv-2024-gaming-funktionen-i-b0d1vv4pzj",
        destination:
          "/p/sony-bravia-7-qled-xr-l-mini-led-75-zoll-4k-75zoll-4pzj",
        permanent: true,
      },
      {
        source:
          "/p/sony-sony-wh-1000xm5-kabelloser-premium-kopfhrer-mit-noise-cancelling-bluetooth-kristallklare-anr-b0bxm22x99",
        destination:
          "/p/sony-kabelloser-premium-kopfh-rer-mit-noise-1stück-2x99",
        permanent: true,
      },
      {
        source:
          "/p/samsung-samsung-galaxy-s25-ultra-ai-smartphone-mit-galaxy-ai-ohne-vertrag-handy-mit-android-12-gb-b0dpn99s7q",
        destination: "/p/samsung-galaxy-s25-ultra-ai-smartphone-mit-12gb-9s7q",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-i7-9700f-prozessor-12m-cache-bis-zu-470-ghz-b07rylfg3d",
        destination: "/p/intel-core-i7-9700f-prozessor-12m-cache-bis-fg3d",
        permanent: true,
      },
      {
        source: "/p/motorola-motorola-handy-moto-g86-5g-256gb-b0f7rtgckm",
        destination: "/p/motorola-handy-moto-g86-5g-256gb-gckm",
        permanent: true,
      },
      {
        source:
          "/p/playstation-playstation5-digital-edition-bundle-mit-zweitem-dualsense-wireless-controller-b0cqmf3vjk",
        destination: "/p/playstation-5-digital-edition-bundle-mit-3vjk",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-ultra-7-desktop-prozessor-265-20-kerne-8-p-cores-12-e-cores-bis-zu-53-ghz-b0dtryq6b1",
        destination: "/p/intel-core-ultra-7-desktop-prozessor-265-20-q6b1",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-i9-12900k-12-generation-desktop-prozessor-basistakt-32ghz-turboboost-52ghz-b09gylb4j6",
        destination: "/p/intel-core-i9-12900k-12-generation-desktop-128gb-b4j6",
        permanent: true,
      },

      // --- Category Coverage Fixes (Flattened Hierarchy) ---
      {
        source: "/computer/tablet-accessories",
        destination: "/tablet-accessories",
        permanent: true,
      },
      {
        source: "/drucker-scanner/3d-drucker",
        destination: "/3d-drucker",
        permanent: true,
      },
      {
        source: "/telekommunikation/samsung-galaxy",
        destination: "/samsung-galaxy",
        permanent: true,
      },
      {
        source: "/fotografie/systemkameras",
        destination: "/systemkameras",
        permanent: true,
      },
      {
        source: "/drucker-scanner/multifunktionsdrucker",
        destination: "/multifunktionsdrucker",
        permanent: true,
      },
      {
        source: "/fotografie/kompaktkameras",
        destination: "/kompaktkameras",
        permanent: true,
      },
      {
        source: "/drucker-scanner/laserdrucker",
        destination: "/laserdrucker",
        permanent: true,
      },
      {
        source: "/fotografie/speicherkarten",
        destination: "/speicherkarten",
        permanent: true,
      },
      {
        source: "/telekommunikation/apple-iphone",
        destination: "/apple-iphone",
        permanent: true,
      },
      {
        source: "/elektroartikel/radios",
        destination: "/radios",
        permanent: true,
      },
      { source: "/pc-komponenten/ram", destination: "/ram", permanent: true },
      {
        source: "/pc-komponenten/pc-cases",
        destination: "/pc-cases",
        permanent: true,
      },
      {
        source: "/computer/mouse-pads",
        destination: "/mouse-pads",
        permanent: true,
      },
      {
        source: "/elektroartikel/soundbars",
        destination: "/soundbars",
        permanent: true,
      },
      {
        source: "/computer/pc-komponenten",
        destination: "/pc-komponenten",
        permanent: true,
      },
      {
        source: "/pc-komponenten/storage",
        destination: "/storage",
        permanent: true,
      },
      {
        source: "/computer/keyboards",
        destination: "/keyboards",
        permanent: true,
      },
      { source: "/pc-komponenten/cpu", destination: "/cpu", permanent: true },
      {
        source: "/elektroartikel/elektrische-zahnb%C3%BCrsten",
        destination: "/elektrische-zahnbuersten",
        permanent: true,
      }, // Encoding check
      {
        source: "/elektroartikel/elektrische-zahnbürsten",
        destination: "/elektrische-zahnbuersten",
        permanent: true,
      }, // Literal check
      {
        source: "/elektroartikel/staubsauger",
        destination: "/staubsauger",
        permanent: true,
      },
      {
        source: "/computer/capture-cards",
        destination: "/capture-cards",
        permanent: true,
      },
      {
        source: "/computer/network-switches",
        destination: "/network-switches",
        permanent: true,
      },
      {
        source: "/elektroartikel/fotografie",
        destination: "/fotografie",
        permanent: true,
      },

      // --- Legacy English/V1 Path Corrections ---
      { source: "/electronics/ram", destination: "/ram", permanent: true },
      {
        source: "/electronics/webcams",
        destination: "/webcams",
        permanent: true,
      },
      {
        source: "/electronics/hard-drives",
        destination: "/hard-drives",
        permanent: true,
      },
      {
        source: "/electronics/monitors",
        destination: "/monitors",
        permanent: true,
      },
      {
        source: "/electronics/routers",
        destination: "/routers",
        permanent: true,
      },
      {
        source: "/electronics/pc-cases",
        destination: "/pc-cases",
        permanent: true,
      },
      {
        source: "/electronics/game-controllers",
        destination: "/game-controllers",
        permanent: true,
      },
      {
        source: "/electronics/cable-management",
        destination: "/cable-management",
        permanent: true,
      },
      { source: "/electronics/gpu", destination: "/gpu", permanent: true },

      // --- Country Prefix Removal (Consolidate traffic to root) ---
      // Specific commonly hit paths first
      {
        source: "/de/drucker-scanner/laserdrucker",
        destination: "/laserdrucker",
        permanent: true,
      },
      {
        source: "/de/computer/mouse-pads",
        destination: "/mouse-pads",
        permanent: true,
      },
      {
        source: "/de/elektroartikel/soundbars",
        destination: "/soundbars",
        permanent: true,
      },
      {
        source: "/de/elektroartikel/drones",
        destination: "/drones",
        permanent: true,
      },
      {
        source: "/de/computer/network-switches",
        destination: "/network-switches",
        permanent: true,
      },
      {
        source: "/de/electronics/:path*",
        destination: "/:path*",
        permanent: true,
      },

      // Generic country Prefix Stripping (Catch-all for de/ca/fr/uk/it)
      { source: "/de/:path*", destination: "/:path*", permanent: true },
      { source: "/ca/:path*", destination: "/:path*", permanent: true },
      { source: "/fr/:path*", destination: "/:path*", permanent: true },
      { source: "/uk/:path*", destination: "/:path*", permanent: true },
      { source: "/it/:path*", destination: "/:path*", permanent: true },

      // --- Outbound Link Fixes ---
      {
        source:
          "/out/tecknet-wireless-vertikale-ergonomische-maus-4800-dpi-5-tasten-kabellose-optisch-b0dh1mg23d",
        destination: "/mice?brand=TeckNet", // Safe fallback to category+brand filter
        permanent: true,
      },
      {
        source: "/out/seagate-ironwolf-pro-16tb",
        destination: "/hard-drives?brand=Seagate&capacity=16",
        permanent: true,
      },
    ];
  },
};

// Wrap config with MDX support
const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [
      "remark-gfm",
      ["remark-frontmatter", { type: "yaml", marker: "-" }],
      "remark-mdx-frontmatter",
    ],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
