import type { Metadata } from "next";
import { getOpenGraph, getAlternateLanguages } from "@/lib/metadata";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BUILD_TIME } from "@/lib/build-config";

export const metadata: Metadata = {
  title: "Privacy Policy | realpricedata.com",
  description:
    "Privacy Policy for realpricedata.com. Learn about data protection, your rights, and our cookie-less analysis.",
  alternates: {
    canonical: "https://realpricedata.com/privacy",
    languages: getAlternateLanguages(
      "privacy",
      {
        de: "/datenschutz",
      },
      false,
    ),
  },
  openGraph: getOpenGraph({
    title: "Privacy Policy | realpricedata.com",
    description: "Privacy Policy and data protection information.",
    url: "https://realpricedata.com/privacy",
  }),
};

export default function PrivacyPage() {
  const lastUpdated = new Date(BUILD_TIME).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

      <LanguageSwitcher currentLang="en" currentPath="privacy" />

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            1. Data Protection at a Glance
          </h2>

          <div className="bg-card/50 border-primary/20 mb-6 rounded-lg border p-6">
            <p className="mb-4">
              The following notes provide a simple overview of what happens to
              your personal data when you visit our website. Personal data is
              all data with which you can be personally identified.
            </p>
          </div>

          <h3 className="mb-3 text-xl font-semibold">Responsible Party</h3>
          <div className="bg-card/50 border-primary/20 mb-6 rounded-lg border p-6">
            <p className="mb-4">
              <strong>Oguz Öztürk</strong>
            </p>
            <p className="mb-2">Boberger Anger 87</p>
            <p className="mb-2">21031 Hamburg</p>
            <p className="mb-4">Email: info@realpricedata.com</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            2. Cookies & Analysis Tools
          </h2>
          <div className="bg-card/50 border-primary/20 space-y-4 rounded-lg border p-6">
            <p>
              This website is designed **not to store its own cookies** for
              tracking or functionality on your device. We value data privacy
              and use modern, privacy-friendly alternatives.
            </p>

            <h3 className="text-lg font-semibold">
              Vercel Analytics & Speed Insights (Cookieless)
            </h3>
            <p>
              We use Vercel Analytics and Speed Insights to anonymously analyze
              the technical performance and usage of our website. **No cookies
              are set**. Data is collected completely anonymously.
            </p>
            <h3 className="text-lg font-semibold">Local Storage</h3>
            <p>
              We use your browser&apos;s &quot;Local Storage&quot; to save your
              regional preference (e.g., selected marketplace like USA or
              Germany). This is purely functional to display correct currencies
              and prices.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            3. Amazon Associate Program
          </h2>
          <div className="bg-card/50 border-primary/20 rounded-lg border p-6">
            <p className="mb-4">
              This website participates in the Amazon EU Associates Program.
              When you click an Amazon link, cookies may be set by Amazon to
              track the origin of the order.
            </p>
            <p>
              Amazon Privacy Policy:{" "}
              <a
                href="https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Amazon Privacy Notice
              </a>
            </p>
          </div>
        </section>

        <p className="text-muted-foreground mt-12 text-base">
          Last Updated: {lastUpdated}
        </p>
      </div>
    </div>
  );
}
