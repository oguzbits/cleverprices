import { ClientDate } from "@/components/ui/ClientDate";
import { LegalPrice } from "@/components/ui/LegalPrice";
import { PaymentMethodIcon } from "@/components/ui/PaymentMethodIcon";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import { type ProductOffer } from "@/lib/data-sources";
import { type Product } from "@/lib/product-definitions";
import { getProductFamilyMembers } from "@/lib/product-registry";
import { mergeLivePrices } from "@/lib/server/live-data";
import { formatCurrency } from "@/lib/utils/formatting";
import { Star } from "lucide-react";

interface OffersListProps {
  product: Product;
  productId: number;
  countryCode: CountryCode;
  selectedCondition?: "new" | "used" | "renewed";
  initialPrice?: number;
  isParentView?: boolean;
  variants?: Product[]; // Pre-merged variants from server
}

export async function IdealoProductOffers({
  product,
  countryCode,
  selectedCondition = "new",
  isParentView = false,
  variants: passedVariants,
}: OffersListProps) {
  const countryConfig = getCountryByCode(countryCode);

  // 1. Determine which products we are showing offers for
  let productsToShow: {
    product: Product;
    price?: number;
    type?: "new" | "renewed" | "warehouse";
  }[] = [];

  const isUsedTrack =
    selectedCondition === "used" || selectedCondition === "renewed";

  if (isParentView && product.parentAsin) {
    let familyMembers = passedVariants
      ? [product, ...passedVariants]
      : await getProductFamilyMembers(product.parentAsin, countryCode);

    if (familyMembers.length === 0) {
      familyMembers = [product];
    }

    // Only merge if not already passed (pre-merged)
    if (!passedVariants) {
      familyMembers = await mergeLivePrices(familyMembers, countryCode);
    }

    // Hub Mode: Show one offer per unique variation (color, size, etc.)
    const uniqueVariations = new Map<string, (typeof productsToShow)[0]>();

    familyMembers.forEach((m: Product) => {
      const p = m.prices[countryCode];
      const wp = m.usedPrices?.[countryCode];
      const cond = (m.condition || "").toLowerCase();
      const variantKey = m.variationAttributes || String(m.id);

      // Rule: New takes precedence over Used for the same variation on a Hub
      if (isUsedTrack) {
        if (cond === "renewed" && p && p > 0) {
          const current = uniqueVariations.get(variantKey);
          if (!current || p < (current.price || Infinity)) {
            uniqueVariations.set(variantKey, {
              product: m,
              price: p,
              type: "renewed",
            });
          }
        } else if (wp && wp > 0) {
          const current = uniqueVariations.get(variantKey);
          if (!current || wp < (current.price || Infinity)) {
            uniqueVariations.set(variantKey, {
              product: m,
              price: wp,
              type: "warehouse",
            });
          }
        }
      } else {
        if (cond !== "renewed" && cond !== "used" && p && p > 0) {
          const current = uniqueVariations.get(variantKey);
          if (!current || p < (current.price || Infinity)) {
            uniqueVariations.set(variantKey, {
              product: m,
              price: p,
              type: "new",
            });
          }
        }
      }
    });

    productsToShow = Array.from(uniqueVariations.values()).sort(
      (a, b) => (a.price || 0) - (b.price || 0),
    );
  } else {
    // Normal mode: current product + identical siblings (same specs)
    let targets = [product];

    if (product.parentAsin) {
      let familyMembers =
        passedVariants ||
        (await getProductFamilyMembers(
          product.parentAsin,
          countryCode,
          true, // skipFullMapping
        ));

      // Only merge if not passed
      if (!passedVariants) {
        familyMembers = await mergeLivePrices(familyMembers, countryCode);
      }

      const curAttrs = product.variationAttributes?.toLowerCase().trim();
      const identicalSiblings = familyMembers.filter(
        (m: Product) =>
          m.id !== product.id &&
          m.variationAttributes?.toLowerCase().trim() === curAttrs,
      );
      const mergedProduct =
        familyMembers.find((f: Product) => f.id === product.id) || product;
      targets = [mergedProduct, ...identicalSiblings];
    } else if (!passedVariants) {
      // Single Product (No Parent) - MUST refreshed prices to match "Neu ab" if not passed
      const [fresh] = await mergeLivePrices([product], countryCode);
      targets = [fresh];
    } else {
      targets = [product];
    }

    // Process all spec-identical targets (Prices are already merged)
    for (const p of targets) {
      if (isUsedTrack) {
        const cond = (p.condition || "").toLowerCase();
        if (cond === "renewed") {
          const pr = p.prices[countryCode];
          if (pr)
            productsToShow.push({ product: p, price: pr, type: "renewed" });
        }
        const up = p.usedPrices?.[countryCode];
        if (up)
          productsToShow.push({ product: p, price: up, type: "warehouse" });
      } else {
        const cond = (p.condition || "").toLowerCase();
        if (cond !== "renewed" && cond !== "used") {
          const pr = p.prices[countryCode];
          if (pr) productsToShow.push({ product: p, price: pr, type: "new" });
        }
      }
    }

    // DEDUPLICATE: Only show the single best offer for this specific variant spec
    if (productsToShow.length > 1) {
      let best: (typeof productsToShow)[0] | null = null;
      productsToShow.forEach((item: (typeof productsToShow)[0]) => {
        if (!item.price) return;
        if (!best) {
          best = item;
          return;
        }

        const vPrice = item.price;
        const ePrice = best.price!;
        const vIsRenewed = item.type === "renewed";
        const eIsRenewed = best.type === "renewed";

        let shouldReplace = false;
        if (vIsRenewed && !eIsRenewed) {
          // New option is Professional (Renewed/New)
          // Default to it if current is Warehouse/Marketplace
          shouldReplace = true;
        } else if (!vIsRenewed && eIsRenewed) {
          // Current is Professional, New is Marketplace/Warehouse
          // Replace only if much cheaper
          const bias = item.type === "warehouse" ? 50 : 20;
          if (vPrice < ePrice - bias) shouldReplace = true;
        } else {
          // Same types, take the cheaper one
          if (vPrice < ePrice) shouldReplace = true;
        }

        if (shouldReplace) {
          best = item;
        }
      });
      productsToShow = best ? [best] : [];
    }
  }

  // 2. Generate offers from the price data
  const offers: (ProductOffer & { product: Product })[] = [];

  productsToShow.forEach(({ product: p, price, type }) => {
    if (price && price > 0) {
      offers.push({
        source: "amazon" as const,
        price: price,
        currency: countryConfig?.currency || "EUR",
        displayPrice: formatCurrency(price, countryCode),
        affiliateLink: `/out/${p.slug}`,
        condition:
          type === "renewed" || type === "warehouse"
            ? "used"
            : (p.condition.toLowerCase() as any),
        availability: "in_stock" as const,
        freeShipping: true,
        seller:
          type === "renewed"
            ? "Amazon Erneuert"
            : type === "warehouse"
              ? "Amazon Warehouse"
              : "Amazon",
        country: countryCode,
        product: p, // Link back to the specific variant
      });
    }
  });

  // Sort aggregated offers by price
  if (isParentView) {
    offers.sort((a, b) => a.price - b.price);
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
          <div className="w-[18%] px-[12px] py-2">Angebotsbezeichnung</div>
          <div className="w-[18%] px-[12px] py-2">Preis & Versand</div>
          <div className="w-[12%] px-[12px] py-2">Zahlungsarten*</div>
          <div className="w-[14%] px-[12px] py-2 text-center">Lieferung</div>
          <div className="w-[20%] px-[12px] py-2">Shop</div>
          <div className="w-[18%] py-2"></div>
        </div>

        <ul className="productOffers-list">
          {offers.map((offer, index) => (
            <li
              key={`${offer.source}-${offer.product?.id || index}`}
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
                  {offer.product?.rawTitle ||
                    offer.product?.title ||
                    product.rawTitle ||
                    product.title}
                </a>
              </div>

              {/* Desktop Title */}
              <div className="hidden min-[600px]:block min-[600px]:w-full min-[600px]:min-w-0 min-[600px]:self-start min-[600px]:px-[12px] min-[600px]:pt-[7px] min-[840px]:w-[18%]">
                <a
                  href={offer.affiliateLink}
                  target="_blank"
                  rel="noopener nofollow"
                  className="line-clamp-4 block max-h-[4.8em] overflow-hidden text-[11px] leading-normal font-bold text-ellipsis text-[#2d2d2d] underline decoration-[#dcdcdc] transition-colors hover:no-underline min-[840px]:text-[12px]"
                >
                  {offer.product?.rawTitle ||
                    offer.product?.title ||
                    product.rawTitle ||
                    product.title}
                </a>
              </div>

              <div className="flex w-full items-center justify-between min-[600px]:contents">
                {/* Price Column */}
                <div className="w-auto min-w-0 p-0 min-[600px]:w-[18%] min-[600px]:shrink-0 min-[600px]:self-start min-[600px]:px-[12px] min-[840px]:w-[18%]">
                  <div className="flex flex-col">
                    <a
                      href={offer.affiliateLink}
                      target="_blank"
                      rel="noopener nofollow"
                    >
                      <LegalPrice
                        price={offer.price}
                        displayPrice={offer.displayPrice}
                        priceClassName="text-[24px] font-bold text-[#2d2d2d]"
                      />
                    </a>
                    <div className="mt-1 text-[11px] text-[#666]">
                      {offer.freeShipping ? "inkl. Versand" : "zzgl. Versand"}
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="hidden min-[600px]:flex min-[600px]:w-[18%] min-[600px]:px-[12px] min-[600px]:pt-4 min-[840px]:w-[12%]">
                  <div className="flex flex-wrap gap-[2px]">
                    {["Visa", "PayPal", "Rechnung"].map((m: string) => (
                      <PaymentMethodIcon key={m} method={m} />
                    ))}
                  </div>
                </div>

                {/* Delivery */}
                <div className="hidden min-[600px]:block min-[600px]:w-[18%] min-[600px]:px-[12px] min-[840px]:w-[14%]">
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
                <div className="flex flex-col items-center gap-1.5 text-center min-[600px]:w-[24%] min-[600px]:px-[12px] min-[840px]:w-[20%]">
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
                <div className="min-[600px]:w-[22%] min-[600px]:px-[12px] min-[840px]:w-[18%]">
                  <a
                    href={offer.affiliateLink}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-flex h-[30px] w-full items-center justify-center rounded-[2px] bg-[#38bf84] px-[20px] text-[13px] font-bold text-white no-underline hover:bg-[#2fa372] hover:no-underline"
                  >
                    Zum Shop*
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* DISCLAIMER */}
      <div className="mt-4 text-left text-[12px] text-[#767676]">
        * Preise inkl. MwSt., ggf. zzgl. Versand. Preise und Verfügbarkeit
        können sich ändern.
        {product.pricesLastUpdated?.[countryCode] && (
          <span className="mt-1 block">
            Zuletzt aktualisiert:{" "}
            <ClientDate
              date={product.pricesLastUpdated?.[countryCode] || new Date()}
            />
          </span>
        )}
      </div>
    </div>
  );
}

function IdealoProductOffersSkeleton() {
  return (
    <div className="order-2 mb-11 w-full min-w-0 animate-pulse xl:w-3/4 xl:pl-[15px]">
      <div className="h-10 rounded-t-md border border-[#b4b4b4] bg-gray-100" />
      <div className="h-32 rounded-b-md border border-t-0 border-[#b4b4b4] bg-white" />
    </div>
  );
}
