import { HeroCategoryPills } from "@/components/hero-category-pills";
import { HeroDealCards } from "@/components/hero-deal-cards";
import { HeroTableDemo } from "@/components/hero-table-demo";
import { getAllCountries, getCountryByCode, getFlag } from "@/lib/countries";
import { getAllProducts } from "@/lib/product-registry";
import { adaptToUIModel, getLocalizedProductData } from "@/lib/utils/products";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";

const PopularProducts = dynamic(
  () =>
    import("@/components/PopularProducts").then((mod) => mod.PopularProducts),
  {
    ssr: true,
  },
);

const PriceDrops = dynamic(
  () => import("@/components/PriceDrops").then((mod) => mod.PriceDrops),
  {
    ssr: true,
  },
);

export function HomeContent({ country }: { country: string }) {
  const countryConfig = getCountryByCode(country);
  const allProducts = getAllProducts();

  // Adapt products to UI model
  const uiProducts = allProducts
    .map((p) => {
      const { price } = getLocalizedProductData(p, countryConfig?.code || country);
      if (price === null || price === 0) return null;

      return adaptToUIModel(
        p,
        countryConfig?.code || country,
        countryConfig?.currency,
        countryConfig?.symbol,
      );
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const mockPriceDrops = uiProducts.slice(2, 6).map((p) => {
    const dropPercentage = Math.floor(Math.random() * 20) + 10;
    const oldPrice = p.price.amount / (1 - dropPercentage / 100);
    return {
      ...p,
      dropPercentage,
      oldPrice,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "realpricedata.com",
    url: "https://realpricedata.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://realpricedata.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="bg-background flex flex-col gap-0 pb-8 md:pb-16">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col gap-2 pt-4 sm:gap-4 md:gap-8">
        <section className="container mx-auto px-4 pt-4 sm:pt-8 md:pt-12">
          {/* Hero Section */}
          <div className="mb-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-1 max-w-2xl text-left lg:order-1">
              <h1 className="dark:text-foreground mb-6 text-4xl leading-[1.05] font-black tracking-tighter text-[#1a1a1a] sm:text-5xl md:text-6xl">
                Save money on your <br />
                <span className="text-(--hero-emphasis)">
                  next Amazon purchase.
                </span>
              </h1>
              <p className="text-muted-foreground mb-8 max-w-xl text-lg leading-relaxed md:text-xl">
                <strong className="font-black tracking-tight">
                  <span className="text-(--ccc-red)">real</span>
                  <span className="text-(--ccc-orange)">price</span>
                  <span className="text-(--ccc-yellow)">data</span>
                  <span className="text-muted-foreground/60">.com</span>
                </strong>{" "}
                is an Amazon price tracker and unit-price calculator to ensure
                you never overpay again.
              </p>

              <div className="flex flex-col gap-6">
                <div className="text-muted-foreground flex items-center gap-2 text-base">
                  <HeroCategoryPills country={country} />
                </div>
              </div>
            </div>
            <div className="relative order-2 mx-auto hidden w-full max-w-[800px] lg:order-2 lg:ml-auto lg:block">
              <HeroTableDemo />
            </div>
          </div>

          {/* Country Flag Selection Wrapper */}
          <div className="border-border mb-16 flex flex-col items-center justify-center border-y py-10">
            <p className="text-muted-foreground mb-6 text-sm font-bold tracking-widest uppercase">
              Supported Marketplaces
            </p>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {getAllCountries().map((c) => {
                const isActive = c.code === country;
                const flagUrl = getFlag(c.code);
                
                // We use standard hierarchical URLs for all countries.
                // The proxy/middleware will handle updating the session cookie
                // and redirecting /us to / automatically.
                const href = c.isLive ? `/${c.code}` : "#";

                return (
                  <Link
                    key={c.code}
                    href={href}
                    className={`group relative flex flex-col items-center no-underline transition-all ${
                      c.isLive
                        ? "cursor-pointer"
                        : "pointer-events-none cursor-not-allowed opacity-20 grayscale"
                    }`}
                    aria-disabled={!c.isLive}
                  >
                    <div
                      className={`flex items-center justify-center overflow-hidden border-2 transition-all duration-300 ${
                        isActive
                          ? "border-primary/30 bg-primary/10 rounded-2xl p-4 shadow-sm"
                          : "border-transparent bg-transparent p-4"
                      }`}
                    >
                      <Image
                        src={flagUrl}
                        alt={c.name}
                        width={64}
                        height={40}
                        className="h-8 w-12 object-cover transition-all sm:h-10 sm:w-16"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <HeroDealCards country={country} />
          <Suspense>
            <PopularProducts products={uiProducts} country={country} />
          </Suspense>
          <Suspense>
            <PriceDrops products={mockPriceDrops} country={country} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

export default HomeContent;
