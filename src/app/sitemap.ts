import { getAllBlogPosts } from "@/lib/blog";
import {
  allCategories,
  getCategoryHierarchy,
  isCategoryNotEmptyRecursive,
} from "@/lib/categories";
import { getAlternateLanguages } from "@/lib/metadata";
import {
  getAllProductSlugs,
  getNonEmptyCategorySlugs,
} from "@/lib/server/cached-products";
import { SITE_URL } from "@/lib/site-config";
import { getProductPath } from "@/lib/utils/url";
import { MetadataRoute } from "next";
import { cacheLife } from "next/cache";

/**
 * ARCHITECTURE NOTE:
 * We force-dynamic here to prevent Next.js from rendering the sitemap during the 'build' phase.
 * During build, the database is empty/in-memory, which would result in an empty sitemap being "baked" into the build.
 * By using 'force-dynamic', we ensure the sitemap is generated in the production environment where the real DB is.
 * Performant caching is still handled via the "use cache" directive below.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("dynamic"); // 10m revalidate, 1h expire (aligned with next.config.ts)

  const baseUrl = SITE_URL;

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1.0 },
    { path: "/blog", priority: 0.8 },
    { path: "/faq", priority: 0.7 },
    {
      path: "/privacy",
      priority: 0.5,
      customTrans: { de: "/datenschutz" },
      hidden: true,
    },
    {
      path: "/datenschutz",
      priority: 0.5,
      customTrans: { de: "/datenschutz" },
    },
    {
      path: "/legal-notice",
      priority: 0.5,
      customTrans: { de: "/impressum" },
      hidden: true,
    },
    { path: "/impressum", priority: 0.5, customTrans: { de: "/impressum" } },
    { path: "/deals", priority: 0.9 },
  ]
    .filter((route) => !(route as any).hidden)
    .map(({ path, priority, customTrans }) => {
      // Determine the base path for alternates
      // For legal pages, 'privacy' and 'legal-notice' are the base paths for all en-REGION variants
      let alternatesPath = path;
      if (path === "/datenschutz") alternatesPath = "/privacy";
      if (path === "/impressum") alternatesPath = "/legal-notice";

      return {
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority,
        alternates: {
          languages: getAlternateLanguages(alternatesPath, customTrans),
        },
      };
    });

  // Blog posts
  const blogPosts = await getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const postPath = `/blog/${post.slug}`;
    return {
      url: `${baseUrl}${postPath}`,
      lastModified: new Date(post.lastUpdated || post.publishDate),
      changeFrequency: "daily" as const,
      priority: 0.7,
      alternates: {
        languages: getAlternateLanguages(postPath),
      },
    };
  });

  // Product pages - high priority for SEO
  const allProducts = await getAllProductSlugs();
  // SEO SAFETY: Only include products that have reached "optimized" status (enriched with Icecat/eBay)
  // This ensures Google only committed to stable, high-quality URLs.
  const products = allProducts.filter(
    (p) =>
      (p.enrichmentStatus === "optimized" ||
        p.enrichmentStatus === "processed") &&
      !p.slug.endsWith("_-generic"),
  );

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    const productPath = getProductPath(product.id, product.slug);
    return {
      url: `${baseUrl}${productPath}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9, // High priority - these are our main content
      alternates: {
        languages: getAlternateLanguages(productPath),
      },
    };
  });

  // Category routes
  const categoryHierarchy = getCategoryHierarchy();
  const nonEmptyCategorySlugs = await getNonEmptyCategorySlugs();
  const categoryRoutes: MetadataRoute.Sitemap = [];

  // 1. Categories listing page
  categoryRoutes.push({
    url: `${baseUrl}/categories`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
    alternates: {
      languages: getAlternateLanguages("/categories"),
    },
  });

  // 2. All active categories
  Object.values(allCategories).forEach((category) => {
    if (category.hidden) return;

    // Use recursive check to see if category should be in sitemap
    if (!isCategoryNotEmptyRecursive(category.slug, nonEmptyCategorySlugs)) {
      return;
    }

    const path = `/${category.slug}`;
    const isParent =
      categoryHierarchy.some((h) => h.parent.slug === category.slug) &&
      category.parent === undefined;

    categoryRoutes.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: (isParent ? "weekly" : "daily") as any,
      priority: isParent ? 0.8 : 0.9,
      alternates: {
        languages: getAlternateLanguages(path),
      },
    });
  });

  return [...staticRoutes, ...blogRoutes, ...productRoutes, ...categoryRoutes];
}
