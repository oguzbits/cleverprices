import fs from "fs";
import path from "path";

const files = [
  "src/app/deals/page.tsx",
  "src/app/[categorySlug]/page.tsx",
  "src/app/categories/page.tsx",
  "src/app/p/[slug]/page.tsx",
  "src/components/product/IdealoProductPage.tsx",
  "src/lib/actions/search.ts",
];

files.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, "utf8");

  // Replace import
  content = content.replace(
    /import \{.*cacheLife.*\} from "next\/cache";/g,
    'import * as nextCache from "next/cache";',
  );
  content = content.replace(
    /import \{.*cacheTag.*\} from "next\/cache";/g,
    'import * as nextCache from "next/cache";',
  );

  // Wrap cacheLife
  content = content.replace(
    /(\s+)cacheLife\("([^"]+)"\);/g,
    (match, p1, p2) => {
      return `${p1}try {\n${p1}  nextCache.cacheLife?.("${p2}");\n${p1}} catch (e) {}`;
    },
  );

  // Wrap cacheTag
  content = content.replace(/(\s+)cacheTag\(([^)]+)\);/g, (match, p1, p2) => {
    return `${p1}try {\n${p1}  nextCache.cacheTag?.(${p2});\n${p1}} catch (e) {}`;
  });

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed ${file}`);
});
