import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getOpenGraph, getAlternateLanguages } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Impressum | realpricedata.com",
  description:
    "Impressum und rechtliche Angaben für realpricedata.com. Informationen gemäß § 5 DDG, Kontakt details und Haftungsausschluss.",
  alternates: {
    canonical: "https://realpricedata.com/impressum",
    languages: getAlternateLanguages(
      "legal-notice",
      {
        de: "/impressum",
      },
      false,
    ),
  },
  openGraph: getOpenGraph({
    title: "Impressum | realpricedata.com",
    description: "Impressum und rechtliche Angaben für realpricedata.com.",
    url: "https://realpricedata.com/impressum",
  }),
};

export default function ImpressumPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Impressum</h1>

      <LanguageSwitcher currentLang="de" currentPath="legal-notice" />

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Angaben gemäß § 5 DDG</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-2">
              <strong>Oguz Öztürk</strong>
            </p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-2">Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Kontakt</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-2">E-Mail: info@realpricedata.com</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Umsatzsteuer-ID</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-2">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a
              Umsatzsteuergesetz:
            </p>
            <p className="text-muted-foreground">
              Nicht zutreffend (Kleingewerbe / Privatperson)
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Handelsregister</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="text-muted-foreground">
              Nicht eingetragen (Kleingewerbe / Privatperson)
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Verbraucher­streit­beilegung / Universal­schlichtungs­stelle
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="text-muted-foreground">
              Wir sind nicht bereit oder verpflichtet, an
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Amazon Partnerprogramm
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p>
              Diese Website nimmt am Amazon EU-Partnerprogramm teil. Als
              Amazon-Partner verdienen wir an qualifizierten Verkäufen. Amazon
              und das Amazon-Logo sind Warenzeichen von Amazon.com, Inc. oder
              eines seiner verbundenen Unternehmen.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            Nutzungsbedingungen & Haftungsausschluss
          </h2>
          <div className="bg-card/50 border-primary/20 space-y-4 rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Leistungsbeschreibung</h3>
            <p>
              realpricedata.com ist ein Preisvergleichsportal, das es Nutzern
              ermöglicht, Preise verschiedener Produkte zu vergleichen. Wir
              verkaufen selbst keine Produkte, sondern verweisen auf Angebote
              Dritter (z.B. Amazon).
            </p>

            <h3 className="text-lg font-semibold">
              Haftung für Inhalte und Preise
            </h3>
            <p>
              Wir bemühen uns um Aktualität und Richtigkeit der dargestellten
              Informationen und Preise. Da diese Daten jedoch von Dritten
              stammen und sich kurzfristig ändern können, können wir keine
              Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der
              Inhalte übernehmen. Maßgeblich ist immer der Preis, der zum
              Zeitpunkt des Kaufs auf der Website des Verkäufers angezeigt wird.
            </p>

            <h3 className="text-lg font-semibold">Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
              diesen Seiten unterliegen dem deutschen Urheberrecht. Die
              Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
