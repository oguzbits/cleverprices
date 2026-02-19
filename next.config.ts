import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  compress: false, // Offload compression to Traefik (Brotli)
  output: "standalone", // Required for Docker
  reactCompiler: true,
  cacheComponents: true,
  cacheLife: {
    category: {
      stale: 900, // 15 minutes
      revalidate: 900,
      expire: 86400, // 24 hours
    },
    product: {
      stale: 900, // 15 minutes
      revalidate: 900,
      expire: 86400, // 24 hours
    },
    static: {
      stale: 86400, // 24 hours
      revalidate: 86400,
      expire: 2592000, // 30 days
    },
    // Short-lived cache for dynamic data like prices
    dynamic: {
      stale: 600, // 10 minutes
      revalidate: 600,
      expire: 3600, // 1 hour
    },
    // Very fast cache for highly volatile data
    fast: {
      stale: 60, // 1 minute
      revalidate: 60,
      expire: 300, // 5 minutes
    },
    // Keep legacy name for backward compatibility during migration
    prices: {
      stale: 600, // 10 minutes
      revalidate: 600,
      expire: 7200, // 2 hours
    },
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "mdx",
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
  // Configure MDX file extensions
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  poweredByHeader: false,
  // Optimize images
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [
      16, 32, 48, 64, 96, 128, 160, 174, 192, 200, 224, 240, 256, 320, 350, 384,
      400, 512,
    ],
    minimumCacheTTL: 60,
    qualities: [30, 40, 50, 75],
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
        destination:
          "/p/200006395_-wd-black-sn850x-interne-2tb-sandisk-technologies-inc-z3qh",
        permanent: true,
      },
      {
        source: "/p/samsung-990-pro-2tb",
        destination: "/p/200006341_-990-pro-1stueck-samsung-dkkg",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-i7-12700kf-12-generation-desktop-prozessor-basistakt-36ghz-turboboost-50ghz-b09gyjj1pt",
        destination:
          "/p/200001288_-core-i7-12700kf-12-generation-desktop-intel-j1pt",
        permanent: true,
      },
      {
        source:
          "/p/sony-sony-bravia-7-qled-xr-l-mini-led-75-zoll-4k-hdr-google-smart-tv-2024-gaming-funktionen-i-b0d1vv4pzj",
        destination: "/p/200000554_-bravia-7-qled-sony-4pzj",
        permanent: true,
      },
      {
        source:
          "/p/sony-sony-wh-1000xm5-kabelloser-premium-kopfhrer-mit-noise-cancelling-bluetooth-kristallklare-anr-b0bxm22x99",
        destination:
          "/p/200005539_-wh-1000xm5-kabelloser-premium-kopfhoerer-mit-1stueck-sony-2x99",
        permanent: true,
      },
      {
        source:
          "/p/samsung-samsung-galaxy-s25-ultra-ai-smartphone-mit-galaxy-ai-ohne-vertrag-handy-mit-android-12-gb-b0dpn99s7q",
        destination: "/p/200003255_-galaxy-s25-ultra-mit-galaxy-samsung-9s7q",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-i7-9700f-prozessor-12m-cache-bis-zu-470-ghz-b07rylfg3d",
        destination: "/p/200001304_-core-i7-9700f-intel-fg3d",
        permanent: true,
      },
      {
        source: "/p/motorola-motorola-handy-moto-g86-5g-256gb-b0f7rtgckm",
        destination: "/p/200003921_-moto-g86-5g-motorola-gckm",
        permanent: true,
      },
      {
        source:
          "/p/playstation-playstation5-digital-edition-bundle-mit-zweitem-dualsense-wireless-controller-b0cqmf3vjk",
        destination: "/p/200001430_-playstation-5-sony-3vjk",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-ultra-7-desktop-prozessor-265-20-kerne-8-p-cores-12-e-cores-bis-zu-53-ghz-b0dtryq6b1",
        destination:
          "/p/200001314_-core-ultra-7-desktop-prozessor-265-20-kerne-intel-q6b1",
        permanent: true,
      },
      {
        source:
          "/p/intel-intel-core-i9-12900k-12-generation-desktop-prozessor-basistakt-32ghz-turboboost-52ghz-b09gylb4j6",
        destination:
          "/p/200001303_-core-i9-12900k-12-generation-desktop-intel-b4j6",
        permanent: true,
      },

      // --- Blog Slug Migration (German Localization) ---
      {
        source: "/blog/best-ssd-for-ps5-2026",
        destination: "/blog/beste-ssd-fuer-ps5-2026",
        permanent: true,
      },
      {
        source: "/blog/ssd-buying-guide-2026",
        destination: "/blog/ssd-kaufberatung-2026",
        permanent: true,
      },
      {
        source: "/blog/ram-ssd-price-trends-2025",
        destination: "/blog/ram-ssd-preistrends-2025",
        permanent: true,
      },
      {
        source: "/blog/best-ram-ssd-value-2025",
        destination: "/blog/beste-ram-ssd-angebote-2025",
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

      // --- Country Prefix Removal (Consolidated traffic to root) ---
      { source: "/de", destination: "/", permanent: true },
      { source: "/de/:path+", destination: "/:path+", permanent: true },
      { source: "/ca", destination: "/", permanent: true },
      { source: "/ca/:path+", destination: "/:path+", permanent: true },
      { source: "/fr", destination: "/", permanent: true },
      { source: "/fr/:path+", destination: "/:path+", permanent: true },
      { source: "/uk", destination: "/", permanent: true },
      { source: "/uk/:path+", destination: "/:path+", permanent: true },
      { source: "/it", destination: "/", permanent: true },
      { source: "/it/:path+", destination: "/:path+", permanent: true },

      // --- GSC 404 Fixes (January 2026) ---
      // Legacy /elektroartikel/* subcategory paths
      {
        source: "/elektroartikel/dunstabzugshauben",
        destination: "/categories", // No direct equivalent - send to category list
        permanent: true,
      },
      {
        source: "/elektroartikel/w%C3%A4schetrockner",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/wäschetrockner",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/tablets",
        destination: "/tablets",
        permanent: true,
      },
      {
        source: "/elektroartikel/notebooks",
        destination: "/notebooks",
        permanent: true,
      },
      {
        source: "/elektroartikel/waschmaschinen",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/hifi-audio",
        destination: "/hifi-audio",
        permanent: true,
      },
      {
        source: "/elektroartikel/nas",
        destination: "/nas",
        permanent: true,
      },
      {
        source: "/elektroartikel/gefrierschr%C3%A4nke",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/gefrierschränke",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/receiver",
        destination: "/receiver",
        permanent: true,
      },
      {
        source: "/elektroartikel/back%C3%B6fen",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/backöfen",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/mikrowellen",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/espressomaschinen",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/drones",
        destination: "/drones",
        permanent: true,
      },
      {
        source: "/elektroartikel/medien",
        destination: "/categories",
        permanent: true,
      },
      // Legacy /computer/* paths
      {
        source: "/computer/webcams",
        destination: "/webcams",
        permanent: true,
      },
      {
        source: "/computer/ups",
        destination: "/ups",
        permanent: true,
      },
      // Legacy /electronics/* paths not covered above
      {
        source: "/electronics/office-chairs",
        destination: "/office-chairs",
        permanent: true,
      },
      {
        source: "/electronics/phone-accessories",
        destination: "/telekommunikation",
        permanent: true,
      },
      {
        source: "/electronics/monitor-arms",
        destination: "/monitor-arms",
        permanent: true,
      },
      // Legacy /storage/* paths
      {
        source: "/storage/ssds",
        destination: "/ssds",
        permanent: true,
      },
      // Legacy /telekommunikation/* paths
      {
        source: "/telekommunikation/phone-accessories",
        destination: "/telekommunikation",
        permanent: true,
      },

      // --- Legacy Prefix Catch-alls (Fallbacks for any remaining old structure) ---
      // Note: /elektroartikel is a valid category, so no catch-all needed
      {
        source: "/electronics/:path*",
        destination: "/categories",
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

      {
        source: "/de/computer/network-switches",
        destination: "/network-switches",
        permanent: true,
      },

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

      // --- Targeted GSC Fixes (High impact 404/Soft 404) ---
      { source: "/medien", destination: "/categories", permanent: true },
      { source: "/thermal-paste", destination: "/categories", permanent: true },
      { source: "/&", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value:
              "<https://m.media-amazon.com>; rel=preconnect; crossorigin, <https://images-na.ssl-images-amazon.com>; rel=preconnect; crossorigin",
          },
        ],
      },
    ];
  },
};

import { withSentryConfig } from "@sentry/nextjs";

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

const configWithSentry = withSentryConfig(
  withBundleAnalyzer(withMDX(nextConfig)),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-javascript/blob/master/packages/nextjs/src/config/types.ts

    // Combined options for v8
    silent: true,
    org: "cleverprices",
    project: "cleverprices",

    // Upload a larger set of source maps for prettier stack traces (enables access to symbols, etc.)
    widenClientFileUpload: true,

    // Routes HTTP requests through Next.js to avoid ad-blockers
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Jobs.
    // See the [official documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/vercel-monitors/) for more information.
    automaticVercelMonitors: true,
  },
);

const isBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.BUILD_PHASE === "1";
if (isBuild) {
  console.log(
    "🛠️  CLEVERPRICES BUILD PHASE DETECTED - Applying build-time constraints...",
  );
  // @ts-ignore
  nextConfig.experimental = {
    ...nextConfig.experimental,
    workerThreads: false,
    cpus: 1,
  };
}

export default configWithSentry;
