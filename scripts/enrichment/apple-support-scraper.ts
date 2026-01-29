import { and, eq, isNull, like, sql } from "drizzle-orm";
import { db, products } from "../../src/db/index";
import { DeviceEnricherBase } from "./device-enricher-base";

export class AppleSupportScraper extends DeviceEnricherBase {
  private catalogUrl = "https://support.apple.com/de-de/docs/iphone";

  async run(limit = 10) {
    console.log("🍏 Apple Support Scraper: Initializing...");
    const targets = await db.query.products.findMany({
      where: and(
        eq(products.brand, "Apple"),
        isNull(products.officialSpecifications),
        // Target iPhones, MacBooks, and iPads
        and(
          like(products.title, "%iPhone 14%"),
          sql`${products.title} NOT LIKE '%Kompatibel mit%'`,
          sql`${products.title} NOT LIKE '%compatible with%'`,
          sql`${products.title} NOT LIKE '%Works with%'`,
          sql`${products.title} NOT LIKE '%Funktioniert mit%'`,
        ),
        // Exclude accessories
        sql`${products.title} NOT LIKE '%Magic Keyboard%'`,
        sql`${products.title} NOT LIKE '%Case%'`,
      ),
      limit: limit,
      orderBy: products.id,
    });

    console.log(`📋 Found ${targets.length} target Apple devices.`);

    if (targets.length === 0) return;

    // Static map for reliability - Search is flaky
    const modelMap: Record<string, string> = {
      "iPhone 16 Pro Max": "https://support.apple.com/de-de/121117",
      "iPhone 16 Pro": "https://support.apple.com/de-de/121116",
      "iPhone 16 Plus": "https://support.apple.com/de-de/121115",
      "iPhone 16": "https://support.apple.com/de-de/121115",
      "iPhone 15 Pro Max": "https://support.apple.com/de-de/111830",
      "iPhone 15 Pro": "https://support.apple.com/de-de/111829",
      "iPhone 15 Plus": "https://support.apple.com/de-de/111828",
      "iPhone 15": "https://support.apple.com/de-de/111828",
      "iPhone 14 Pro Max": "https://support.apple.com/de-de/111849",
      "iPhone 14 Pro": "https://support.apple.com/de-de/111848",
      "iPhone 14 Plus": "https://support.apple.com/de-de/111850",
      "iPhone 14": "https://support.apple.com/de-de/111850",
      "iPhone 13 Pro Max": "https://support.apple.com/de-de/111871",
      "iPhone 13 Pro": "https://support.apple.com/de-de/111870",
      "iPhone 13 mini": "https://support.apple.com/de-de/111872",
      "iPhone 13": "https://support.apple.com/de-de/111872",
      "iPhone 12 Pro Max": "https://support.apple.com/de-de/111875",
      "iPhone 12 Pro": "https://support.apple.com/de-de/111874",
      "iPhone 12 mini": "https://support.apple.com/de-de/111876",
      "iPhone 12": "https://support.apple.com/de-de/111876",
      "iPhone 11 Pro Max": "https://support.apple.com/de-de/111879",
      "iPhone 11 Pro": "https://support.apple.com/de-de/111878",
      "iPhone 11": "https://support.apple.com/de-de/111880",
      "iPhone SE": "https://support.apple.com/de-de/111882", // Gen 3
      "iPhone XR": "https://support.apple.com/de-de/SP781",
      "iPhone XS": "https://support.apple.com/de-de/SP779",
      "iPhone X": "https://support.apple.com/de-de/SP770",
      "iPhone 8": "https://support.apple.com/de-de/SP767",

      // MacBooks
      "MacBook Air (M3)": "https://support.apple.com/de-de/118551",
      "MacBook Air (M2)": "https://support.apple.com/de-de/111867",
      "MacBook Pro (M3)": "https://support.apple.com/de-de/SP901",
      "MacBook Pro (M4)":
        "https://support.apple.com/de-de/guide/macbook-pro/apd09825b29b/web", // 14-inch
      "MacBook Pro 14":
        "https://support.apple.com/de-de/guide/macbook-pro/apd09825b29b/web",
      "MacBook Pro 16":
        "https://support.apple.com/de-de/guide/macbook-pro/apd09825b29b/web",

      // iPads
      "iPad Pro (M4)": "https://support.apple.com/de-de/111849", // Assuming shared/similar page structure
      "iPad Air (M2)": "https://support.apple.com/de-de/111849",
    };

    const page = await this.getPage();

    for (const p of targets) {
      try {
        // Extract core model (e.g. "iPhone 14" or "MacBook Air M2")
        let model = "";
        const iphoneMatch = p.title.match(
          /(iPhone\s+\d{1,2}(?:\s+Pro(?:\s+Max)?)?|iPhone\s+SE(?:\s+\d{4})?)/i,
        );
        const macMatch = p.title.match(
          /(MacBook\s+(?:Air|Pro).*?(?:M\d+(?:\s+Pro|\s+Max)?))/i,
        );
        const ipadMatch = p.title.match(
          /(iPad\s+(?:Pro|Air|mini).*?(?:M\d+|Gen|Generation))/i,
        );

        if (iphoneMatch) {
          model = iphoneMatch[1].trim();
          if (model.includes("SE") && !model.includes("Gen"))
            model = "iPhone SE";
        } else if (macMatch) {
          // Simplify "MacBook Air (13", M3)" to "MacBook Air (M3)" for map lookup
          let raw = macMatch[0];
          if (raw.includes("M4"))
            model = "MacBook Pro (M4)"; // Fallback to mapped key
          else if (raw.includes("M3")) {
            model = raw.includes("Air")
              ? "MacBook Air (M3)"
              : "MacBook Pro (M3)";
          } else if (raw.includes("M2")) {
            model = raw.includes("Air")
              ? "MacBook Air (M2)"
              : "MacBook Pro (M2)";
          }
        } else if (ipadMatch) {
          let raw = ipadMatch[0];
          if (raw.includes("M4")) model = "iPad Pro (M4)";
          else if (raw.includes("M2")) model = "iPad Air (M2)";
        }

        if (!model) {
          console.log(`❌ Could not identify core model in: "${p.title}"`);
          continue;
        }

        console.log(`🔍 Processing: ${model} (Full: ${p.title})`);

        // Lookup URL
        const specUrl =
          modelMap[
            Object.keys(modelMap).find((k) =>
              model.toLowerCase().includes(k.toLowerCase()),
            ) || ""
          ];

        if (specUrl) {
          console.log(`🎯 Found spec URL: ${specUrl}`);
          await page.goto(specUrl, { waitUntil: "networkidle2" });

          const specs = await page.evaluate(() => {
            const data: Record<string, string> = {
              Source: "Apple Support",
              ExtractionDate: new Date().toISOString(),
            };

            // Scope to main content to avoid Footer/Nav noise
            let mainContext =
              document.querySelector("#main") ||
              document.querySelector("article") ||
              document.body;

            // Apple Support specs are usually organized in H2/H3 sections with p or ul following
            const sections = mainContext.querySelectorAll(
              "h2, h3, .section-title",
            );

            sections.forEach((section) => {
              const title = section.textContent?.trim() || "General";

              // 🛑 IGNORE GARBAGE HEADERS
              if (
                [
                  "Kaufen",
                  "Quick Links",
                  "Apple Footer",
                  "Support",
                  "Umgebung",
                ].some((bad) => title.includes(bad))
              )
                return;
              if (title.length > 50) return; // Ignore long descriptive headers

              // ... capture logic continues
              let rawText = "";
              let next = section.nextElementSibling;

              // Capture following elements until next title
              while (next && !["H2", "H3"].includes(next.tagName)) {
                // If list, capture items
                if (next.tagName === "UL") {
                  const items = Array.from(next.querySelectorAll("li"))
                    .map((li) => li.textContent?.trim())
                    .filter(Boolean) as string[];
                  if (items.length > 0) rawText += items.join("\n") + "\n";
                }
                // If paragraph (not empty), capture text
                else if (next.tagName === "P" || next.tagName === "DIV") {
                  const text = next.textContent?.trim();
                  if (text && text.length > 3) rawText += text + "\n";
                }
                next = next.nextElementSibling;
              }
              rawText = rawText.trim();

              if (!rawText) return;

              if (title.includes("Display")) {
                const resMatch = rawText.match(/(\d{3,4})\s*x\s*(\d{3,4})/);
                if (resMatch)
                  data["Display Resolution"] =
                    `${resMatch[1]} x ${resMatch[2]}`;

                const ppiMatch = rawText.match(/(\d{3})\s*ppi/);
                if (ppiMatch) data["Pixel Density"] = `${ppiMatch[1]} ppi`;

                const sizeMatch = rawText.match(/(\d+,\d+)"/);
                if (sizeMatch) data["Screen Size"] = `${sizeMatch[1]} inch`;

                const brightnessMatch = rawText.match(/(\d{3,4})\s*Nits/i);
                if (brightnessMatch)
                  data["Brightness"] = `${brightnessMatch[1]} nits`;

                // Remove matched parts to leave "Features"
                let feats = rawText;
                if (resMatch) feats = feats.replace(resMatch[0], "");
                if (sizeMatch) feats = feats.replace(sizeMatch[0], "");

                data["Display Features"] = feats
                  .split("\n")
                  .filter((l) => l.length > 5)
                  .join(", ");
              } else if (title === "Chip") {
                const cpuMatch = rawText.match(/(\d+)‑Core CPU/);
                if (cpuMatch) data["CPU Cores"] = cpuMatch[1];

                const gpuMatch = rawText.match(/(\d+)‑Core GPU/);
                if (gpuMatch) data["GPU Cores"] = gpuMatch[1];

                data["Chip Name"] = rawText.split("\n")[0];
              } else if (title === "Kamera") {
                const mainCam = rawText
                  .split("\n")
                  .find((l) => l.includes("Hauptkamera"));
                if (mainCam) data["Main Camera"] = mainCam;

                const ultraCam = rawText
                  .split("\n")
                  .find((l) => l.includes("Ultraweitwinkel"));
                if (ultraCam) data["Ultra Wide Camera"] = ultraCam;
              } else {
                // Fallback to bullet list
                data[title] = rawText
                  .split("\n")
                  .map((l) => "• " + l)
                  .join("\n");
              }
            });

            return data;
          });

          if (Object.keys(specs).length > 5) {
            console.log(
              `✅ Success: Extracted ${Object.keys(specs).length} sections.`,
            );
            await db
              .update(products)
              .set({
                officialSpecifications: JSON.stringify(specs),
                enrichmentStatus: "processed",
                lastEnrichedAt: new Date(),
              })
              .where(eq(products.id, p.id));
          } else {
            console.log(
              `⚠️ Failed to extract meaningful specs from ${specUrl}`,
            );
          }
        } else {
          console.log(`❌ No spec page found for ${p.title}`);
        }

        // Polite delay
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        console.error(`💥 Error processing ${p.title}:`, e);
      }
    }

    await page.close();
    await this.closeBrowser();
  }
}

if (require.main === module) {
  const limit = parseInt(process.argv[2]) || 5;
  new AppleSupportScraper().run(limit).catch(console.error);
}
