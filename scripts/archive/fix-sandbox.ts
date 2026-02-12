import { createClient } from '@libsql/client';
const client = createClient({ url: 'file:./data/cleverprices-official.db' });
try {
  await client.execute('ALTER TABLE products ADD COLUMN official_specifications TEXT');
} catch (e) {}
try {
  await client.execute('ALTER TABLE products ADD COLUMN official_title TEXT');
} catch (e) {}
await client.execute("UPDATE products SET specifications = NULL, official_specifications = NULL, official_title = NULL, enrichment_status = 'pending'");
console.log('✅ Sandbox database successfully updated via Script.');
