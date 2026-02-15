import { getOpenGraph } from "@/lib/metadata";
import { BRAND_DOMAIN, CONTACT_EMAIL, getSiteUrl } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Impressum | ${BRAND_DOMAIN}`,
  description: `Impressum und rechtliche Angaben für ${BRAND_DOMAIN}. Informationen gemäß § 5 DDG, Kontaktdaten und Haftungsausschluss.`,
  alternates: {
    canonical: getSiteUrl("/impressum"),
  },
  openGraph: getOpenGraph({
    title: `Impressum | ${BRAND_DOMAIN}`,
    description: `Impressum und rechtliche Angaben für ${BRAND_DOMAIN}.`,
    url: getSiteUrl("/impressum"),
  }),
};

export default function ImpressumPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Impressum</h1>

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#2d2d2d]">
            Angaben gemäß § 5 DDG
          </h2>
          <div className="rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="mb-2 text-[#333]">
              <strong>Oguz Öztürk</strong>
            </p>
            <p className="mb-2 text-[#555]">Boberger Anger 87</p>
            <p className="mb-2 text-[#555]">21031 Hamburg</p>
            <p className="mb-2 text-[#555]">Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#2d2d2d]">
            Kontakt
          </h2>
          <div className="rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="mb-2 text-[#555]">
              E-Mail:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#0771d0] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#2d2d2d]">
            Steuer-Identifikation
          </h2>
          <div className="rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="mb-1 text-[#555]">
              Wirtschafts-Identifikationsnummer gemäß § 139c Abgabenordnung:
            </p>
            <p className="font-medium text-[#333]">DE460126612-00001</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#2d2d2d]">
            Handelsregister
          </h2>
          <div className="rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="text-[#767676]">
              Einzelunternehmen (Kleingewerbe nach § 19 UStG Regelung möglich)
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
              {BRAND_DOMAIN} ist ein Preisvergleichsportal, das es Nutzern
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
