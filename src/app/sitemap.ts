import { getAllBlogPosts } from "@/lib/blog";
import {
  allCategories,
  getCategoryPath,
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
import { cacheLife, cacheTag } from "next/cache";

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
  cacheLife("product");
  cacheTag("sitemap", "sitemap-slugs");
  const baseUrl = SITE_URL;

  // Static routes (German-first priorities)
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1.0 },
    { path: "/blog", priority: 0.8 },
    { path: "/faq", priority: 0.7 },
    { path: "/datenschutz", priority: 0.5 },
    { path: "/agb", priority: 0.5 },
    { path: "/impressum", priority: 0.5 },
    { path: "/deals", priority: 0.9 },
  ].map((route) => {
    return {
      url: `${baseUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route.priority,
      alternates: {
        languages: getAlternateLanguages(route.path),
      },
    };
  });

  // Blog routes
  const posts = await getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => {
    const path = `/blog/${post.slug}`;
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(post.lastUpdated || post.publishDate),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: getAlternateLanguages(path),
      },
    };
  });

  // Product pages - high priority for SEO
  // [PERFORMANCE] Using fastMode=true to bypass consensus mapping.
  // This uses slugs directly from the database for instant generation (<1s).
  const allProducts = await getAllProductSlugs(undefined, false, true);

  const productRoutes: MetadataRoute.Sitemap = allProducts.map((product) => {
    const productPath = getProductPath(product.id, product.slug);
    return {
      url: `${baseUrl}${productPath}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: {
        languages: getAlternateLanguages(productPath),
      },
    };
  });

  // Category routes
  const nonEmptyCategorySlugs = await getNonEmptyCategorySlugs();
  const categoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: {
        languages: getAlternateLanguages("/categories"),
      },
    },
    ...Object.values(allCategories)
      .map((category) => {
        if (category.hidden) return;

        // Use recursive check to see if category should be in sitemap
        if (
          !isCategoryNotEmptyRecursive(category.slug, nonEmptyCategorySlugs)
        ) {
          return;
        }

        const categoryPath = getCategoryPath(category.slug);
        return {
          url: `${baseUrl}${categoryPath}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.8,
          alternates: {
            languages: getAlternateLanguages(categoryPath),
          },
        };
      })
      .filter((route): route is any => !!route),
  ];

  return [...staticRoutes, ...blogRoutes, ...productRoutes, ...categoryRoutes];
}
