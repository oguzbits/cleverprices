import { Database } from "bun:sqlite";
import https from "https";
import zlib from "zlib";

const ICECAT_USERNAME = process.env.ICECAT_USERNAME;
const ICECAT_PASSWORD = process.env.ICECAT_PASSWORD;
const INDEX_URLS = [
  "https://data.icecat.biz/export/freexml/EN/files.index.xml.gz",
  "https://data.icecat.biz/export/freexml/DE/files.index.xml.gz",
];
const DB_PATH = "data/icecat-index.db";

async function buildIndex() {
  console.log("💎 CleverPrices: Icecat Indexing Catalyst (Bun Edition)");
  console.log("-----------------------------------------------------");

  if (!ICECAT_USERNAME || !ICECAT_PASSWORD) {
    console.error(
      "❌ ICECAT_USERNAME or ICECAT_PASSWORD not set in environment.",
    );
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA synchronous = NORMAL;");

  db.run(`
    CREATE TABLE IF NOT EXISTS icecat_index (
      id TEXT PRIMARY KEY,
      mpn TEXT,
      title TEXT,
      gtins TEXT
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_icecat_mpn ON icecat_index(mpn);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_icecat_gtins ON icecat_index(gtins);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_icecat_title ON icecat_index(title);`);

  const auth =
    "Basic " +
    Buffer.from(`${ICECAT_USERNAME}:${ICECAT_PASSWORD}`).toString("base64");

  for (const url of INDEX_URLS) {
    console.log(`📡 Fetching index: ${url}`);
    await new Promise((resolve, reject) => {
      https.get(url, { headers: { Authorization: auth } }, (response) => {
        if (response.statusCode !== 200) {
          console.warn(`⚠️ Skipped ${url}: ${response.statusCode}`);
          resolve(false);
          return;
        }

        const gunzip = zlib.createGunzip();
        response.pipe(gunzip);

        let count = 0;
        let buffer = "";
        const BATCH_SIZE = 10000;
        const records: any[] = [];

        const insert = db.prepare(
          "INSERT OR REPLACE INTO icecat_index (id, mpn, title, gtins) VALUES (?, ?, ?, ?)",
        );

        const flush = db.transaction((batch: any[]) => {
          for (const r of batch) {
            insert.run(r.id, r.mpn, r.title, r.gtins);
          }
        });

        let currentProduct: {
          id: string;
          mpn: string;
          title: string;
          gtins: Set<string>;
        } | null = null;

        gunzip.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
          const segments = buffer.split(">");
          buffer = segments.pop() || "";

          for (const segment of segments) {
            if (segment.includes("<file")) {
              if (currentProduct) {
                records.push({
                  id: currentProduct.id,
                  mpn: currentProduct.mpn,
                  title: currentProduct.title,
                  gtins: Array.from(currentProduct.gtins).join(","),
                });
                if (records.length >= BATCH_SIZE) {
                  flush(records.splice(0, BATCH_SIZE));
                }
                currentProduct = null;
              }

              const idMatch = segment.match(/Product_ID="(\d+)"/);
              const mpnMatch = segment.match(/Prod_ID="([^"]+)"/);
              const titleMatch = segment.match(/Model_Name="([^"]+)"/);

              if (idMatch) {
                currentProduct = {
                  id: idMatch[1],
                  mpn: mpnMatch?.[1] || "",
                  title: titleMatch?.[1] || "",
                  gtins: new Set(),
                };
              }
            } else if (segment.includes("<EAN_UPC") && currentProduct) {
              const valMatch = segment.match(/Value="(\d+)"/);
              if (valMatch) {
                currentProduct.gtins.add(valMatch[1]);
              }
            } else if (segment.includes("</file") && currentProduct) {
              records.push({
                id: currentProduct.id,
                mpn: currentProduct.mpn,
                title: currentProduct.title,
                gtins: Array.from(currentProduct.gtins).join(","),
              });
              currentProduct = null;
              count++;

              if (records.length >= BATCH_SIZE) {
                flush(records.splice(0, BATCH_SIZE));
              }

              if (count % 10000 === 0) {
                process.stdout.write(`\r🚀 Indexed ${count} products...`);
              }
            }
          }
        });

        gunzip.on("end", () => {
          if (currentProduct) {
            records.push({
              id: currentProduct.id,
              mpn: currentProduct.mpn,
              title: currentProduct.title,
              gtins: Array.from(currentProduct.gtins).join(","),
            });
          }
          if (records.length > 0) {
            flush(records);
          }
          console.log(`\n✨ Finished processing ${url} (${count} total)`);
          resolve(true);
        });

        gunzip.on("error", (err) => {
          console.error("❌ Gunzip error:", err);
          reject(err);
        });
      });
    });
  }
  db.close();
}

buildIndex().catch(console.error);
