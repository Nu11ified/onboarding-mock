import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const x = String(body?.x || "metric_x");
  const y = String(body?.y || "metric_y");
  const r = parseFloat((0.4 + Math.random() * 0.4).toFixed(2));
  // Generate sample points
  const points = Array.from({ length: 60 }).map((_, i) => ({
    x: parseFloat((Math.random() * 10).toFixed(2)),
    y: parseFloat((Math.random() * 10).toFixed(2)),
  }));
  return NextResponse.json({ correlation: r, x, y, points });
}
