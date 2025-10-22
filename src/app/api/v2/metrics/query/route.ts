import { NextRequest, NextResponse } from "next/server";

// Return simple metric series for given metrics and time window
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metrics = (searchParams.get("metrics") || "").split(",").filter(Boolean);
  const window = searchParams.get("window") || "7d";

  const now = Date.now();
  const points = 50;
  const data: Record<string, Array<{ t: number; v: number }>> = {};
  for (const m of metrics) {
    const series: Array<{ t: number; v: number }> = [];
    let base = Math.random() * 10 + 10;
    for (let i = points - 1; i >= 0; i--) {
      base += (Math.random() - 0.5) * 0.8;
      series.push({ t: now - i * 60 * 60 * 1000, v: parseFloat(base.toFixed(2)) });
    }
    data[m] = series;
  }

  return NextResponse.json({ window, points, data });
}
