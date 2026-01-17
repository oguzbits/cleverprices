import { getAllBlogPosts } from "@/lib/blog";
import {
  allCategories,
  getCategoryHierarchy,
  getCategoryPath,
} from "@/lib/categories";
import { DEFAULT_COUNTRY, getAllCountries } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import { getAllProductSlugs } from "@/lib/server/cached-products";
import { SITE_URL } from "@/lib/site-config";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const liveCountries = getAllCountries().filter((c) => c.isLive);

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1.0 },
    { path: "/blog", priority: 0.8 },
    { path: "/faq", priority: 0.7 },
    { path: "/privacy", priority: 0.5, customTrans: { de: "/datenschutz" } },
    {
      path: "/datenschutz",
      priority: 0.5,
      customTrans: { de: "/datenschutz" },
    },
    { path: "/legal-notice", priority: 0.5, customTrans: { de: "/impressum" } },
    { path: "/impressum", priority: 0.5, customTrans: { de: "/impressum" } },
  ].map(({ path, priority, customTrans }) => {
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
        languages: getAlternateLanguages(
          alternatesPath,
          customTrans,
          ![
            "/privacy",
            "/datenschutz",
            "/legal-notice",
            "/impressum",
            "/faq",
          ].includes(path),
        ),
      },
    };
  });

  // Blog posts
  const blogPosts = await getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = [];

  blogPosts.forEach((post) => {
    const postPath = `/blog/${post.slug}`;

    // 1. Root version (handles 'en' and 'en-US' via alternates)
    blogRoutes.push({
      url: `${baseUrl}${postPath}`,
      lastModified: new Date(post.lastUpdated || post.publishDate),
      changeFrequency: "daily" as const,
      priority: 0.7,
      alternates: {
        languages: getAlternateLanguages(postPath),
      },
    });

    // 2. Localized versions (exclude US - it uses root domain)
    liveCountries
      .filter((c) => c.code !== DEFAULT_COUNTRY)
      .forEach((country) => {
        blogRoutes.push({
          url: `${baseUrl}/${country.code}${postPath}`,
          lastModified: new Date(post.lastUpdated || post.publishDate),
          changeFrequency: "weekly" as const,
          priority: 0.6,
          alternates: {
            languages: getAlternateLanguages(postPath),
          },
        });
      });
  });

  // Product pages - high priority for SEO
  const products = await getAllProductSlugs();
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    const productPath = `/p/${product.slug}`;
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

  // Get category hierarchy
  const categoryHierarchy = getCategoryHierarchy();

  const countryRoutes: MetadataRoute.Sitemap = [];

  liveCountries.forEach((c) => {
    const country = c.code;
    const isUS = country === DEFAULT_COUNTRY;

    // Skip /us/* routes - US content is served from root domain
    if (isUS) {
      // US categories page (root domain)
      countryRoutes.push({
        url: `${baseUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: {
          languages: getAlternateLanguages("/categories"),
        },
      });

      // US parent category pages
      categoryHierarchy.forEach((hierarchy) => {
        const path = `/${hierarchy.parent.slug}`;
        countryRoutes.push({
          url: `${baseUrl}${path}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
          alternates: {
            languages: getAlternateLanguages(path),
          },
        });
      });

      // US child category pages (product listing pages)
      Object.values(allCategories)
        .filter((cat) => cat.parent && !cat.hidden) // Only categories with parents and not hidden
        .forEach((category) => {
          const fullPath = getCategoryPath(category.slug);
          const alternatesPath = `/${category.parent}/${category.slug}`;

          countryRoutes.push({
            url: `${baseUrl}${fullPath}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.9, // Higher priority for product pages
            alternates: {
              languages: getAlternateLanguages(alternatesPath),
            },
          });
        });
    } else {
      // Non-US country home page
      countryRoutes.push({
        url: `${baseUrl}/${country}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
        alternates: {
          languages: getAlternateLanguages(""),
        },
      });

      // Non-US country categories page
      countryRoutes.push({
        url: `${baseUrl}/${country}/categories`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: {
          languages: getAlternateLanguages("/categories"),
        },
      });

      // Non-US parent category pages
      categoryHierarchy.forEach((hierarchy) => {
        const path = `/${hierarchy.parent.slug}`;
        countryRoutes.push({
          url: `${baseUrl}/${country}${path}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
          alternates: {
            languages: getAlternateLanguages(path),
          },
        });
      });

      // Non-US child category pages (product listing pages)
      Object.values(allCategories)
        .filter((cat) => cat.parent && !cat.hidden) // Only categories with parents and not hidden
        .forEach((category) => {
          const fullPath = getCategoryPath(category.slug);
          const alternatesPath = `/${category.parent}/${category.slug}`;

          countryRoutes.push({
            url: `${baseUrl}${fullPath}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.9, // Higher priority for product pages
            alternates: {
              languages: getAlternateLanguages(alternatesPath),
            },
          });
        });
    }
  });

  return [...staticRoutes, ...blogRoutes, ...productRoutes, ...countryRoutes];
}
