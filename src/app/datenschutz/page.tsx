import type { Metadata } from "next"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export const metadata: Metadata = {
  title: "Datenschutzerklärung | realpricedata.com",
  description: "Datenschutzerklärung für realpricedata.com - Informationen zum Datenschutz und zur Datenverarbeitung",
  alternates: {
    canonical: 'https://realpricedata.com/datenschutz',
    languages: {
      'de': 'https://realpricedata.com/datenschutz',
      'en': 'https://realpricedata.com/en/datenschutz',
    },
  },
}

export default function DatenschutzPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
      
      <LanguageSwitcher currentLang="de" currentPath="datenschutz" />

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Datenschutz auf einen Blick</h2>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Allgemeine Hinweise</h3>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20 mb-6">
            <p className="mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
              passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
              persönlich identifiziert werden können.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">Wer ist verantwortlich?</h3>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20 mb-6">
            <p className="mb-4"><strong>Oguz Öztürk</strong></p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-4">E-Mail: oguz.oeztuerk.bd@gmail.com</p>
          </div>

          <h3 className="text-xl font-semibold mb-3">Welche Rechte haben Sie?</h3>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p>
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft, Berichtigung, Löschung, Einschränkung der 
              Verarbeitung oder Widerruf Ihrer Einwilligung. Außerdem steht Ihnen ein Beschwerderecht bei der 
              zuständigen Aufsichtsbehörde zu.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Server-Log-Dateien</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-4">
              Beim Besuch dieser Website werden automatisch Informationen erfasst:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Browsertyp und -version</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname</li>
              <li>Uhrzeit der Anfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an technisch fehlerfreier Darstellung)</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Cookies</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20 space-y-4">
            <p>
              Diese Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. 
              Sie werden häufig verwendet, um Websites funktionsfähig zu machen oder effizienter zu gestalten, sowie um 
              Informationen für die Betreiber der Website bereitzustellen.
            </p>
            
            <h3 className="text-lg font-semibold">Wie wir Cookies verwenden</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Notwendige Cookies:</strong> Diese Cookies sind für den Betrieb der Website erforderlich. 
                Dazu gehört beispielsweise das Speichern Ihrer Cookie-Einstellungen.
              </li>
              <li>
                <strong>Affiliate-Cookies:</strong> Als Teilnehmer am Amazon-Partnerprogramm verwenden wir Cookies, 
                um die Herkunft von Bestellungen nachzuvollziehen. Wenn Sie auf einen Amazon-Link auf unserer Website 
                klicken, wird ein Cookie gesetzt, damit Amazon zuordnen kann, dass Sie von unserer Seite kamen. 
                Dies ermöglicht uns, eine Werbekostenerstattung zu erhalten.
              </li>
            </ul>

            <h3 className="text-lg font-semibold">Ihre Cookie-Einstellungen</h3>
            <p>
              Sie können Ihre Cookie-Einstellungen jederzeit ändern, indem Sie die Einstellungen Ihres Browsers anpassen. 
              Die meisten Webbrowser erlauben eine gewisse Kontrolle über die meisten Cookies über die Browsereinstellungen.
            </p>
            <p>
              Um mehr über Cookies zu erfahren, einschließlich wie Sie sehen können, welche Cookies gesetzt wurden und 
              wie Sie diese verwalten und löschen können, besuchen Sie <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.allaboutcookies.org</a>.
            </p>
            <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Amazon Partnerprogramm</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-4">
              Diese Website nimmt am Amazon EU-Partnerprogramm teil. Wenn Sie einen Amazon-Link anklicken, werden 
              Cookies gesetzt, um nachzuvollziehen, über welche Website Sie zu Amazon gelangt sind.
            </p>
            <p className="mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</p>
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
          <h2 className="text-2xl font-semibold mb-4">5. Haftungsausschluss für Preisangaben</h2>
          <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
            <p className="mb-4">
              Alle Preise und Produktinformationen werden von Drittanbietern bereitgestellt. Wir können nicht garantieren, 
              dass diese immer aktuell oder fehlerfrei sind.
            </p>
            <p>
              Verbindliche Preise finden Sie ausschließlich auf den Websites der jeweiligen Händler.
            </p>
          </div>
        </section>

        <p className="text-base text-muted-foreground mt-12">
          Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
