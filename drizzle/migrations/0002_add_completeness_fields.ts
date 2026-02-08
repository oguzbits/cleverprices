import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  completenessScore: integer("completeness_score").default(0),
  missingSpecs: text("missing_specs").default("[]"), // JSON array of missing required keys
});
