import { HeroCategoryPills } from "@/components/hero-category-pills";
import { HeroDealCards } from "@/components/hero-deal-cards";
import { HeroTableDemo } from "@/components/hero-table-demo";
import { PopularProducts } from "@/components/PopularProducts";
import { PriceDrops } from "@/components/PriceDrops";
import { MockAmazonAPI } from "@/lib/amazon-api";
import { getAllCountries } from "@/lib/countries";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export async function HomeContent({ country }: { country: string }) {
  const allProducts = await MockAmazonAPI.searchProducts("");
  
  // Create mock data for sections
  const mockPopularProducts = allProducts.slice(0, 5).map(p => ({
    ...p,
    rating: 4.5 + Math.random() * 0.5,
    reviewCount: Math.floor(Math.random() * 1000) + 50
  }));

  const mockPriceDrops = allProducts.slice(2, 6).map(p => {
    const dropPercentage = Math.floor(Math.random() * 20) + 10;
    const oldPrice = p.price.amount / (1 - dropPercentage / 100);
    return {
      ...p,
      dropPercentage,
      oldPrice
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
    <div className="flex flex-col gap-0 pb-8 md:pb-16 bg-[#F8F9FA] dark:bg-background">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Banner */}
      <div className="w-full bg-[#B22222] py-2 px-4 flex items-center justify-center gap-3 text-white text-center">
        <Image src="/icon-192.png" alt="Promo" width={24} height={24} className="invert hidden sm:block" />
        <p className="text-sm font-bold tracking-tight">Track prices and save on your holiday shopping! 🎁</p>
        <Link href={`/${country}/categories`} className="text-xs underline font-bold ml-2 whitespace-nowrap">Shop Now →</Link>
      </div>

      <div className="flex flex-col gap-2 sm:gap-4 md:gap-8 pt-4">
        {/* Hero Section */}
        <section className="container px-4 mx-auto pt-4 sm:pt-8 md:pt-12 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16">
            <div className="max-w-2xl text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6 leading-[1.1] text-foreground">
                Save money on your <br />
                <span className="text-[rgb(0,102,204)] dark:text-blue-400">next Amazon purchase.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed max-w-xl">
                <strong className="font-black">
                  <span className="text-[#E53935] dark:text-[#EF5350]">real</span>
                  <span className="text-[#FB8C00] dark:text-[#FFA726]">price</span>
                  <span className="text-[#FBC02D] dark:text-[#FDD835]">data</span>
                  <span className="text-muted-foreground">.com</span>
                </strong> is a free Amazon price tracker and unit-price calculator to ensure you never overpay again.
              </p>

              <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <HeroCategoryPills />
                 </div>
              </div>
            </div>
            <div className="relative w-full max-w-[800px] mx-auto lg:ml-auto order-1 lg:order-2">
              <HeroTableDemo />
            </div>
          </div>

          {/* Feature Cards Section */}

          {/* Country Flag Selection Wrapper */}
          <div className="flex flex-col items-center justify-center py-10 border-y border-border mb-16">
            <p className="text-xs text-muted-foreground mb-6 uppercase tracking-widest font-bold">Supported Marketplaces</p>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {getAllCountries().map((c) => (
                <Link 
                  key={c.code} 
                  href={c.isLive ? `/${c.code}` : "#"}
                  className={`group flex flex-col items-center gap-2 transition-transform no-underline ${
                    c.isLive 
                      ? "hover:scale-110 cursor-pointer" 
                      : "opacity-30 grayscale cursor-not-allowed pointer-events-none"
                  }`}
                  aria-disabled={!c.isLive}
                >
                  <span className="text-4xl filter drop-shadow-sm">{c.flag}</span>
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-[#0066CC] dark:group-hover:text-blue-400 transition-colors">{c.code.toUpperCase()}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Highlighted Deals Section */}
          <div className="mb-16">
            <div className="mb-6 border-b border-border pb-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0066CC] dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-2">
                Highlighted Deals <span className="text-foreground no-underline">→</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">These are outstanding deals we've found and feel are worth sharing.</p>
            </div>
            <HeroDealCards />
          </div>

          {/* Popular Products Section */}
          <PopularProducts products={mockPopularProducts} />

          {/* Price Drops Section */}
          <PriceDrops products={mockPriceDrops} />

        </section>
      </div>
    </div>
  );
}

export default HomeContent;
