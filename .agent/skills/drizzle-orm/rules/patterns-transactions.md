---
title: Transactions
impact: MEDIUM
impactDescription: Atomic multi-statement operations
tags: patterns, transactions, atomic
---

## Transactions

Wrap related operations in a transaction.

**Example:**

```typescript
await db.transaction(async (tx) => {
  const [product] = await tx
    .insert(products)
    .values({ title: "New Product", category: "ram" })
    .returning();

  await tx.insert(prices).values({
    productId: product.id,
    country: "de",
    amazonPrice: 99.99,
    currency: "EUR",
    source: "manual",
  });
});
```

**Key points:**

- Use `tx` instead of `db` inside the transaction.
- If any statement fails, all changes are rolled back.
- Transactions are essential for related inserts/updates.
