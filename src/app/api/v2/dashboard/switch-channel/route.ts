import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  await delay(200);
  // Echo back desired channel switch as confirmation
  return NextResponse.json({
    status: "ok",
    deviceId: body?.deviceId || null,
    from: body?.from || "Gyro",
    to: body?.to || "Speed",
    refreshed: true,
  });
}
