import { performSearch } from "@/lib/actions/search";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "Samsung";

  try {
    console.log(`[Debug Search] Testing query: ${query}`);
    const results = await performSearch(query);
    return NextResponse.json({
      success: true,
      query,
      resultCount: {
        categories: results.categories.length,
        products: results.products.length,
      },
      firstProduct: results.products[0] || null,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        stack: err.stack,
        cwd: process.cwd(),
      },
      { status: 500 },
    );
  }
}
