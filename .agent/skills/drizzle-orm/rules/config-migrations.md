---
title: Migration Commands
impact: HIGH
impactDescription: Schema management workflow
tags: config, migrations, drizzle-kit
---

## Migration Commands

Use Drizzle Kit for schema migrations.

**drizzle.config.ts:**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

**Common commands:**

```bash
# Generate migration files from schema changes
npx drizzle-kit generate

# Push schema directly to database (dev only)
npx drizzle-kit push

# Run migrations in production
npx drizzle-kit migrate
```

**Workflow:**

1. Modify `schema.ts`.
2. Run `drizzle-kit generate` to create migration SQL.
3. Review the generated `.sql` file.
4. Run `drizzle-kit migrate` in production.
