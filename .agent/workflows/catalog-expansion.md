---
description: Roadmap for future category expansion and strategy
---

# 🚀 Catalog Expansion Roadmap

This document outlines the strategy for adding new categories to CleverPrices. We focus on high-value, technical products where price history matters, avoiding generic low-value accessories.

## ✅ Phase 1: High-Priority Additions (Next Steps)

These categories fit the "Tech/Enthusiast" demographic perfectly and have high average order values (AOV).

### 1. 3D Printing (`3d-printing`)

- **Categories:**
  - `3d-printers` (Bambu Lab, Prusa, Creality)
  - `filament` (Analytical: Price per kg)
- **Why:** Overlaps 90% with PC builders/makers. High retention.

### 2. Creator Economy / Studio (`creator-gear`)

- **Categories:**
  - `microphones` (Shure, Rode, Neumann) - _Partially exists now_
  - `audio-interfaces` (Focusrite, UA Apollo)
  - `studio-monitors` (Yamaha, KRK)
  - `stream-decks` (Elgato)
- **Why:** Expensive, durable goods. Price drops are rare but significant (Black Friday).

### 3. Photography Expansion (`photography-pro`)

- **Categories:**
  - `lenses` / `objektive` (Sony GM, Canon RF, Sigma)
  - `tripods` (Manfrotto, Gitzo)
- **Why:** Lenses often cost more than cameras. Very high data value (checking lens charts).

---

## ⚠️ Phase 2: Cautious Additions (Requires "Analytical" Filters)

These categories are good but messy. Only add if we can implement specific compatibility filters.

- **Printer Ink:** Only if we build a "Printer Model Matcher". Otherwise, skip.
- **Smart Home Sensors:** (Hue, Eve, Aqara). Good, but low individual price. Group into a "Smart Home" hub.

---

## ❌ "Do Not Add" List (Low Value / Spammy)

Avoid these categories as they dilute the premium feel of the site and waste Keepa tokens.

- **Generic "Accessories" (`zubehör`):**
  - Avoid generic "Handy-Zubehör" or "Kamera-Zubehör".
  - _Reason:_ Flooded with €5 aliases, cables, and screen protectors. Hard to crawl.
- **Aggregator Categories:**
  - Avoid "Elektro-Großgeräte" (just use Fridge/Washer directly).
  - _Reason:_ Adds click depth without adding value.
- **Physical Media:**
  - Avoid DVDs, Blu-rays, CDs.
  - _Reason:_ Dying market, low margins.
- **Books:**
  - _Reason:_ Fixed price laws (Buchpreisbindung) in DE make comparisons illegal/useless.

---

## 🛠 How to Add a New Category

1.  **Define Slug:** Add to `CategorySlug` in `src/lib/categories.ts`.
2.  **Add Config:** Add entry to `CATEGORY_MAP` with Lucide icon and `popularFilters`.
3.  **Find Clean ID:** Use `bun run scripts/find-browse-node.ts "Product Name" de` to find the Amazon Browse Node.
    - _Tip:_ If the node is messy (mixed products), try to find a deeper node.
4.  **Update Keepa:** Add the ID to `src/lib/keepa/product-discovery.ts`.
5.  **Restart Worker:** `bun run scripts/keepa-worker.ts de --continuous`.
