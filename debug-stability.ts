import { getProductIdentity } from "./src/lib/utils/product-identity";

const cases = [
  {
    title:
      "Google Pixel 9a: Android-Smartphone ohne SIM-Lock, mit KI-Kamera, 24 Stunden Akkulaufzeit und leistungsstarken Sicherheitsfunktionen – Obsidian, 128GB",
    brand: "Google",
    expectedModel: "Pixel 9a",
  },
  {
    title: "Apple iPhone 17 Pro Cosmic Orange MG8H4ZD/A",
    brand: "Apple",
    expectedModel: "iPhone 17 Pro",
  },
  {
    title:
      "ASUS ROG Strix GeForce RTX 4070 Ti SUPER OC Edition Gaming Grafikkarte (PCIe 4.0, 16GB GDDR6X, HDMI 2.1a, DisplayPort 1.4a)",
    brand: "ASUS",
    expectedModel: "ROG GeForce RTX 4070 TI SUPER OC Strix",
  },
  {
    title: "Apple MacBook Air 13 M4 (2025) 16GB 256GB Mitternacht",
    brand: "Apple",
    category: "notebooks",
    expectedModel: "MacBook Air 13 M4 2025",
  },
  {
    title: "Apple MacBook Air 13 M4 16GB 256GB Mitternacht", // Missing year in title
    brand: "Apple",
    category: "notebooks",
    expectedModel: "MacBook Air 13 M4 2025", // Should be added by GEN_MAPPING
  },
];

cases.forEach((c, i) => {
  const identity = getProductIdentity({
    title: c.title,
    brand: c.brand,
    category: c.category,
  });
  console.log(`\n--- Case ${i + 1}: ${c.brand} ${c.category || ""} ---`);
  console.log(`Title: ${c.title}`);
  console.log(`Result Model: ${identity.model}`);
  console.log(`Result Full Model: ${identity.fullModel}`);

  const matches = c.expectedModel
    .split(" ")
    .every((word) => identity.model.toLowerCase().includes(word.toLowerCase()));

  if (matches) {
    console.log("✅ Plausible");
  } else {
    console.log("❌ Unexpected (Missing words from expected model)");
  }
});
