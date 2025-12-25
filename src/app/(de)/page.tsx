import HomeContent from "@/components/HomeContent";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://realpricedata.com",
    languages: {
      "en-DE": "https://realpricedata.com/de",
    },
  },
};

export default function HomePage() {
  return <HomeContent country={DEFAULT_COUNTRY} />;
}
