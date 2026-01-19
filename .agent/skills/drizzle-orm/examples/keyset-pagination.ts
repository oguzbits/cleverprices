// Example: Keyset Pagination (Seek Method)
// Source: scripts/pull-data.ts

// ❌ BAD: OFFSET pagination - O(N²) reads on large tables
async function badPagination() {
  let offset = 0;
  const limit = 1000;
  while (true) {
    // This reads ALL rows up to offset, then discards them!
    const batch = await db.select().from(table).limit(limit).offset(offset);
    if (batch.length === 0) break;
    offset += limit; // Each iteration reads MORE rows
  }
}

// ✅ GOOD: Keyset pagination - O(N) reads
async function goodPagination() {
  let lastId = 0;
  const limit = 1000;

  while (true) {
    const batch = await db
      .select()
      .from(table)
      .where(gt(table.id, lastId)) // Start from last seen ID
      .orderBy(asc(table.id))
      .limit(limit);

    if (batch.length === 0) break;

    // Process batch...

    // Update cursor for next iteration
    lastId = batch[batch.length - 1].id;
  }
}

// Real-world example from pull-data.ts
async function pullTableData(tableName: string) {
  let lastId = 0;
  const limit = 1000;
  let hasMore = true;
  let totalPulled = 0;

  while (hasMore) {
    const result = await cloudClient.execute({
      sql: `SELECT * FROM ${tableName} WHERE id > ? ORDER BY id ASC LIMIT ?`,
      args: [lastId, limit],
    });

    if (result.rows.length === 0) {
      hasMore = false;
      break;
    }

    // Process rows...
    totalPulled += result.rows.length;

    // Update cursor
    const lastRow = result.rows[result.rows.length - 1];
    lastId = Number(lastRow.id);

    if (result.rows.length < limit) {
      hasMore = false;
    }
  }
}
