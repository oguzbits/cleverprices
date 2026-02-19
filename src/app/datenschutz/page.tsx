import { BUILD_TIME } from "@/lib/build-config";
import { getOpenGraph } from "@/lib/metadata";
import { BRAND_DOMAIN, CONTACT_EMAIL, getSiteUrl } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Datenschutzerklärung | ${BRAND_DOMAIN}`,
  description: `Datenschutzerklärung für ${BRAND_DOMAIN}. Erfahren Sie alles über Datenschutz, Ihre Rechte und unsere cookiefreie Analyse.`,
  alternates: {
    canonical: getSiteUrl("/datenschutz"),
  },
  openGraph: getOpenGraph({
    title: `Datenschutzerklärung | ${BRAND_DOMAIN}`,
    description: "Datenschutzerklärung und Informationen zum Datenschutz.",
    url: getSiteUrl("/datenschutz"),
  }),
};

export default function DatenschutzPage() {
  const lastUpdated = new Date(BUILD_TIME).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Datenschutzerklärung</h1>

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#2d2d2d]">
            1. Datenschutz auf einen Blick
          </h2>

          <h3 className="mt-6 mb-3 text-xl font-semibold text-[#333]">
            Allgemeine Hinweise
          </h3>
          <div className="mb-6 rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="mb-4 text-[#555]">
              Die folgenden Hinweise geben einen einfachen Überblick darüber,
              was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
              Website besuchen. Personenbezogene Daten sind alle Daten, mit
              denen Sie persönlich identifiziert werden können.
            </p>
          </div>

          <h3 className="mb-3 text-xl font-semibold text-[#333]">
            Wer ist verantwortlich?
          </h3>
          <div className="mb-6 rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="mb-4 text-[#333]">
              <strong>Oguz Öztürk</strong>
            </p>
            <p className="mb-2 text-[#555]">Boberger Anger 87</p>
            <p className="mb-2 text-[#555]">21031 Hamburg</p>
            <p className="mb-4 text-[#555]">
              E-Mail:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#0771d0] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <h3 className="mb-3 text-xl font-semibold text-[#333]">
            Welche Rechte haben Sie?
          </h3>
          <div className="rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="text-[#555]">
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft,
              Berichtigung, Löschung, Einschränkung der Verarbeitung oder
              Widerruf Ihrer Einwilligung. Außerdem steht Ihnen ein
              Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#2d2d2d]">
            2. Server-Log-Dateien
          </h2>
          <div className="rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="mb-4 text-[#555]">
              Beim Besuch dieser Website werden automatisch Informationen
              erfasst:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-2 text-[#555]">
              <li>Browsertyp und -version</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname</li>
              <li>Uhrzeit der Anfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p className="text-[#555]">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an technisch fehlerfreier Darstellung)
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[#2d2d2d]">
            3. Cookies & Analyse-Tools
          </h2>
          <div className="space-y-4 rounded border border-[#e5e5e5] bg-white p-6 shadow-sm">
            <p className="text-[#555]">
              Diese Website ist so konzipiert, dass sie **keine eigenen
              Cookies** für das Tracking oder die Funktionalität auf Ihrem
              Endgerät speichert. Wir legen großen Wert auf Datenschutz und
              nutzen daher moderne, datenschutzfreundliche Alternativen zu
              herkömmlichen Analyse-Tools.
            </p>

            <h3>Analytics & Speed Insights (Cookieless)</h3>
            <p>
              Wir nutzen moderne Analytics-Tools, um die technische Leistung und
              Nutzung der Webseite zu analysieren. Diese Tools arbeiten komplett
              ohne Cookies und speichern keine persönlichen Daten.
            </p>

            <h3 className="text-lg font-semibold text-[#333]">
              Local Storage (Funktionale Speicherung)
            </h3>
            <p className="text-[#555]">
              Wir nutzen den &quot;Local Storage&quot; Ihres Browsers, um Ihre
              Einstellungen (z. B. Filter-Präferenzen auf Produktseiten) zu
              speichern. Dies dient ausschließlich der technischen
              Funktionalität und verbesserten Nutzererfahrung. Diese Daten sind
              rein funktional und werden nicht zu Tracking-Zwecken oder zur
              Erstellung von Nutzerprofilen verwendet.
            </p>

            <h3 className="text-lg font-semibold text-[#333]">
              Affiliate-Links (Amazon)
            </h3>
            <p className="text-[#555]">
              Obwohl diese Website selbst keine Cookies setzt, führt das
              Anklicken eines Affiliate-Links (z. B. zu Amazon) dazu, dass Sie
              auf die Website des Anbieters weitergeleitet werden. In diesem
              Moment können vom jeweiligen Anbieter (z. B. Amazon) Cookies auf
              dessen Domain gesetzt werden, um die Herkunft der Bestellung
              nachzuvollziehen. Details dazu finden Sie im Abschnitt
              &quot;Amazon Partnerprogramm&quot;.
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
          Stand: {lastUpdated}
        </p>
      </div>
    </div>
  );
}
