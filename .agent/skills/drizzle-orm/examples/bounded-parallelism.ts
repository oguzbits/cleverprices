// Example: Bounded Parallelism
// Source: scripts/update-prices.ts, scripts/enrich-products.ts

// ❌ BAD: Unbounded parallelism - spawns thousands of concurrent requests
async function badParallelism(items: any[]) {
  await Promise.all(
    items.map(async (item) => {
      await processItem(item); // 1000+ concurrent requests!
    }),
  );
}

// ✅ GOOD: Bounded parallelism with wave processing
async function goodParallelism(items: any[]) {
  const CONCURRENCY = 5; // Max concurrent operations
  const batches = chunk(items, 50); // Group into batches

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const wave = batches.slice(i, i + CONCURRENCY);
    await Promise.all(wave.map((batch) => processBatch(batch)));
    console.log(`Processed wave ${Math.floor(i / CONCURRENCY) + 1}`);
  }
}

// Real-world example from enrich-products.ts
async function enrichProducts() {
  const BATCH_CONCURRENCY = 3;
  const batches = createBatches(asins, 50);

  for (let i = 0; i < batches.length; i += BATCH_CONCURRENCY) {
    const currentBatches = batches.slice(i, i + BATCH_CONCURRENCY);

    await Promise.all(
      currentBatches.map(async (batch, idx) => {
        const batchAbsIndex = i + idx;
        try {
          const enrichedProducts = await getProducts(batch, country, {
            includeHistory: true,
          });
          // Process enriched products...
          console.log(
            `✓ Batch ${batchAbsIndex + 1}/${batches.length} complete`,
          );
        } catch (e: any) {
          console.error(`❌ Error in batch ${batchAbsIndex + 1}:`, e.message);
        }
      }),
    );
  }
}

// Helper function
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
