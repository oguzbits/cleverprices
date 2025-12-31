/**
 * Static Generation Utilities
 * Centralized helpers for generateStaticParams to avoid code repetition
 */

import { getAllBlogPosts } from "./blog";
import { allCategories } from "./categories";

/**
 * Supported countries for static generation
 */
export const SUPPORTED_COUNTRIES = [
  "us",
  "ca",
  "de",
  "uk",
  "fr",
  "it",
  "es",
] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

/**
 * Generate static params for country-only routes
 * Excludes "us" since US content is served from the root domain
 * Usage: export async function generateStaticParams() { return generateCountryParams(); }
 */
export function generateCountryParams() {
  return SUPPORTED_COUNTRIES.filter((country) => country !== "us").map(
    (country) => ({ country }),
  );
}

/**
 * Generate static params for blog post routes (all countries × all posts)
 * Excludes "us" since US blog posts are at root (/blog/{slug})
 * Usage: export async function generateStaticParams() { return await generateBlogPostParams(); }
 */
export async function generateBlogPostParams() {
  const posts = await getAllBlogPosts();

  return SUPPORTED_COUNTRIES.filter((country) => country !== "us").flatMap(
    (country) =>
      posts.map((post) => ({
        country,
        slug: post.slug,
      })),
  );
}

/**
 * Generate static params for parent category routes
 * Generates both non-US country routes (/{country}/{parent}) and US routes (/{parent})
 * Usage: export async function generateStaticParams() { return generateParentCategoryParams(); }
 */
export function generateParentCategoryParams() {
  const parents = ["electronics"]; // Add more parent categories as needed

  // Non-US country routes: /{country}/{parent}
  const countryRoutes = SUPPORTED_COUNTRIES.filter(
    (country) => country !== "us",
  ).flatMap((country) =>
    parents.map((parent) => ({
      country,
      parent,
    })),
  );

  // US routes: /{parent} (using parent as country param due to dynamic routing)
  const usRoutes = parents.flatMap((parent) =>
    // For US, we need to generate child category routes as well
    // The route /electronics will be handled by [country]/[parent]/page.tsx
    // where country="electronics" and parent will be undefined or a child category
    Object.values(allCategories)
      .filter((cat) => cat.parent === parent)
      .map((childCat) => ({
        country: parent, // parent slug acts as "country" param
        parent: childCat.slug, // child slug acts as "parent" param
      })),
  );

  return [...countryRoutes, ...usRoutes];
}

/**
 * Generate static params for category product pages
 * Excludes "us" since US product pages are at root (/{parent}/{category})
 * Usage: export async function generateStaticParams() { return generateCategoryProductParams(); }
 */
export function generateCategoryProductParams() {
  // Get all leaf categories (categories that have a parent, meaning they're not parent categories themselves)
  const categories = Object.values(allCategories)
    .filter((category) => category.parent) // Only leaf categories have a parent
    .map((category) => ({
      parent: category.parent!,
      category: category.slug,
    }));

  // Only generate for non-US countries
  // US routes are handled by generateParentCategoryParams
  return SUPPORTED_COUNTRIES.filter((country) => country !== "us").flatMap(
    (country) =>
      categories.map(({ parent, category }) => ({
        country,
        parent,
        category,
      })),
  );
}
