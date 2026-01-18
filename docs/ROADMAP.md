# Revenue Growth Roadmap

## Current Status (Jan 2026)

| Metric           | Value                  | Progress |
| ---------------- | ---------------------- | -------- |
| Monthly Visitors | ~45                    | Initial  |
| Products         | 3,800+                 | 🟢 High  |
| Categories       | 28+                    | 🟢 High  |
| Blog Posts       | 3                      | Low      |
| Domain Rating    | 0                      | Initial  |
| Revenue          | $0                     | Initial  |
| PA API           | Pending (need 2 sales) | Waiting  |

---

## Phase 1: Get First Revenue (Weeks 1-2)

**Goal**: 2 qualifying sales → PA API access

| Priority | Action                                                    | Impact    | Effort |
| -------- | --------------------------------------------------------- | --------- | ------ |
| 🔴 1     | Route personal Amazon purchases through affiliate links   | Immediate | None   |
| 🔴 2     | Share PS5 SSD article on r/PS5, r/buildapc when relevant  | High      | Low    |
| 🟡 3     | Add more affiliate CTAs to existing content               | Medium    | Low    |
| 🟡 4     | Create "Best DDR5 RAM 2026" article (high intent keyword) | Medium    | Medium |

---

## Phase 2: Content & Traffic (Weeks 3-8)

**Goal**: 500+ monthly visitors, 10+ sales

### Content Calendar

| Week | Article                                   | Target Keyword               | Category Link   |
| ---- | ----------------------------------------- | ---------------------------- | --------------- |
| 3    | DDR4 vs DDR5: Worth the Upgrade?          | "ddr4 vs ddr5"               | /ram            |
| 4    | Best PSU for RTX 5080/5090                | "best psu for rtx 5080"      | /power-supplies |
| 5    | How Much SSD Storage Do You Need?         | "how much ssd storage"       | /hard-drives    |
| 6    | Best Budget NVMe SSD 2026                 | "best budget nvme ssd"       | /hard-drives    |
| 7    | RAM Speed vs Capacity: What Matters More? | "ram speed vs capacity"      | /ram            |
| 8    | Modular vs Non-Modular PSU Guide          | "modular vs non modular psu" | /power-supplies |

### Link Building (DR 0 → 10+)

| Strategy           | How                                                    |
| ------------------ | ------------------------------------------------------ |
| Reddit value posts | Answer questions, mention site where genuinely helpful |
| Forum signatures   | Computerbase.de, Tom's Hardware forums                 |
| HARO responses     | Answer journalist queries about tech pricing           |
| Guest posts        | Offer articles to small tech blogs                     |

---

## Phase 3: Conversion Optimization (Week 4+)

### CTA Improvements

| Location      | Current           | Improvement                                |
| ------------- | ----------------- | ------------------------------------------ |
| Blog article  | Text links only   | Add styled CTA boxes after recommendations |
| Category page | No above-fold CTA | Add "Best Value Right Now" hero card       |

> **Note**: Kept "View on Amazon" for button text - transparency builds trust.

### Email Capture (Future Revenue)

| Component          | Purpose                                      |
| ------------------ | -------------------------------------------- |
| Price Alert Signup | "Get notified when [product] drops below $X" |
| Newsletter         | Weekly deals digest                          |
| Exit Intent Popup  | "Don't miss the best deals - subscribe"      |

**Email list = recurring traffic without SEO dependency**

---

## Phase 4: Scale Product Catalog (After PA API)

### New Categories to Add

| Category  | Products | Unit                | Difficulty |
| --------- | -------- | ------------------- | ---------- |
| CPUs      | ~50      | $/core or $/thread  | Medium     |
| GPUs      | ~40      | $/TFLOP or $/frame  | Medium     |
| Monitors  | ~60      | $/inch or $/pixel   | Easy       |
| Laptops   | ~80      | $/performance score | Hard       |
| Keyboards | ~40      | $ (no unit metric)  | Easy       |

### Product Expansion per Category

| Category       | Current | Target (3 months) |
| -------------- | ------- | ----------------- |
| Hard Drives    | 10      | 100               |
| RAM            | 10      | 80                |
| Power Supplies | 10      | 60                |
| CPUs           | 0       | 50                |
| GPUs           | 0       | 40                |

---

## Conversion Optimization Checklist

### Above the Fold

- [ ] Add "Today's Best Value" hero card on category pages
- [ ] Make price-per-unit column more prominent (larger font, highlight)
- [ ] Add trust badges ("Updated daily", "X products compared")

### Product Table

- [ ] Add "Best Value" badge to top 1-2 products
- [ ] Show savings vs list price when available
- [ ] Add hover effect on entire row (not just button)

### Blog Posts

- [ ] Add styled product recommendation boxes (not just text links)
- [ ] Include comparison table in every buying guide
- [ ] Add "Quick Answer" summary at top of each article
- [ ] Include FAQ schema on all articles

### Mobile Experience

- [ ] Ensure CTA buttons are thumb-accessible
- [ ] Test product table scrolling on mobile
- [ ] Add sticky "View on Amazon" button on product pages

---

## Key Metrics to Track

| Metric            | Current | Week 4 Target | Week 12 Target |
| ----------------- | ------- | ------------- | -------------- |
| Monthly Visitors  | 45      | 200           | 1,000          |
| Affiliate Clicks  | ?       | 50            | 300            |
| Sales             | 0       | 5             | 30             |
| Email Subscribers | 0       | 50            | 300            |
| Domain Rating     | 0       | 5             | 15             |
| Blog Posts        | 3       | 7             | 15             |
| Products          | 30      | 30→200        | 400            |

---

## Implementation Priority Queue

### Recently Completed (Jan 13-18)

1.  ✅ **Maintenance Engine**: Migrated from local Mac-worker to automated **GitHub Actions** running hourly.
2.  ✅ **SEO Schema Overhaul**: Added Breadcrumb, Organization, WebSite, and UnitPriceSpecification (Price per TB).
3.  ✅ **Indexing Fixes**: Sanitized sitemap, implemented `noindex` for empty cats, and hardened `robots.txt`.
4.  ✅ **Performance Tuning**: Implemented tiered ISR and removed heavy fields from edge-cached components.
5.  ✅ **Search Optimization**: SQLite FTS5 integration for sub-50ms search matching.

### High Priority (Jan 19-25)

1.  🔴 **Revenue Kickstart**: Route personal purchases through links to unlock PA API (need 3 sales).
2.  🔴 **Social Presence**: Share the new "Deals" page for Hard Drives and SSDs on relevant subreddits.
3.  🟡 **Price Alert MVP**: Add a simple "Notify me" button on product pages (email capture).
4.  🟡 **Enhanced Filters**: Add "Manufacturer" and "Technology" filters to all remaining hardware categories.

### Future Roadmap

1.  🔲 **Multi-Store Strategy**: Integrate eBay or Alternate.de prices (Long term).
2.  🔲 **User Reviews**: Allow users to leave comments/ratings directly on-site.
3.  🔲 **Price Trend Charts**: Expose the 90-day price history as interactive charts.
