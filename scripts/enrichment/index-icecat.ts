import { Database } from "bun:sqlite";
import https from "https";
import zlib from "zlib";

const ICECAT_USERNAME = process.env.ICECAT_USERNAME;
const ICECAT_PASSWORD = process.env.ICECAT_PASSWORD;
const INDEX_URL =
  "https://data.icecat.biz/export/freexml/EN/files.index.xml.gz";
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

  db.run(`
    CREATE TABLE IF NOT EXISTS icecat_index (
      id TEXT PRIMARY KEY,
      mpn TEXT,
      gtins TEXT
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_icecat_mpn ON icecat_index(mpn);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_icecat_gtins ON icecat_index(gtins);`);

  console.log("🛰️ Downloading and parsing Icecat index (streaming)...");

  const auth =
    "Basic " +
    Buffer.from(`${ICECAT_USERNAME}:${ICECAT_PASSWORD}`).toString("base64");

  return new Promise((resolve, reject) => {
    https.get(INDEX_URL, { headers: { Authorization: auth } }, (response) => {
      if (response.statusCode !== 200) {
        reject(`Failed to download: ${response.statusCode}`);
        return;
      }

      const gunzip = zlib.createGunzip();
      response.pipe(gunzip);

      let count = 0;
      let buffer = "";

      const insert = db.prepare(
        "INSERT OR REPLACE INTO icecat_index (id, mpn, gtins) VALUES (?, ?, ?)",
      );

      gunzip.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split(">");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.includes("<file")) {
            const idMatch = line.match(/Product_ID="(\d+)"/);
            const mpnMatch = line.match(/Prod_ID="([^"]+)"/);
            const gtinMatch = line.match(/EAN_UPC="([^"]+)"/);

            if (idMatch) {
              insert.run(
                idMatch[1],
                mpnMatch?.[1] || null,
                gtinMatch?.[1] || null,
              );
              count++;
              if (count % 10000 === 0)
                process.stdout.write(`\r🚀 Indexed ${count} products...`);
            }
          }
        }
      });

      gunzip.on("end", () => {
        console.log(`\n✨ Finalizing index... (${count} total)`);
        db.close();
        resolve(true);
      });

      gunzip.on("error", (err) => {
        console.error("❌ Gunzip error:", err);
        reject(err);
      });
    });
  });
}

buildIndex().catch(console.error);
