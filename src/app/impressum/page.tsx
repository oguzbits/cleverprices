import type { Metadata } from "next"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export const metadata: Metadata = {
  title: "Impressum | realpricedata.com",
  description: "Impressum und rechtliche Angaben für realpricedata.com - Angaben gemäß § 5 DDG",
  alternates: {
    canonical: 'https://realpricedata.com/impressum',
    languages: {
      'de': 'https://realpricedata.com/impressum',
      'en': 'https://realpricedata.com/en/impressum',
    },
  },
}

export default function ImpressumPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Impressum</h1>
      
      <LanguageSwitcher currentLang="de" currentPath="impressum" />

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Angaben gemäß § 5 DDG</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-2"><strong>Oguz Öztürk</strong></p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-2">Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Kontakt</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-2">E-Mail: oguz.oeztuerk.bd@gmail.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Umsatzsteuer-ID</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-2">Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
            <p className="text-muted-foreground">Nicht zutreffend (Kleingewerbe / Privatperson)</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Handelsregister</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="text-muted-foreground">Nicht eingetragen (Kleingewerbe / Privatperson)</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Verbraucher­streit­beilegung / Universal­schlichtungs­stelle</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="text-muted-foreground">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Amazon Partnerprogramm</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p>
              Diese Website nimmt am Amazon EU-Partnerprogramm teil. Als Amazon-Partner verdienen wir an qualifizierten 
              Verkäufen. Amazon und das Amazon-Logo sind Warenzeichen von Amazon.com, Inc. oder eines seiner verbundenen 
              Unternehmen.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Nutzungsbedingungen & Haftungsausschluss</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20 space-y-4">
            <h3 className="text-lg font-semibold">Leistungsbeschreibung</h3>
            <p>
              realpricedata.com ist ein Preisvergleichsportal, das es Nutzern ermöglicht, Preise verschiedener Produkte 
              zu vergleichen. Wir verkaufen selbst keine Produkte, sondern verweisen auf Angebote Dritter (z.B. Amazon).
            </p>

            <h3 className="text-lg font-semibold">Haftung für Inhalte und Preise</h3>
            <p>
              Wir bemühen uns um Aktualität und Richtigkeit der dargestellten Informationen und Preise. Da diese Daten 
              jedoch von Dritten stammen und sich kurzfristig ändern können, können wir keine Gewähr für die Richtigkeit, 
              Vollständigkeit und Aktualität der Inhalte übernehmen. Maßgeblich ist immer der Preis, der zum Zeitpunkt 
              des Kaufs auf der Website des Verkäufers angezeigt wird.
            </p>

            <h3 className="text-lg font-semibold">Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen 
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
