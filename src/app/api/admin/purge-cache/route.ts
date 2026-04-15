import * as nextCache from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { GLOBAL_SALT } from "@/lib/server/cached-products";

/**
 * ADMIN PURGE API
 * 
 * This endpoint allows the automation worker to trigger a surgical purge
 * of the Next.js Data Cache after a database update.
 * 
 * It targets the current GLOBAL_SALT tags to ensure consistency.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  // Simple token-based protection
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tags = [] } = await request.json();
    
    // Default tags to purge if none provided
    const targetTags = tags.length > 0 
      ? tags 
      : [
          "sitemap", 
          "sitemap-slugs", 
          "category", 
          "products", 
          "home",
          "landing",
          `pdp-${GLOBAL_SALT}`,
          GLOBAL_SALT
        ];

    console.log(`[ADMIN-PURGE] Revalidating tags:`, targetTags);
    
    for (const tag of targetTags) {
      nextCache.revalidateTag(tag, "default");
    }

    return NextResponse.json({ 
      success: true, 
      purgedTags: targetTags,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[ADMIN-PURGE] Failed:`, error);
    return NextResponse.json({ 
      error: "Purge failed", 
      message: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
