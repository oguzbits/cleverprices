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

import { redirect } from "next/navigation";

export default function CategoriesPage() {
  redirect("/elektroartikel");
}
