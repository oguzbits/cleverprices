import { getChildCategories } from "../src/lib/categories";
import { getNonEmptyCategorySlugs } from "../src/lib/product-registry";

async function test() {
  const categorySlug = "elektroartikel";
  const nonEmptySlugs = await getNonEmptyCategorySlugs();
  const children = getChildCategories(categorySlug as any);
  const isEmpty =
    children.length > 0
      ? !children.some((child) => nonEmptySlugs.includes(child.slug))
      : !nonEmptySlugs.includes(categorySlug);

  console.log("Category:", categorySlug);
  console.log("Children Count:", children.length);
  console.log("Is Empty:", isEmpty);
  console.log(
    "Non-empty children:",
    children.filter((c) => nonEmptySlugs.includes(c.slug)).map((c) => c.slug),
  );
}

test();
