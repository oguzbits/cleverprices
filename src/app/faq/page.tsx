import type { Metadata } from "next";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getOpenGraph } from "@/lib/metadata";
import { BRAND_DOMAIN, getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Häufige Fragen (FAQ) | ${BRAND_DOMAIN}`,
  description: `Antworten auf häufig gestellte Fragen zu ${BRAND_DOMAIN}, dem Preisvergleich nach Preis-pro-Einheit und wie Sie die besten Angebote finden.`,
  alternates: {
    canonical: getSiteUrl("/faq"),
  },
  openGraph: getOpenGraph({
    title: `Häufige Fragen (FAQ) | ${BRAND_DOMAIN}`,
    description: `Antworten auf häufig gestellte Fragen zu ${BRAND_DOMAIN}.`,
    url: getSiteUrl("/faq"),
  }),
};

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Häufige Fragen (FAQ)</h1>

      <div className="prose dark:prose-invert mb-8 max-w-none">
        <p className="text-muted-foreground text-lg">
          Hier finden Sie Antworten auf die häufigsten Fragen zu unserem
          Preisvergleich und unseren Daten.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-left font-semibold">
            Was ist {BRAND_DOMAIN}?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {BRAND_DOMAIN} ist ein spezialisierter Preisvergleich, der sich auf
            den &quot;Preis pro Einheit&quot; konzentriert (z. B. Preis pro
            Terabyte, Preis pro Gigabyte). Im Gegensatz zu herkömmlichen
            Preisvergleichsseiten, die nur den Gesamtpreis anzeigen, helfen wir
            Ihnen, das beste Preis-Leistungs-Verhältnis zu finden, indem wir die
            Kosten über verschiedene Kapazitäten und Größen standardisieren.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-left font-semibold">
            Wie wird der &quot;Preis pro Einheit&quot; für RAM und SSDs
            berechnet?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Wir extrahieren automatisch die Kapazitätsinformationen (wie 2TB für
            eine SSD oder 32GB für ein RAM-Kit) und teilen den aktuellen
            Marktpreis durch diese Menge. So erhalten Sie eine vergleichbare
            Kennzahl (wie €/TB oder €/GB), um leicht zu erkennen, welches
            Produkt das beste Preis-Leistungs-Verhältnis bietet.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-left font-semibold">
            Woher stammen die Preisdaten?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Die Preisdaten wurden ursprünglich über offizielle APIs (wie die
            Amazon Product Advertising API) direkt von großen Händlern
            abgerufen. Bitte beachten Sie, dass das Projekt sich im
            Demonstrationsmodus befindet und diese Daten nun statisch archiviert
            sind.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-left font-semibold">
            Wie oft werden die Preise aktualisiert?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Im aktuellen Demonstrationsmodus werden die Preise nicht mehr
            aktualisiert. Es handelt sich um historische Momentaufnahmen. Vor
            dem Kauf sollten Sie den aktuellen Preis direkt auf der Händlerseite
            prüfen.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-left font-semibold">
            Wie finde ich den besten Preis pro Terabyte (TB)?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Nutzen Sie unsere{" "}
            <Link href="/hard-drives" className="text-primary hover:underline">
              Festplatten & SSD
            </Link>{" "}
            Vergleichsseiten und sortieren Sie nach &quot;Preis pro
            Einheit&quot;. So werden alle verfügbaren Speicherprodukte nach
            ihrem tatsächlichen Preis pro TB sortiert, sodass Sie unabhängig von
            der Gesamtkapazität Geld sparen können.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger className="text-left font-semibold">
            Bieten Sie Marktanalysen und Kaufberatung an?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Ja! Unser{" "}
            <Link href="/blog" className="text-primary hover:underline">
              Blog
            </Link>{" "}
            bietet ausführliche Artikel zu Hardware-Markttrends, Preisprognosen
            und Tipps, wie Sie Ihre PC-Builds für das beste
            Preis-Leistungs-Verhältnis optimieren können.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7">
          <AccordionTrigger className="text-left font-semibold">
            Warum sollte ich nicht einfach das günstigste Produkt kaufen?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Der &quot;Beste Preis pro Einheit&quot; ist ein aussagekräftiger
            Wert-Indikator, aber Sie sollten auch Markenreputation,
            Garantielänge und Leistungsspezifikationen (wie NVMe- vs.
            SATA-Geschwindigkeiten) berücksichtigen. Unsere Daten helfen Ihnen,
            die effizientesten Angebote zu finden, aber wir empfehlen immer, vor
            dem Kauf auch Nutzerbewertungen zur Zuverlässigkeit zu prüfen.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-8">
          <AccordionTrigger className="text-left font-semibold">
            Wie filtere ich nach bestimmter Hardware wie DDR5 oder NVMe?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Auf jeder Kategorieseite können Sie die Seitenfilter nutzen, um nach
            Technologie (z. B.{" "}
            <Link
              href="/ram?technology=DDR5"
              className="text-primary hover:underline"
            >
              DDR5
            </Link>
            ) oder Formfaktor (z. B.{" "}
            <Link
              href="/hard-drives?formFactor=M.2+NVMe"
              className="text-primary hover:underline"
            >
              M.2 NVMe
            </Link>
            ) einzugrenzen. Unser System berechnet den Einheitspreis auch bei
            mehreren angewendeten Filtern.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-9">
          <AccordionTrigger className="text-left font-semibold">
            Ist {BRAND_DOMAIN} kostenlos nutzbar?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Ja, die Nutzung ist komplett kostenlos. Da diese Webseite
            ausschließlich zu Demonstrationszwecken betrieben wird, gibt es
            keinerlei Werbung, Sponsoring oder kommerzielle Absichten.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-10">
          <AccordionTrigger className="text-left font-semibold">
            Kann ich historische Preisdaten einsehen?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Wir arbeiten daran, in Zukunft Preisverlaufs-Diagramme anzubieten.
            Derzeit liegt unser Fokus darauf, Ihnen aktuelle Marktdaten zu
            liefern, um das beste Preis-Leistungs-Verhältnis für heutige Käufe
            zu finden.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-11">
          <AccordionTrigger className="text-left font-semibold">
            Wie kann ich Sie kontaktieren?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Sie können uns jederzeit per E-Mail unter info@cleverprices.com
            erreichen. Wir freuen uns über Feedback, Verbesserungsvorschläge
            oder Fragen zu unserer Website.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
