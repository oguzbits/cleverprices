import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | realpricedata.com",
  description:
    "Datenschutzerklärung für realpricedata.com - Informationen zum Datenschutz und zur Datenverarbeitung",
  alternates: {
    canonical: "https://realpricedata.com/datenschutz",
    languages: {
      de: "https://realpricedata.com/datenschutz",
      en: "https://realpricedata.com/en/privacy",
      "x-default": "https://realpricedata.com/en/privacy",
    },
  },
};

export default function DatenschutzPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Datenschutzerklärung</h1>

      <LanguageSwitcher currentLang="de" currentPath="privacy" />

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            1. Datenschutz auf einen Blick
          </h2>

          <h3 className="mt-6 mb-3 text-xl font-semibold">
            Allgemeine Hinweise
          </h3>
          <div className="bg-card/50 border-primary/20 mb-6 rounded-lg border p-6">
            <p className="mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber,
              was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
              Website besuchen. Personenbezogene Daten sind alle Daten, mit
              denen Sie persönlich identifiziert werden können.
            </p>
          </div>

          <h3 className="mb-3 text-xl font-semibold">
            Wer ist verantwortlich?
          </h3>
          <div className="bg-card/50 border-primary/20 mb-6 rounded-lg border p-6">
            <p className="mb-4">
              <strong>Oguz Öztürk</strong>
            </p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-4">E-Mail: oguz.oeztuerk.bd@gmail.com</p>
          </div>

          <h3 className="mb-3 text-xl font-semibold">
            Welche Rechte haben Sie?
          </h3>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p>
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft,
              Berichtigung, Löschung, Einschränkung der Verarbeitung oder
              Widerruf Ihrer Einwilligung. Außerdem steht Ihnen ein
              Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">2. Server-Log-Dateien</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-4">
              Beim Besuch dieser Website werden automatisch Informationen
              erfasst:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-2">
              <li>Browsertyp und -version</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname</li>
              <li>Uhrzeit der Anfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p>
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an technisch fehlerfreier Darstellung)
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            3. Cookies & Analyse-Tools
          </h2>
          <div className="bg-card/50 border-primary/20 space-y-4 rounded-lg border p-6">
            <p>
              Diese Website ist so konzipiert, dass sie **keine eigenen
              Cookies** für das Tracking oder die Funktionalität auf Ihrem
              Endgerät speichert. Wir legen großen Wert auf Datenschutz und
              nutzen daher moderne, datenschutzfreundliche Alternativen zu
              herkömmlichen Analyse-Tools.
            </p>

            <h3 className="text-lg font-semibold">
              Vercel Analytics & Speed Insights (Cookieless)
            </h3>
            <p>
              Wir nutzen Vercel Analytics und Speed Insights, um die technische
              Performance und Nutzung unserer Website anonym zu analysieren.
              Dabei werden **keine Cookies gesetzt**. Die Daten werden
              vollständig anonymisiert erhoben und dienen ausschließlich der
              Verbesserung der Website-Geschwindigkeit und Nutzererfahrung.
            </p>

            <h3 className="text-lg font-semibold">Affiliate-Links (Amazon)</h3>
            <p>
              Obwohl diese Website selbst keine Cookies setzt, führt das
              Anklicken eines Affiliate-Links (z. B. zu Amazon) dazu, dass Sie
              auf die Website des Anbieters weitergeleitet werden. In diesem
              Moment können vom jeweiligen Anbieter (z. B. Amazon) Cookies auf
              dessen Domain gesetzt werden, um die Herkunft der Bestellung
              nachzuvollziehen. Details dazu finden Sie im Abschnitt "Amazon
              Partnerprogramm".
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            4. Amazon Partnerprogramm
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-4">
              Diese Website nimmt am Amazon EU-Partnerprogramm teil. Wenn Sie
              einen Amazon-Link anklicken, werden Cookies gesetzt, um
              nachzuvollziehen, über welche Website Sie zu Amazon gelangt sind.
            </p>
            <p className="mb-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
            </p>
            <p>
              Amazon Datenschutzerklärung:{" "}
              <a
                href="https://www.amazon.de/gp/help/customer/display.html?nodeId=201909010"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                amazon.de/datenschutz
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            5. Haftungsausschluss für Preisangaben
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-4">
              Alle Preise und Produktinformationen werden von Drittanbietern
              bereitgestellt. Wir können nicht garantieren, dass diese immer
              aktuell oder fehlerfrei sind.
            </p>
            <p>
              Verbindliche Preise finden Sie ausschließlich auf den Websites der
              jeweiligen Händler.
            </p>
          </div>
        </section>

        <p className="text-muted-foreground mt-12 text-base">
          Stand:{" "}
          {new Date().toLocaleDateString("de-DE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
