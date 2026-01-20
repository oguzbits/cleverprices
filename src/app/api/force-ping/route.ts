import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ping: "VERIFIED_LATEST_D0606EB",
    time: new Date().toISOString(),
  });
}
