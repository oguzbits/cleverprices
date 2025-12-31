import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getOpenGraph } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Privacy Policy | realpricedata.com",
  description:
    "Privacy policy for realpricedata.com. Learn about how we handle data protection, privacy rights, and our cookieless analytics approach.",
  alternates: {
    canonical: "https://realpricedata.com/en/privacy",
    languages: {
      de: "https://realpricedata.com/datenschutz",
      en: "https://realpricedata.com/en/privacy",
      "x-default": "https://realpricedata.com/en/privacy",
    },
  },
  openGraph: getOpenGraph({
    title: "Privacy Policy | realpricedata.com",
    description: "Privacy policy and data protection information.",
    url: "https://realpricedata.com/en/privacy",
  }),
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

      <LanguageSwitcher currentLang="en" currentPath="privacy" />

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            1. Privacy at a Glance
          </h2>

          <h3 className="mt-6 mb-3 text-xl font-semibold">
            General Information
          </h3>
          <div className="bg-card/50 border-primary/20 mb-6 rounded-lg border p-6">
            <p className="mb-4">
              The following provides a simple overview of what happens to your
              personal data when you visit this website. Personal data is any
              data that can personally identify you.
            </p>
          </div>

          <h3 className="mb-3 text-xl font-semibold">Who is responsible?</h3>
          <div className="bg-card/50 border-primary/20 mb-6 rounded-lg border p-6">
            <p className="mb-4">
              <strong>Oguz Öztürk</strong>
            </p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-4">Email: oguz.oeztuerk.bd@gmail.com</p>
          </div>

          <h3 className="mb-3 text-xl font-semibold">
            What rights do you have?
          </h3>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p>
              You have the right to free information, correction, deletion,
              restriction of processing, or revocation of your consent at any
              time. You also have the right to lodge a complaint with the
              competent supervisory authority.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">2. Server Log Files</h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-4">
              When you visit this website, information is automatically
              collected:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-2">
              <li>Browser type and version</li>
              <li>Operating system used</li>
              <li>Referrer URL</li>
              <li>Hostname</li>
              <li>Time of request</li>
              <li>IP address</li>
            </ul>
            <p>
              Legal basis: Art. 6 para. 1 lit. f GDPR (legitimate interest in
              technically error-free presentation)
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            3. Cookies & Analytics
          </h2>
          <div className="bg-card/50 border-primary/20 space-y-4 rounded-lg border p-6">
            <p>
              This website is designed to be **cookieless**. We do not store any
              cookies on your device for tracking or core functionality.
            </p>

            <h3 className="text-lg font-semibold">
              Vercel Analytics & Speed Insights (Cookieless)
            </h3>
            <p>
              We use Vercel Analytics and Speed Insights to monitor website
              performance and traffic anonymously. This service **does not use
              cookies**. Data is collected in an aggregated and anonymized
              manner that does not allow for personal identification.
            </p>
            <h3 className="text-lg font-semibold">
              Local Storage (Functional Storage)
            </h3>
            <p>
              We use your browser&apos;s &quot;local storage&quot; to save your regional
              preference (e.g., your selected marketplace like US or Germany).
              This is used solely to ensure the technically correct display of
              currencies, pricing, and regional content. This data is strictly
              functional and is not used for tracking purposes or the creation
              of user profiles.
            </p>

            <h3 className="text-lg font-semibold">Affiliate Links (Amazon)</h3>
            <p>
              While this site does not set cookies itself, clicking on an
              affiliate link (e.g., to Amazon) will redirect you to the
              provider&apos;s website. At that point, the provider (Amazon) may set
              cookies on their own domain to track the referral. Please see the
              next section &quot;Amazon Affiliate Program&quot; for more details.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            4. Amazon Affiliate Program
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-4">
              This website participates in the Amazon EU Associates Program.
              When you click an Amazon link, cookies are set to track which
              website referred you to Amazon.
            </p>
            <p className="mb-4">
              Legal basis: Art. 6 para. 1 lit. a GDPR (consent)
            </p>
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
          <h2 className="mb-4 text-2xl font-semibold">
            5. Disclaimer for Price Information
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-4">
              All prices and product information are provided by third parties.
              We cannot guarantee that this information is always current or
              error-free.
            </p>
            <p>
              Binding prices can only be found on the respective merchants&apos;
              websites.
            </p>
          </div>
        </section>

        <p className="text-muted-foreground mt-12 text-base">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
