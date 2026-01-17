import { LegalPrice } from "@/components/ui/LegalPrice";
import { PaymentMethodIcon } from "@/components/ui/PaymentMethodIcon";
import { getAffiliateRedirectPath } from "@/lib/affiliate-utils";
import type { CountryCode } from "@/lib/countries";
import { getCountryByCode } from "@/lib/countries";
import type { ProductOffer, UnifiedProduct } from "@/lib/data-sources";
import type { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatting";
import { Star } from "lucide-react";

interface OffersListProps {
  product: Product;
  countryCode: CountryCode;
  unifiedProductPromise: Promise<UnifiedProduct | null> | UnifiedProduct | null;
}

/**
 * Component for the "Above the Fold" price tag.
 * Shows a skeleton instead of outdated DB prices.
 */
export async function IdealoLivePrice({
  product,
  countryCode,
  unifiedProductPromise,
  className = "text-[15px] font-extrabold text-[#2d2d2d]",
}: OffersListProps & { className?: string }) {
  const unifiedProduct = await unifiedProductPromise;
  const bestPrice =
    unifiedProduct?.offers?.[0]?.price || product.prices[countryCode];

  return <LegalPrice price={bestPrice} priceClassName={className} />;
}

export function IdealoLivePriceSkeleton({
  className = "h-5 w-16",
}: {
  className?: string;
}) {
  return <div className={cn("animate-pulse rounded bg-gray-200", className)} />;
}

/**
 * Streaming component for Product Offers.
 * This can be used with Suspense to prevent blocking the main page render.
 */
export async function IdealoProductOffers({
  product,
  countryCode,
  unifiedProductPromise,
}: OffersListProps) {
  // Await the live data if it's a promise
  const unifiedProduct = await unifiedProductPromise;
  const countryConfig = getCountryByCode(countryCode);
  const price = product.prices[countryCode];

  // Get offers from live data, or fallback to DB price as a single offer
  const offers: ProductOffer[] = unifiedProduct?.offers || [];
  if (offers.length === 0 && price) {
    offers.push({
      source: "amazon" as const,
      price,
      currency: countryConfig?.currency || "EUR",
      displayPrice: formatCurrency(price, countryCode),
      affiliateLink: getAffiliateRedirectPath(product.slug),
      condition: (product.condition?.toLowerCase() as any) || "new",
      availability: "in_stock" as const,
      freeShipping: true,
      seller: "Amazon",
      country: countryCode,
    });
  }

  return (
    <div
      id="offerList"
      className="productOffers order-2 mb-11 w-full min-w-0 scroll-mt-[15vh] xl:w-3/4 xl:pl-[15px]"
    >
      <div className="productOffers-header flex min-h-[40px] flex-wrap items-center justify-between gap-4 rounded-t-md border border-b-0 border-[#b4b4b4] bg-[#f0f0f0] p-3 sm:flex-nowrap">
        <h2 className="productOffers-headerTitle text-lg font-bold sm:text-xl">
          Preisvergleich ({offers.length})
        </h2>
      </div>

      <div className="rounded-b-md border border-[#b4b4b4] border-t-[#dcdcdc]">
        {/* Column Headers */}
        <div className="productOffers-listHeadline hidden border-b border-[#dcdcdc] bg-white text-[11px] font-bold text-[#2d2d2d] min-[960px]:flex">
          <div className="w-[18%] px-[15px] py-2">Angebotsbezeichnung</div>
          <div className="w-[14%] px-[15px] py-2">Preis & Versand</div>
          <div className="w-[14%] px-[15px] py-2">Zahlungsarten*</div>
          <div className="w-[16%] px-[15px] py-2 text-center">Lieferung</div>
          <div className="w-[20%] px-[15px] py-2">Shop</div>
          <div className="w-[18%] py-2"></div>
        </div>

        <ul className="productOffers-list">
          {offers.map((offer, index) => (
            <li
              key={`${offer.source}-${index}`}
              className="productOffers-listItem group flex flex-col border-b border-[#dcdcdc] bg-white p-3.5 text-xs leading-[1.4] text-[#2d2d2d] hover:bg-[#fafafa] min-[600px]:flex-row min-[600px]:flex-wrap min-[600px]:gap-0 min-[600px]:px-0 min-[600px]:py-[15px]"
            >
              {/* Mobile Title */}
              <div className="mb-2 w-full min-[600px]:hidden">
                <a
                  href={offer.affiliateLink}
                  target="_blank"
                  rel="noopener nofollow"
                  className="text-[12px] font-bold text-[#2d2d2d] underline decoration-[#dcdcdc] hover:no-underline"
                >
                  {product.title}
                </a>
              </div>

              {/* Desktop Title */}
              <div className="hidden min-[600px]:block min-[600px]:w-full min-[600px]:min-w-0 min-[600px]:self-start min-[600px]:px-[15px] min-[600px]:pt-[7px] min-[840px]:w-[18%]">
                <a
                  href={offer.affiliateLink}
                  target="_blank"
                  rel="noopener nofollow"
                  className="line-clamp-4 block max-h-[4.8em] overflow-hidden text-[11px] leading-normal font-bold text-ellipsis text-[#2d2d2d] underline decoration-[#dcdcdc] transition-colors hover:no-underline min-[840px]:text-[12px]"
                >
                  {product.title}
                </a>
              </div>

              <div className="flex w-full items-center justify-between min-[600px]:contents">
                {/* Price Column */}
                <div className="w-auto min-w-0 p-0 min-[600px]:w-[18%] min-[600px]:shrink-0 min-[600px]:self-start min-[600px]:px-[15px] min-[840px]:w-[14%]">
                  <div className="flex flex-col">
                    <a
                      href={offer.affiliateLink}
                      target="_blank"
                      rel="noopener nofollow"
                    >
                      <LegalPrice
                        price={offer.price}
                        displayPrice={offer.displayPrice}
                        priceClassName="min-[600px]:text-[20px] lg:text-2xl text-[#2d2d2d]"
                      />
                    </a>
                    <div className="mt-1 text-[11px] text-[#666]">
                      {offer.freeShipping ? "inkl. Versand" : "zzgl. Versand"}
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="hidden min-[600px]:flex min-[600px]:w-[18%] min-[600px]:px-[15px] min-[600px]:pt-4 min-[840px]:w-[14%]">
                  <div className="flex flex-wrap gap-[2px]">
                    {["Visa", "PayPal", "Rechnung"].map((m) => (
                      <PaymentMethodIcon key={m} method={m} />
                    ))}
                  </div>
                </div>

                {/* Delivery */}
                <div className="hidden min-[600px]:block min-[600px]:w-[18%] min-[600px]:px-[15px] min-[840px]:w-[16%]">
                  <div className="text-xs leading-[1.2] text-[#2d2d2d]">
                    <span className="font-bold">
                      {offer.availability === "in_stock"
                        ? "Auf Lager "
                        : "2-5 Tage "}
                    </span>
                    <span className="block font-normal">
                      {offer.deliveryTime || "1-2 Werktage"}
                    </span>
                  </div>
                </div>

                {/* Shop */}
                <div className="flex flex-col items-center gap-1.5 text-center min-[600px]:w-[24%] min-[600px]:px-[15px] min-[840px]:w-[20%]">
                  <div className="flex h-[22px] w-[60px] items-center justify-center overflow-hidden rounded border border-[#eee] bg-[#f5f5f5] text-[9px] min-[600px]:h-[30px] min-[600px]:w-[80px] min-[600px]:text-[10px]">
                    {offer.seller || "Shop"}
                  </div>
                  <div className="flex items-center gap-1 text-[#2d2d2d]">
                    <Star className="h-3 w-3 fill-[#38BF84] text-[#38BF84]" />
                    <span className="text-[12px] font-bold">
                      {offer.merchantRating?.toFixed(1) || "4.5"}
                    </span>
                  </div>
                </div>

                {/* Button */}
                <div className="min-[600px]:w-[22%] min-[600px]:px-[15px] min-[840px]:w-[18%]">
                  <a
                    href={offer.affiliateLink}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-flex h-[30px] w-full items-center justify-center rounded-[2px] bg-[#38bf84] px-[20px] text-[13px] font-bold text-white hover:bg-[#2fa372]"
                  >
                    Zum Shop*
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function IdealoProductOffersSkeleton() {
  return (
    <div className="order-2 mb-11 w-full min-w-0 animate-pulse xl:w-3/4 xl:pl-[15px]">
      <div className="h-10 rounded-t-md border border-[#b4b4b4] bg-gray-100" />
      <div className="h-32 rounded-b-md border border-t-0 border-[#b4b4b4] bg-white" />
    </div>
  );
}
