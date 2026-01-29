/**
 * WikiData Hardware Enricher
 * Uses SPARQL to fetch structured technical data for hardware components.
 */
export class WikiDataEnricher {
  private static ENDPOINT = "https://query.wikidata.org/sparql";

  /**
   * Fetch technical specs for a CPU model
   */
  async fetchCpuSpecs(modelName: string) {
    console.log(`🔍 WikiData: Searching for CPU "${modelName}"...`);

    // Clean model name for search
    const queryName = modelName
      .replace(/Intel\s*Core\s*|AMD\s*Ryzen\s*|Processor\s*/gi, "")
      .trim();

    const sparql = `
      SELECT ?item ?itemLabel ?socketLabel ?tdp WHERE {
        SERVICE wikibase:mwapi {
          bd:serviceParam wikibase:api "EntitySearch" .
          bd:serviceParam wikibase:endpoint "www.wikidata.org" .
          bd:serviceParam mwapi:search "${queryName}" .
          bd:serviceParam mwapi:language "en" .
          ?item wikibase:apiOutputItem mwapi:item .
        }
        
        ?item wdt:P31/wdt:P279* wd:Q160912. # Instance of or subclass of CPU
        
        OPTIONAL { ?item wdt:P1041 ?socket. SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }
        OPTIONAL { ?item wdt:P2229 ?tdp. }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 1
    `;

    try {
      const url = new URL(WikiDataEnricher.ENDPOINT);
      url.searchParams.append("query", sparql);
      url.searchParams.append("format", "json");

      const response = await fetch(url.toString(), {
        headers: { "User-Agent": "CleverPrices/1.0 (oguzbits@gmail.com) Bot" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      const results = data.results.bindings;

      if (results.length > 0) {
        const item = results[0];
        return {
          Socket: item.socketLabel?.value,
          TDP: item.tdp?.value ? `${item.tdp.value}W` : undefined,
          WikiData_ID: item.item?.value.split("/").pop(),
          Source: "WikiData",
        };
      }
    } catch (error) {
      console.error("❌ WikiData Error:", error);
    }
    return null;
  }
}

// Simple CLI test
if (require.main === module) {
  const enricher = new WikiDataEnricher();
  enricher.fetchCpuSpecs("Core i7-14700K").then(console.log);
  enricher.fetchCpuSpecs("Ryzen 7 5800X").then(console.log);
}
