import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(360);
  const severity = typeof payload?.severity === "string" ? payload.severity : "Warning";

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return NextResponse.json({
    status: "created",
    ticketId: `APM-${suffix}`,
    severity,
    actions: ["Escalate", "Assign"],
  });
}
