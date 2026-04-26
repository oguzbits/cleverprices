import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { execSync } from "node:child_process";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  compress: false, // Offload compression to Traefik (Brotli)
  output: "standalone", // Required for Docker
  generateBuildId: async () => {
    try {
      // Use Git hash as the unique build ID for production tracking
      return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      return `build-${Date.now()}`;
    }
  },
  env: {
    // Expose the build ID to the client-side for the footer/metadata
    NEXT_PUBLIC_BUILD_ID:
      process.env.NEXT_PUBLIC_BUILD_ID ||
      (function () {
        try {
          return execSync("git rev-parse --short HEAD").toString().trim();
        } catch {
          // Fallback to a timestamp-based ID for professional tracking in Docker/CI
          return `v${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}`;
        }
      })(),
  },
  reactCompiler: true,
  cacheComponents: true,
  cacheLife: {
    category: {
      stale: 300, // 5 minutes (Safe buffer for price updates)
      revalidate: 300,
      expire: 86400, // 24 hours
    },
    product_v5: {
      stale: 300, // 5 minutes
      revalidate: 300,
      expire: 86400,
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
      stale: 60, // 1 minute
      revalidate: 60,
      expire: 14400, // 4 hours
    },
    hours: {
      stale: 3600, // 1 hour
      revalidate: 3600,
      expire: 86400, // 24 hours
    },
  },
  experimental: {
    // Cache RSC payloads in the router for 30s to prevent fresh server fetches
    // on every back+forward navigation. Default in Next.js 15+ is 0 (no caching),
    // which causes navigation to appear "frozen" while waiting for the server.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    optimizePackageImports: [
      "@radix-ui/react-accordion",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
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
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 3600,
    qualities: [30, 50, 75],
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
        source: "/p/motorola-motorola-handy-moto-g86-256gb-b0f7rtgckm",
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
        destination: "/tablet-zubehoer",
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
      {
        source: "/pc-komponenten/ram",
        destination: "/arbeitsspeicher",
        permanent: true,
      },
      {
        source: "/pc-komponenten/pc-cases",
        destination: "/pc-gehaeuse",
        permanent: true,
      },
      {
        source: "/computer/mouse-pads",
        destination: "/mauspads",
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
        destination: "/laufwerke",
        permanent: true,
      },
      {
        source: "/computer/keyboards",
        destination: "/tastaturen",
        permanent: true,
      },
      {
        source: "/pc-komponenten/cpu",
        destination: "/prozessoren",
        permanent: true,
      },
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
        source: "/elektroartikel/gefrierschranke",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/elektroartikel/receiver",
        destination: "/receiver",
        permanent: true,
      },
      {
        source: "/elektroartikel/backofen",
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
        destination: "/buerostuehle",
        permanent: true,
      },
      {
        source: "/electronics/phone-accessories",
        destination: "/handy-zubehoer",
        permanent: true,
      },
      {
        source: "/electronics/monitor-arms",
        destination: "/monitorhalterungen",
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
      {
        source: "/electronics/ram",
        destination: "/arbeitsspeicher",
        permanent: true,
      },
      {
        source: "/electronics/webcams",
        destination: "/webcams",
        permanent: true,
      },
      {
        source: "/electronics/hard-drives",
        destination: "/festplatten",
        permanent: true,
      },
      {
        source: "/electronics/monitors",
        destination: "/monitore",
        permanent: true,
      },
      {
        source: "/electronics/routers",
        destination: "/wlan-router",
        permanent: true,
      },
      {
        source: "/electronics/pc-cases",
        destination: "/pc-gehaeuse",
        permanent: true,
      },
      {
        source: "/electronics/game-controllers",
        destination: "/gamepad-controller",
        permanent: true,
      },
      {
        source: "/electronics/cable-management",
        destination: "/kabelmanagement",
        permanent: true,
      },
      {
        source: "/electronics/gpu",
        destination: "/grafikkarten",
        permanent: true,
      },

      {
        source: "/de/computer/network-switches",
        destination: "/network-switches",
        permanent: true,
      },

      // --- Outbound Link Fixes ---
      {
        source:
          "/out/tecknet-wireless-vertikale-ergonomische-maus-4800-dpi-5-tasten-kabellose-optisch-b0dh1mg23d",
        destination: "/maeuse?brand=TeckNet", // Safe fallback to category+brand filter
        permanent: true,
      },
      {
        source: "/out/seagate-ironwolf-pro-16tb",
        destination: "/festplatten?brand=Seagate&capacity=16",
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
            value: "<https://m.media-amazon.com>; rel=preconnect; crossorigin",
          },
          {
            key: "X-Build-ID",
            value: process.env.NEXT_PUBLIC_BUILD_ID || "unknown",
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

    // Sentry Bundle Size Optimizations
    bundleSizeOptimizations: {
      excludeDebugStatements: true,
      excludeReplayIframe: true,
      excludeReplayWorker: true,
      excludeReplayShadowDom: true,
    },

    // ⚡ CI Optimization: Disable server-side source maps to save ~40s of upload time
    // Most production errors are client-side; server-side traces remain readable but less granular.
    disableServerSideSourceMaps: true,

    // Sentry Webpack Plugin Options (Fallback for legacy builds)
    // Note: Some of these are not yet supported by Sentry for Turbopack
    // but using the new structure resolves deprecation warnings in v8/v10.
    // @ts-expect-error - Some of these are not yet supported by Sentry for Turbopack
    webpack: (config: unknown) => {
      return config;
    },
  },
);

const isBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.BUILD_PHASE === "1";

const isCI = !!(
  process.env.CI ||
  process.env.DOKPLOY ||
  process.env.GITHUB_ACTIONS
);

if (isBuild && isCI) {
  console.log(
    "🛠️  CLEVERPRICES CI BUILD DETECTED - Applying memory-safety constraints...",
  );
  if (nextConfig.experimental) {
    // Reverted to 1 CPU as requested to prevent resource contention on the production server
    nextConfig.experimental.workerThreads = false;
    nextConfig.experimental.cpus = 1;
  }
}

// Only wrap with Sentry in CI/Production to avoid 70s+ local build overhead
const exportedConfig = isCI
  ? configWithSentry
  : withBundleAnalyzer(withMDX(nextConfig));

export default exportedConfig;
