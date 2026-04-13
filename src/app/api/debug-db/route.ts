import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "B0DGJ9";

  try {
    const results = await db
      .select({
        id: products.id,
        asin: products.asin,
        parentAsin: products.parentAsin,
        title: products.title,
        imageUrl: products.imageUrl,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(
        or(
          eq(products.asin, q),
          eq(products.parentAsin, q),
          like(products.asin, `%${q}%`),
          like(products.parentAsin, `%${q}%`)
        )
      )
      .limit(10);

    return NextResponse.json({
      success: true,
      query: q,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
