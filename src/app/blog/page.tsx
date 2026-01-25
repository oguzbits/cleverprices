import { BlogIndexView } from "@/components/blog/blog-index-view";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { BRAND_DOMAIN, getSiteUrl } from "@/lib/site-config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Blog: Hardware-Preistrends & Marktanalysen | ${BRAND_DOMAIN}`,
  description:
    "Experten-Analyse zu Preisentwicklungen bei RAM, SSD und HDD. Verfolgen Sie Marktschwankungen und finden Sie das beste Preis-Leistungs-Verhältnis.",
  alternates: {
    canonical: getSiteUrl("/blog"),
    languages: getAlternateLanguages("blog"),
  },
  openGraph: getOpenGraph({
    title: `Blog: Hardware-Preistrends & Marktanalysen | ${BRAND_DOMAIN}`,
    description:
      "Experten-Analyse zu Preisentwicklungen bei RAM, SSD und HDD. Verfolgen Sie Marktschwankungen und finden Sie das beste Preis-Leistungs-Verhältnis.",
    url: getSiteUrl("/blog"),
  }),
};

export default async function BlogIndexPage() {
  return <BlogIndexView country="de" />;
}
