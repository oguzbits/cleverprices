import { BlogIndexView } from "@/components/blog/blog-index-view";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog: Hardware Pricing & Market Trends",
  description:
    "Expert analysis of RAM, SSD, and HDD pricing trends. Track market fluctuations and get the best value for your PC build.",
  alternates: {
    canonical: "https://realpricedata.com/blog",
    languages: getAlternateLanguages("blog"),
  },
  openGraph: getOpenGraph({
    title: "Blog: Hardware Pricing & Market Trends",
    description:
      "Expert analysis of RAM, SSD, and HDD pricing trends. Track market fluctuations and get the best value for your PC build.",
    url: "https://realpricedata.com/blog",
  }),
};

export default async function BlogIndexPage() {
  return <BlogIndexView country="us" />;
}
