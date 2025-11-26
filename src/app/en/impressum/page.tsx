import type { Metadata } from "next"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export const metadata: Metadata = {
  title: "Legal Notice | bestprices.today",
  description: "Legal notice and imprint for bestprices.today - Information according to § 5 DDG",
  alternates: {
    canonical: 'https://bestprices.today/en/impressum',
    languages: {
      'de': 'https://bestprices.today/impressum',
      'en': 'https://bestprices.today/en/impressum',
    },
  },
}

export default function ImpressumEnPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Legal Notice</h1>
      
      <LanguageSwitcher currentLang="en" currentPath="impressum" />

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information According to § 5 DDG</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-2"><strong>Oguz Öztürk</strong></p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-2">Germany</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-2">Email: oguz.oeztuerk.bd@gmail.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">VAT ID</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-2">VAT identification number according to § 27 a German VAT Act:</p>
            <p className="text-muted-foreground">Not applicable (Small business / Private individual)</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Trade Register</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="text-muted-foreground">Not registered (Small business / Private individual)</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Consumer Dispute Resolution</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="text-muted-foreground">
              We are not willing or obliged to participate in dispute resolution proceedings before a consumer 
              arbitration board.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Amazon Affiliate Program</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p>
              This website participates in the Amazon EU Associates Program. As an Amazon Associate, we earn from 
              qualifying purchases. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
