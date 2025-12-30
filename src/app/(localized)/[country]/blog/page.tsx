import { BlogIndexView } from "@/components/blog/blog-index-view";
import { getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const title = `Blog | Hardware Pricing & Market Trends - ${country.toUpperCase()}`;
  const description =
    "In-depth analysis of RAM, SSD, and HDD pricing trends and hardware market insights.";
  const url = `https://realpricedata.com/${country}/blog`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
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
  return <BlogIndexView country={country} />;
}
