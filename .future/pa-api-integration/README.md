# Amazon PA API Integration

## Status: Ready to implement when PA API access is approved

## Files in this folder:

| File                          | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `amazon-paapi.ts`             | PA API v5 client with AWS Signature v4 auth               |
| `price-sync.ts`               | Automated price sync script for all products/marketplaces |
| `price-cache.ts`              | TypeScript types for timestamped price data               |
| `PriceFreshnessIndicator.tsx` | UI component showing when prices were updated             |

## How to activate:

1. **Get PA API Access**
   - Need 3 qualifying sales in 180 days for Amazon Associates
   - Apply for PA API in Associates Central

2. **Move files back to src/**

   ```bash
   mv .future/pa-api-integration/amazon-paapi.ts src/lib/
   mv .future/pa-api-integration/price-sync.ts src/lib/
   mv .future/pa-api-integration/price-cache.ts src/types/
   mv .future/pa-api-integration/PriceFreshnessIndicator.tsx src/components/
   ```

3. **Add credentials to `.env.local`**

   ```
   PAAPI_ACCESS_KEY=your_access_key
   PAAPI_SECRET_KEY=your_secret_key
   PAAPI_PARTNER_TAG=yoursite-20
   ```

4. **Run price sync**

   ```bash
   bun run sync-prices
   ```

5. **Set up cron job** for automated updates every 4-6 hours

## Browse Node IDs (for searching products)

| Category       | US Node ID |
| -------------- | ---------- |
| Internal SSDs  | 1292116011 |
| Internal HDDs  | 1254762011 |
| Desktop RAM    | 172500     |
| Laptop RAM     | 172501     |
| Power Supplies | 1161760    |
| CPUs           | 229189     |
| GPUs           | 284822     |
