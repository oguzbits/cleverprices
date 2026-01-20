import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ping: "pong",
    deploymentTime: new Date().toISOString(),
    commit: "d740191",
  });
}
