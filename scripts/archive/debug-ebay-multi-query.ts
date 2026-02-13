import { EbayEnricher } from "./ebay-enricher";

async function debugEbay() {
  const enricher = new EbayEnricher();
  const token = await enricher.getAccessToken();

  const gtin = "4711387470633"; // Example passed previously
  const titlesToTry = [
    "ASRock RX 7900XTX Phantom Gaming",
    "RX 7900XTX Phantom Gaming",
    "ASRock RX 7900XTX",
    "7900XTX Phantom Gaming",
  ];

  for (const q of titlesToTry) {
    console.log(`\n🔎 Testing Query: "${q}"`);
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=3`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
      },
    });

    const data: any = await response.json();
    if (data.itemSummaries && data.itemSummaries.length > 0) {
      for (const item of data.itemSummaries) {
        console.log(`  ✅ Found: ${item.title} (${item.itemId})`);
        // Check if it has aspects
        const details = await enricher.getItemDetails(item.itemId);
        if (details.localizedAspects) {
          console.log(
            `     📊 Aspects found: ${details.localizedAspects.length}`,
          );
          // print first 3
          details.localizedAspects
            .slice(0, 3)
            .forEach((a: any) => console.log(`       - ${a.name}: ${a.value}`));
        } else {
          console.log(`     ❌ No aspects`);
        }
      }
    } else {
      console.log("  ❌ No results");
    }
  }
}

debugEbay();
