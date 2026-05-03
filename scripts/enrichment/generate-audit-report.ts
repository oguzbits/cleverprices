import { desc, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

import { db, products } from "../../src/db";

/**
 * 🎨 VISUAL ENRICHMENT AUDITOR
 * Generates a stunning HTML report to manually audit the quality of newly enriched data.
 */
async function generateReport() {
  console.log("🎨 Generating Visual Audit Report...");

  const wins = await db
    .select()
    .from(products)
    .where(eq(products.enrichmentStatus, "scavenged"))
    .orderBy(desc(products.lastEnrichedAt))
    .limit(50);

  if (wins.length === 0) {
    console.log("❌ No enriched products found to audit.");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CleverPrices | Enrichment Audit Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --accent: #38bdf8;
            --accent-glow: rgba(56, 189, 248, 0.3);
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --success: #10b981;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 40px 20px;
            background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 60px;
        }

        h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }

        .stat-badge {
            background: var(--card-bg);
            padding: 8px 16px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            font-size: 0.9rem;
            color: var(--accent);
        }

        .product-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 30px;
        }

        .product-card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 24px;
            padding: 30px;
            transition: transform 0.3s ease, border-color 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .product-card:hover {
            transform: translateY(-5px);
            border-color: var(--accent-glow);
        }

        .product-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 4px; height: 100%;
            background: var(--accent);
        }

        .category-tag {
            text-transform: uppercase;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: var(--accent);
            margin-bottom: 10px;
            display: block;
        }

        .product-title {
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 20px;
            line-height: 1.4;
        }

        .spec-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .spec-table th, .spec-table td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .spec-table th {
            color: var(--text-muted);
            font-weight: 600;
            width: 30%;
            font-size: 0.85rem;
            text-transform: uppercase;
        }

        .spec-table td {
            font-size: 1rem;
            color: #e2e8f0;
        }

        .source-footer {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: var(--text-muted);
        }

        .source-badge {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 600;
        }

        .gtin { font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Enrichment Audit</h1>
            <div class="stats">
                <div class="stat-badge">Analyzed: ${wins.length} Products</div>
                <div class="stat-badge">Status: Scavenged</div>
                <div class="stat-badge">Provider: Mixed Retailers</div>
            </div>
        </header>

        <div class="product-grid">
            ${wins
              .map((p) => {
                let specs = {};
                try {
                  specs = JSON.parse(p.officialSpecifications || "{}");
                } catch (e) {}
                const specRows = Object.entries(specs)
                  .filter(([k]) => k !== "_meta_source")
                  .map(
                    ([k, v]) => `
                    <tr>
                        <th>${k}</th>
                        <td>${v}</td>
                    </tr>
                `,
                  )
                  .join("");

                return `
                <div class="product-card">
                    <span class="category-tag">${p.category}</span>
                    <div class="product-title">${p.title}</div>
                    
                    <div class="stat-badge" style="display:inline-block; margin-bottom:10px;">
                        ${Object.keys(specs).length} Technical Attributes
                    </div>
                    
                    <table class="spec-table">
                        ${specRows}
                        ${p.gtin ? `<tr><th>GTIN</th><td class="gtin">${p.gtin}</td></tr>` : ""}
                    </table>

                    <div class="source-footer">
                        <span>ID: ${p.id} • Enriched: ${p.lastEnrichedAt ? new Date(p.lastEnrichedAt).toLocaleString() : "N/A"}</span>
                        <span class="source-badge">Source: ${p.specificationsSource}</span>
                    </div>
                </div>
              `;
              })
              .join("")}
        </div>
    </div>
</body>
</html>
  `;

  const reportPath = path.resolve(process.cwd(), "audit-report.html");
  fs.writeFileSync(reportPath, html);
  console.log(`✅ Audit report generated at: ${reportPath}`);
}

generateReport().catch(console.error);
