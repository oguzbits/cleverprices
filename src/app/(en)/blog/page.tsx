import { BlogIndexView } from "@/components/blog/blog-index-view";
import { getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Hardware Pricing & Market Trends",
  description: "In-depth analysis of RAM, SSD, and HDD pricing trends.",
  alternates: {
    canonical: "https://realpricedata.com/blog",
  },
  openGraph: getOpenGraph({
    title: "Blog | Hardware Pricing & Market Trends",
    description: "In-depth analysis of RAM, SSD, and HDD pricing trends.",
    url: "https://realpricedata.com/blog",
  }),
};

export default async function BlogIndexPage() {
  return <BlogIndexView country="us" />;
}
