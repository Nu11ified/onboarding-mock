import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const a = String(body?.a || "line-a");
  const b = String(body?.b || "line-b");
  const metric = String(body?.metric || "vibration");
  const varianceDelta = parseFloat((10 + Math.random() * 10).toFixed(2));
  return NextResponse.json({
    a,
    b,
    metric,
    varianceDeltaPercent: varianceDelta,
    summary: `${b} shows ${varianceDelta}% higher ${metric} variance`,
  });
}
