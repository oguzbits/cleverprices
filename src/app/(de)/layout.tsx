import { PageLayout } from "@/components/layout/PageLayout";
import { siteMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...siteMetadata,
  openGraph: {
    ...siteMetadata.openGraph,
    locale: "de_DE",
  },
};

export default function GermanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageLayout country="de">{children}</PageLayout>;
}
