"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DatenschutzPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung / Privacy Policy</h1>
      
      <Tabs defaultValue="de" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="de">Deutsch</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>

        {/* German Version */}
        <TabsContent value="de">
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
                <p className="mb-4">E-Mail: oguz.oeztuerk@outlook.de</p>
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
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p className="mb-4">
                  Diese Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. 
                  Sie können Ihre Cookie-Einstellungen jederzeit anpassen.
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

            <p className="text-sm text-muted-foreground mt-12">
              Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </TabsContent>

        {/* English Version */}
        <TabsContent value="en">
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Privacy at a Glance</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">General Information</h3>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20 mb-6">
                <p className="mb-4">
                  The following provides a simple overview of what happens to your personal data when you visit this website. 
                  Personal data is any data that can personally identify you.
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3">Who is responsible?</h3>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20 mb-6">
                <p className="mb-4"><strong>Oguz Öztürk</strong></p>
                <p className="mb-2">Boberger Anger 87</p>
                <p className="mb-2">21031 Hamburg</p>
                <p className="mb-4">Email: oguz.oeztuerk@outlook.de</p>
              </div>

              <h3 className="text-xl font-semibold mb-3">What rights do you have?</h3>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p>
                  You have the right to free information, correction, deletion, restriction of processing, or revocation of 
                  your consent at any time. You also have the right to lodge a complaint with the competent supervisory authority.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Server Log Files</h2>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p className="mb-4">
                  When you visit this website, information is automatically collected:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Browser type and version</li>
                  <li>Operating system used</li>
                  <li>Referrer URL</li>
                  <li>Hostname</li>
                  <li>Time of request</li>
                  <li>IP address</li>
                </ul>
                <p>Legal basis: Art. 6 para. 1 lit. f GDPR (legitimate interest in technically error-free presentation)</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Cookies</h2>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p className="mb-4">
                  This website uses cookies. Cookies are small text files stored on your device. You can adjust your cookie 
                  settings at any time.
                </p>
                <p>Legal basis: Art. 6 para. 1 lit. a GDPR (consent)</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Amazon Affiliate Program</h2>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p className="mb-4">
                  This website participates in the Amazon EU Associates Program. When you click an Amazon link, cookies are 
                  set to track which website referred you to Amazon.
                </p>
                <p className="mb-4">Legal basis: Art. 6 para. 1 lit. a GDPR (consent)</p>
                <p>
                  Amazon Privacy Policy:{" "}
                  <a 
                    href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    amazon.com/privacy
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Disclaimer for Price Information</h2>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p className="mb-4">
                  All prices and product information are provided by third parties. We cannot guarantee that this information 
                  is always current or error-free.
                </p>
                <p>
                  Binding prices can only be found on the respective merchants' websites.
                </p>
              </div>
            </section>

            <p className="text-sm text-muted-foreground mt-12">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
