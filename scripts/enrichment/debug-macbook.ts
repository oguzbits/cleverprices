import { EbayEnricher } from "./ebay-enricher";

async function run() {
  const enricher = new EbayEnricher();
  const q = "MW123D/A";
  console.log(`Searching for ${q}...`);
  
  // Try MPN search logic
  const token = await enricher.getAccessToken();
  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=5&fieldgroups=ASPECTS,EXTENDED`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE"
    }
  });
  
  const data = await res.json();
  console.log("Results:", JSON.stringify(data, null, 2));
}

run();
