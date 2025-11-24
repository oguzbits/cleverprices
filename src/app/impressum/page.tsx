"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ImpressumPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Impressum / Legal Notice</h1>
      
      <Tabs defaultValue="de" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="de">Deutsch</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>

        {/* German Version */}
        <TabsContent value="de">
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
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
                <p className="mb-2">Telefon: +49 176 34842764</p>
                <p className="mb-2">E-Mail: oguz.oeztuerk@outlook.de</p>
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
              <h2 className="text-2xl font-semibold mb-4">EU-Streitschlichtung</h2>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p className="mb-4">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                </p>
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                <p className="mt-4 text-muted-foreground">
                  Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
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
          </div>
        </TabsContent>

        {/* English Version */}
        <TabsContent value="en">
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Information According to § 5 TMG</h2>
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
                <p className="mb-2">Phone: +49 176 34842764</p>
                <p className="mb-2">Email: oguz.oeztuerk@outlook.de</p>
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
              <h2 className="text-2xl font-semibold mb-4">EU Dispute Resolution</h2>
              <div className="bg-card/50 p-6 rounded-lg border border-primary/20">
                <p className="mb-4">
                  The European Commission provides a platform for online dispute resolution (ODR):
                </p>
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                <p className="mt-4 text-muted-foreground">
                  You can find our email address in the legal notice above.
                </p>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
