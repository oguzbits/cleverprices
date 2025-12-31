/**
 * Static Generation Utilities
 * Centralized helpers for generateStaticParams to avoid code repetition
 */

import { getAllBlogPosts } from "./blog";
import { allCategories } from "./categories";

/**
 * Supported countries for static generation
 */
export const SUPPORTED_COUNTRIES = ['ca', 'de', 'uk', 'fr', 'it', 'es'] as const;

export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

/**
 * Generate static params for country-only routes
 * Usage: export async function generateStaticParams() { return generateCountryParams(); }
 */
export function generateCountryParams() {
  return SUPPORTED_COUNTRIES.map(country => ({ country }));
}

/**
 * Generate static params for blog post routes (all countries × all posts)
 * Usage: export async function generateStaticParams() { return await generateBlogPostParams(); }
 */
export async function generateBlogPostParams() {
  const posts = await getAllBlogPosts();
  
  return SUPPORTED_COUNTRIES.flatMap(country =>
    posts.map(post => ({
      country,
      slug: post.slug
    }))
  );
}

/**
 * Generate static params for parent category routes
 * Usage: export async function generateStaticParams() { return generateParentCategoryParams(); }
 */
export function generateParentCategoryParams() {
  const parents = ['electronics']; // Add more parent categories as needed
  
  return SUPPORTED_COUNTRIES.flatMap(country =>
    parents.map(parent => ({
      country,
      parent
    }))
  );
}

/**
 * Generate static params for category product pages
 * Usage: export async function generateStaticParams() { return generateCategoryProductParams(); }
 */
export function generateCategoryProductParams() {
  // Get all leaf categories (categories that have a parent, meaning they're not parent categories themselves)
  const categories = Object.entries(allCategories)
    .filter(([_, category]) => category.parent) // Only leaf categories have a parent
    .map(([slug, category]) => ({
      parent: category.parent!,
      category: slug
    }));
  
  return SUPPORTED_COUNTRIES.flatMap(country =>
    categories.map(({ parent, category }) => ({
      country,
      parent,
      category
    }))
  );
}
