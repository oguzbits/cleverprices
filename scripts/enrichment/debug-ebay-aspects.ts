import { EbayEnricher } from "./ebay-enricher";
import { EBAY_FIELD_MAP, normalizeEbayValue } from "./ebay-mapper";

async function debugEbay() {
  const enricher = new EbayEnricher();
  const gtin = "0657768195235"; // iPhone 14
  const searchQ = "Apple iPhone 14 128GB";
  console.log(`🔍 Debugging GTIN: ${gtin} and search: ${searchQ}`);

  const token = await enricher.getAccessToken();
  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?gtin=${gtin}&limit=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
    },
  });

  const data: any = await response.json();
  let item = data.itemSummaries?.[0];

  if (!item) {
    console.log("   🔄 No GTIN match, trying keyword search...");
    const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchQ)}&limit=1`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
      },
    });
    const searchData: any = await searchRes.json();
    item = searchData.itemSummaries?.[0];
  }

  if (item) {
    console.log(`✅ Found Item: ${item.title} (${item.itemId})`);
    const details = await enricher.getItemDetails(item.itemId, "EBAY_US");

    console.log("\n📦 MAPPED & NORMALIZED ASPECTS:");
    details.localizedAspects?.forEach((a: any) => {
      const mappedKey = EBAY_FIELD_MAP[a.name];
      if (mappedKey) {
        const normValue = normalizeEbayValue(a.name, a.value);
        console.log(
          `- ${mappedKey} (${a.name}): ${normValue} [ORIGINAL: ${a.value}]`,
        );
      } else {
        console.log(`- [UNMAPPED] ${a.name}: ${a.value}`);
      }
    });
  } else {
    console.log("❌ No item found.");
  }
}

debugEbay();
