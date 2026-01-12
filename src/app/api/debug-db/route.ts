import { db } from "@/db";
import { products, prices } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allProducts = await db.select().from(products).limit(10);
    const productCount = await db.select({ count: products.id }).from(products);
    const priceCount = await db.select({ count: prices.id }).from(prices);

    return NextResponse.json({
      status: "success",
      dbConfig: {
        url: process.env.TURSO_DATABASE_URL ? "CONFIGURED" : "MISSING",
        authToken: process.env.TURSO_AUTH_TOKEN ? "CONFIGURED" : "MISSING",
        vercel: process.env.VERCEL || "MISSING",
        vercelEnv: process.env.VERCEL_ENV || "MISSING",
      },
      counts: {
        products: productCount.length,
        prices: priceCount.length,
      },
      sampleProducts: allProducts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
