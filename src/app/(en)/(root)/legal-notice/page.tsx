import type { Metadata } from "next";
import { getOpenGraph, getAlternateLanguages } from "@/lib/metadata";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Legal Notice | realpricedata.com",
  description: "Legal notice and company information for realpricedata.com.",
  alternates: {
    canonical: "https://realpricedata.com/legal-notice",
    languages: getAlternateLanguages(
      "legal-notice",
      {
        de: "/impressum",
      },
      false,
    ),
  },
  openGraph: getOpenGraph({
    title: "Legal Notice | realpricedata.com",
    description: "Legal notice and company information for realpricedata.com.",
    url: "https://realpricedata.com/legal-notice",
  }),
};

export default function LegalNoticePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Legal Notice</h1>

      <LanguageSwitcher currentLang="en" currentPath="legal-notice" />

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Company Information</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-2">
              <strong>Oguz Öztürk</strong>
            </p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-2">Germany</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Contact</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-2">Email: info@realpricedata.com</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Amazon Associate Program
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p>
              realpricedata.com is a participant in the Amazon Services LLC
              Associates Program, an affiliate advertising program designed to
              provide a means for sites to earn advertising fees by advertising
              and linking to Amazon.com and affiliated sites.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Disclaimer</h2>
          <div className="bg-card/50 border-primary/20 space-y-4 rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Content Liability</h3>
            <p>
              The contents of our pages have been created with the utmost care.
              However, we cannot guarantee the contents&apos; accuracy,
              completeness, or topicality. According to statutory provisions, we
              are largely responsible for our own content on these web pages.
            </p>

            <h3 className="text-lg font-semibold">Liability for Links</h3>
            <p>
              Our offer contains links to external third-party websites. We have
              no influence on the contents of those websites, therefore we
              cannot guarantee for those contents. Providers or administrators
              of linked websites are always responsible for their own contents.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
