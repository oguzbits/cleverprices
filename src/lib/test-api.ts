import { MockAmazonAPI } from "./amazon-api";

async function test() {
  console.log("Testing MockAmazonAPI...");
  const products = await MockAmazonAPI.searchProducts("trending");
  console.log(`Found ${products.length} products.`);
  if (products.length > 0) {
    console.log("First product sample:");
    console.log(JSON.stringify(products[0], null, 2));
  }
}

test();
