import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET() {
  await delay(280);
  return NextResponse.json({ status: "online", deviceId: "d1011" });
}
