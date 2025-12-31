import { BlogIndexView } from "@/components/blog/blog-index-view";
import { isValidCountryCode, type CountryCode } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { generateCountryParams } from "@/lib/static-params";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateStaticParams() {
  return generateCountryParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const isUS = country.toLowerCase() === "us";
  const title = `Blog: Hardware Trends - ${country.toUpperCase()}`;
  const description =
    "Expert analysis of RAM, SSD, and HDD pricing trends. Track market fluctuations and get the best value for your PC build.";
  const url = isUS
    ? "https://realpricedata.com/blog"
    : `https://realpricedata.com/${country}/blog`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: getAlternateLanguages("blog"),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url,
    }),
  };
}

export default async function LocalizedBlogIndexPage({ params }: Props) {
  const { country } = await params;

  if (country.toLowerCase() === "us") {
    redirect("/blog");
  }

  if (!isValidCountryCode(country)) {
    notFound();
  }

  return <BlogIndexView country={country as CountryCode} />;
}
