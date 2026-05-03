import { DEFAULT_COUNTRY } from "../src/lib/countries";
import { getCategoryProducts } from "../src/lib/server/category-products";

async function test() {
  try {
    console.log("Testing getCategoryProducts('kabel-adapter')...");
    const result = await getCategoryProducts("kabel-adapter", "de", {
      page: "1",
    });
    console.log("Success! Products count:", result.products.length);
    if (result.products.length > 0) {
      console.log("First product price:", result.products[0]?.price);
    }
    console.log("Serialization check...");
    const stringified = JSON.stringify(result);
    console.log("Stringified length:", stringified.length);
    console.log("PASS");
  } catch (error) {
    console.error("FAILED:", error);
  }
}

test();
