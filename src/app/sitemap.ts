import { getAllBlogPosts } from "@/lib/blog";
import {
  allCategories,
  getCategoryHierarchy,
  getCategoryPath,
} from "@/lib/categories";
import { DEFAULT_COUNTRY, getAllCountries } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://realpricedata.com";
  const liveCountries = getAllCountries().filter((c) => c.isLive);

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/impressum",
    "/datenschutz",
    "/faq",
    "/blog",
    "/en/legal-notice",
    "/en/privacy",
  ].map((route) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1.0 : 0.8,
    };

    // Add alternates for the homepage
    if (route === "") {
      entry.alternates = {
        languages: getAlternateLanguages(""),
      };
    }

    return entry;
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
        .filter((cat) => cat.parent) // Only categories with parents
        .forEach((category) => {
          const fullPath = getCategoryPath(category.slug, country);
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
        .filter((cat) => cat.parent) // Only categories with parents
        .forEach((category) => {
          const fullPath = getCategoryPath(category.slug, country);
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

  return [...staticRoutes, ...blogRoutes, ...countryRoutes];
}
