import { NichePage } from "@/lib/intelligence/seo-niche";
import Link from "next/link";

interface Props {
  categorySlug: string;
}

export async function NicheLinks({ categorySlug }: Props) {
  // In a real app, we'd filter the manifest at runtime or pre-filter it
  let niches: NichePage[] = [];
  try {
    const manifest = await import("../../../data/niche-manifest.json");
    niches = (manifest.default as NichePage[]).filter(
      (n) => n.category === categorySlug,
    );
  } catch {
    return null;
  }

  if (niches.length === 0) return null;

  // Show top 10 relevant niches
  const displayNiches = niches.slice(0, 10);

  return (
    <div className="mt-12 border-t px-4 pt-8 pb-12">
      <h3 className="text-idealo-text-primary mb-6 text-xl font-bold">
        Beliebte Suchen in {categorySlug}
      </h3>
      <div className="flex flex-wrap gap-3">
        {displayNiches.map((n) => (
          <Link
            key={n.slug}
            href={`/best/${n.slug}`}
            className="border-border text-idealo-link hover:text-idealo-link-hover hover:border-idealo-link rounded-full border bg-white px-4 py-2 text-sm shadow-sm transition-colors"
          >
            {n.title.replace("Die besten ", "Beste ")}
          </Link>
        ))}
      </div>
    </div>
  );
}
