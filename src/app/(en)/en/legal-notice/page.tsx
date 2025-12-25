import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Legal Notice | realpricedata.com",
  description:
    "Legal notice and imprint for realpricedata.com - Information according to § 5 DDG",
  alternates: {
    canonical: "https://realpricedata.com/en/legal-notice",
    languages: {
      de: "https://realpricedata.com/impressum",
      en: "https://realpricedata.com/en/legal-notice",
    },
  },
};

export default function LegalNoticePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Legal Notice</h1>

      <LanguageSwitcher currentLang="en" currentPath="legal-notice" />

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Information According to § 5 DDG
          </h2>
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
            <p className="mb-2">Email: oguz.oeztuerk.bd@gmail.com</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">VAT ID</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-2">
              VAT identification number according to § 27 a German VAT Act:
            </p>
            <p className="text-muted-foreground">
              Not applicable (Small business / Private individual)
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Trade Register</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="text-muted-foreground">
              Not registered (Small business / Private individual)
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Consumer Dispute Resolution
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="text-muted-foreground">
              We are not willing or obliged to participate in dispute resolution
              proceedings before a consumer arbitration board.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Amazon Affiliate Program
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p>
              This website participates in the Amazon EU Associates Program. As
              an Amazon Associate, we earn from qualifying purchases. Amazon and
              the Amazon logo are trademarks of Amazon.com, Inc. or its
              affiliates.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
