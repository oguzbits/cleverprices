import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { IdealoProductCard } from "@/components/landing/IdealoProductCard";

export default function DebugCardsPage() {
  const products = [
    {
      title:
        "Adidas 10-Pack Retro Short Pant Active Flex Cotton schwarz orange",
      price: 24.47,
      slug: "adidas-10-pack-retro-short",
      discountRate: 53,
      isBestseller: true,
      categoryName: "Boxer Briefs",
      rating: 4.5,
      ratingCount: 125,
    },
    {
      title: "Apple iPhone 17 Pro Max 2000GB Cosmic Orange",
      price: 1949.99,
      slug: "iphone-17-pro-max",
      discountRate: 9,
      energyLabel: "A" as const,
      categoryName: "5G Handy",
      rating: 4.8,
      ratingCount: 8,
    },
    {
      title: "Dyson V12 Origin 492711-01",
      price: 299.0,
      slug: "dyson-v12-origin",
      discountRate: 22,
      categoryName: "Akku-Staubsauger",
      rating: 4.5,
      ratingCount: 10,
    },
    {
      title: "EA Sports FC 26 PS5",
      price: 36.9,
      slug: "ea-sports-fc-26",
      discountRate: 15,
      isBestseller: true,
      categoryName: "PS5 Spiele",
      rating: 4.2,
      ratingCount: 90,
    },
  ];

  return (
    <div className="container mx-auto min-h-screen space-y-12 bg-gray-50 p-8">
      <section>
        <h1 className="mb-6 text-2xl font-bold">
          Idealo-Style Card Verification
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.slug} className="flex flex-col gap-2">
              <span className="font-mono text-xs text-gray-500">{p.slug}</span>
              <IdealoProductCard {...p} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-bold">Carousel Verification</h2>
        <IdealoProductCarousel
          title="Aktuelle Deals für dich"
          products={products}
        />
      </section>
    </div>
  );
}
