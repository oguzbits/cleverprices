import { performSearch } from "./src/lib/actions/search";

async function test() {
  console.log("Testing performSearch with 'Samsung'...");
  try {
    const results = await performSearch("Samsung");
    console.log("Categories found:", results.categories.length);
    console.log("Products found:", results.products.length);

    if (results.products.length > 0) {
      console.log("First product:", results.products[0].title);
    } else {
      console.log("❌ No products found.");
    }
  } catch (e: any) {
    console.error("❌ Search test failed:", e.message);
  }
}

test();
