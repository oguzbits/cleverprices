import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { getSiteUrl } from "@/lib/site-config";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = getSiteUrl("/categories");

  const title = `Alle Kategorien - Preisvergleich`;
  const description = `Durchsuchen Sie alle Produktkategorien. Vergleichen Sie Preise und finden Sie die besten Angebote.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages("/categories"),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: `de_DE`,
    }),
  };
}

import { allCategories } from "@/lib/categories";
import Link from "next/link";

export default function CategoriesPage() {
  const categories = Object.values(allCategories).filter((c) => !c.hidden);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-6">
        <h1 className="mb-10 text-[28px] font-bold text-[#2d2d2d]">
          Alle Kategorien
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="rounded-lg border-1 border-gray-400 p-6 no-underline transition-shadow hover:no-underline hover:shadow-md"
            >
              <h2 className="mb-2 text-lg font-semibold text-[#2d2d2d] no-underline">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
