# AI Optimization Plan (GEO/AEO)

## Answer Engine Optimization & Generative Engine Optimization

> [!IMPORTANT]
> This document outlines strategies to get your website cited by AI tools like ChatGPT, Perplexity, Google AI Overviews, and other Large Language Models. Implement these after Amazon PA API integration is complete.

---

## Overview

**Goal**: Make your price comparison website a trusted, citation-worthy source for AI-powered search engines.

**Key Difference from SEO**: Traditional SEO aims for clicks; GEO/AEO aims for **citations** and **brand mentions** within AI-generated responses.

---

## Phase 1: Technical Foundation

### 1.1 Enhanced Schema Markup

Add the following structured data to your pages:

#### Product Category Pages

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Best SSD Deals",
  "description": "Compare prices and find the best value SSDs",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "Product",
        "name": "Product Name",
        "offers": {
          "@type": "Offer",
          "price": "99.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  }
}
```

#### FAQ Schema (High Priority)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best value SSD in 2024?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Based on our price tracking data, the [Product Name] offers the best price per TB at $X.XX..."
      }
    }
  ]
}
```

#### Article Schema (for Guides/Blog Posts)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete SSD Buying Guide 2024",
  "author": {
    "@type": "Person",
    "name": "Your Name",
    "jobTitle": "Tech Product Analyst",
    "description": "Expert in storage technology with 5+ years analyzing price trends"
  },
  "datePublished": "2024-12-11",
  "dateModified": "2024-12-11",
  "publisher": {
    "@type": "Organization",
    "name": "CleverPrices",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yoursite.com/logo.png"
    }
  }
}
```

#### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yoursite.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Storage",
      "item": "https://yoursite.com/storage"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "SSDs",
      "item": "https://yoursite.com/storage/ssd"
    }
  ]
}
```

### 1.2 Create llms.txt File

Create `/public/llms.txt` with the following structure:

```
# CleverPrices - AI-Optimized Site Map

## About
CleverPrices tracks and compares prices for storage devices and electronics across multiple countries, helping users find the best value deals.

## Key Pages

### Product Categories
- SSDs: /us/storage/ssd
- HDDs: /us/storage/hdd
- Electronics: /us/electronics

### Buying Guides
- SSD Buying Guide: /guides/ssd-buying-guide
- HDD vs SSD Comparison: /guides/hdd-vs-ssd
- Price Per TB Explained: /guides/price-per-tb

### Data & Methodology
- How We Track Prices: /methodology
- Price History Data: /data/price-history

## Contact
Email: info@cleverprices.com
```

### 1.3 Update robots.txt

Ensure AI crawlers can access your site:

```
# Allow AI Bots
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

# Standard crawlers
User-agent: *
Allow: /

Sitemap: https://yoursite.com/sitemap.xml
```

---

## Phase 2: Content Optimization

### 2.1 Answer-First Content Structure

**Current Structure** (SEO-focused):

```
# Best SSDs 2024
Looking for the best SSD? We've compiled a comprehensive list...
[Long introduction]
[Product list]
```

**AI-Optimized Structure** (Answer-first):

```
# What is the Best Value SSD in 2024?

The Samsung 990 PRO 2TB offers the best value at $0.045/GB as of December 2024,
combining high performance with competitive pricing.

## Quick Answer
- **Best Overall Value**: Samsung 990 PRO 2TB ($89.99, $0.045/GB)
- **Best Budget Option**: Crucial P3 1TB ($49.99, $0.050/GB)
- **Best Performance**: WD Black SN850X 2TB ($129.99, $0.065/GB)

## Detailed Comparison
[Rest of content]
```

### 2.2 Add FAQ Sections to Every Category Page

Create comprehensive FAQ sections with FAQPage schema:

**Example for SSD Category:**

- What is the best value SSD right now?
- How much should I pay per TB for an SSD?
- What's the difference between NVMe and SATA SSDs?
- Are Samsung SSDs worth the premium?
- How often do SSD prices change?
- What capacity SSD should I buy?

### 2.3 Create Original Research Content

**High-Value Content Ideas:**

1. **Monthly Price Reports**
   - "December 2024 Storage Price Report"
   - Include charts, trends, and predictions
   - Original data that AI can cite

2. **Comparison Guides**
   - "SSD vs HDD: Complete 2024 Comparison"
   - "NVMe vs SATA: Performance vs Price Analysis"
   - Use tables and clear comparisons

3. **Buying Guides**
   - "How to Choose the Right SSD Capacity"
   - "Understanding Price Per TB Metrics"
   - Include methodology and calculations

4. **Data Insights**
   - "Best Time to Buy SSDs: Price Pattern Analysis"
   - "Country-by-Country Price Comparison"
   - "Brand Price Premium Analysis"

### 2.4 Content Format Best Practices

#### Use Comparison Tables

```markdown
| Product         | Capacity | Price  | Price/TB  | Best For      |
| --------------- | -------- | ------ | --------- | ------------- |
| Samsung 990 PRO | 2TB      | $89.99 | $0.045/GB | Overall Value |
| Crucial P3      | 1TB      | $49.99 | $0.050/GB | Budget Builds |
```

#### Add Key Takeaways Boxes

```markdown
> [!TIP] > **Key Takeaway**: SSDs under $0.05/GB represent excellent value in the current market.
```

#### Use Bullet Points for Extractability

- Clear, concise points
- One idea per bullet
- Easy for AI to extract and cite

---

## Phase 3: E-E-A-T Optimization

### 3.1 Add Author Bios

Create author pages with credentials:

```markdown
## About the Author

**[Your Name]** is a technology analyst specializing in storage devices and consumer electronics.
With over 5 years of experience tracking price trends and analyzing product value, [Name] has
helped thousands of consumers make informed purchasing decisions.

**Expertise:**

- Storage technology analysis
- Price trend forecasting
- Consumer electronics evaluation

**Credentials:**

- [Relevant certifications or experience]
- [Publications or mentions]
```

### 3.2 Create Methodology Page

Create `/methodology` page explaining:

- How you track prices
- How you calculate price per TB
- Data sources and update frequency
- Quality control measures
- Why your data is trustworthy

### 3.3 Build Brand Authority

**Content Marketing:**

- Publish on Medium/Dev.to linking back to your site
- Create LinkedIn posts with insights from your data
- Share unique findings on Reddit (r/buildapc, r/DataHoarder)
- Engage in tech forums as an expert

**Get Cited:**

- Reach out to tech blogs with your original data
- Offer to provide price data for their articles
- Create embeddable widgets with your data

---

## Phase 4: Page-Specific Implementations

### 4.1 Homepage Enhancements

Add:

- Brief "What We Do" section with clear value proposition
- "Latest Insights" section with recent findings
- FAQ section: "How does CleverPrices work?"

### 4.2 Category Pages Enhancements

For each category (SSD, HDD, etc.):

**Add Sections:**

1. **Quick Answer Box** (top of page)
   - "Best value product right now"
   - Current average price per TB
   - Last updated timestamp

2. **FAQ Section** (bottom of page)
   - 5-10 common questions
   - Implement FAQPage schema

3. **Buying Guide Link**
   - Link to comprehensive guide
   - "Learn more about choosing the right SSD"

4. **Price Trend Summary**
   - "Prices are currently [trending up/down]"
   - "Best time to buy: [insight]"

### 4.3 Product Detail Pages

When you have individual product pages:

**Include:**

- Price history chart
- "Is this a good deal?" verdict
- Comparison with similar products
- Pros/cons in bullet format
- FAQ specific to that product

---

## Phase 5: Ongoing Optimization

### 5.1 Content Freshness

- Update "Last updated" dates regularly
- Refresh price data daily
- Update buying guides quarterly
- Publish monthly price reports

### 5.2 Monitor AI Citations

**Track mentions in:**

- ChatGPT (ask it about storage prices)
- Perplexity AI
- Google AI Overviews
- Bing Chat

**Tools to use:**

- Manual testing (ask AI about your niche)
- Set up Google Alerts for your brand
- Monitor referral traffic from AI sources

### 5.3 Iterate Based on Results

- Identify which content gets cited
- Double down on citation-worthy formats
- Expand FAQ sections based on AI queries
- Create more original research content

---

## Implementation Checklist

### Pre-Launch (Before Amazon PA API)

- [ ] Plan content structure for guides
- [ ] Draft FAQ questions for each category
- [ ] Outline methodology page
- [ ] Create author bio content
- [ ] Design comparison table templates

### Post-Launch (After Amazon PA API)

- [ ] Implement enhanced schema markup
- [ ] Create llms.txt file
- [ ] Update robots.txt for AI bots
- [ ] Add FAQ sections to category pages
- [ ] Create methodology page
- [ ] Add author bios
- [ ] Implement BreadcrumbList schema
- [ ] Create first buying guide
- [ ] Publish first monthly price report
- [ ] Add "Quick Answer" boxes to category pages

### Ongoing

- [ ] Update content weekly
- [ ] Publish monthly price reports
- [ ] Monitor AI citations
- [ ] Build backlinks through outreach
- [ ] Expand FAQ sections based on queries
- [ ] Create new comparison guides

---

## Expected Outcomes

### Short-term (1-3 months)

- Improved structured data coverage
- Better content extractability
- Foundation for AI citations

### Medium-term (3-6 months)

- First AI citations appearing
- Increased brand mentions
- Growing authority in niche

### Long-term (6-12 months)

- Regular citations in AI responses
- Established as go-to source for storage pricing
- Increased direct traffic from brand awareness

---

## Key Metrics to Track

1. **AI Citation Tracking**
   - Manual testing: Ask AI tools about your niche weekly
   - Track when your site is mentioned
   - Note which content gets cited

2. **Traffic Sources**
   - Monitor referrals from AI platforms
   - Track direct traffic (brand awareness indicator)
   - Watch for traffic spikes after AI mentions

3. **Content Performance**
   - Which pages get cited most
   - Which FAQ questions appear in AI responses
   - Which data points are most referenced

4. **Technical Health**
   - Schema validation (no errors)
   - Crawl accessibility for AI bots
   - Page speed and Core Web Vitals

---

## Resources & Tools

### Validation Tools

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [Google Search Console](https://search.google.com/search-console)

### AI Testing

- ChatGPT (ask about storage prices)
- Perplexity AI (search for product comparisons)
- Google AI Overviews (search for buying guides)

### Monitoring

- Google Analytics 4 (track referrals)
- Google Alerts (brand mentions)
- Ahrefs/SEMrush (backlink tracking)

---

## Notes

- **Priority**: Focus on FAQ schema and answer-first content structure first
- **Unique Advantage**: Your price tracking data is original research—emphasize this!
- **Citation Magnet**: Monthly price reports with charts and trends
- **Quick Win**: Add FAQ sections to existing category pages with proper schema

> [!CAUTION]
> Do not stuff keywords or create low-quality content just for AI. Quality and accuracy are paramount for E-E-A-T signals.
