import { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/categories";
import { getCountryByCode, DEFAULT_COUNTRY } from "@/lib/countries";

type Props = {
  params: Promise<{ country: string; parent: string; category: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; parent: string; category: string }>;
}): Promise<Metadata> {
  const { country, category: categorySlug } = await params;

  const countryConfig =
    getCountryByCode(country) || getCountryByCode(DEFAULT_COUNTRY);
  const countryName = countryConfig?.name || "Global";
  const countryCode = (countryConfig?.code || country || "US").toUpperCase();
  const domain = countryConfig?.domain || "amazon.com";
  const category = getCategoryBySlug(categorySlug);

  const categoryName = category?.name || "Products";

  return {
    title: `Best ${categoryName} Price Per Unit (Amazon ${countryCode})`,
    description: `Find the best deals on ${categoryName} at Amazon ${countryName} (${domain}). Compare by true cost per unit/TB and see real-time price drops.`,
    keywords: [
      `${categoryName} ${countryName}`,
      `${categoryName} ${countryCode}`,
      `${categoryName} price per unit`,
      `best ${categoryName} deals ${countryCode}`,
      `Amazon ${countryCode} storage deals`,
    ],
  };
}

export default function CategoryLayout({ children }: Props) {
  return <>{children}</>;
}
