import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(360);
  const assetName = typeof payload?.assetName === "string" ? payload.assetName : "Torque Press";
  return NextResponse.json({ status: "created", assetId: "m456", assetName });
}
