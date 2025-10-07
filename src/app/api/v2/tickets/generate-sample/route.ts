import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(360);
  const severity = typeof payload?.severity === "string" ? payload.severity : "Warning";
  return NextResponse.json({
    status: "created",
    ticketId: "T-1025",
    severity,
    actions: ["Escalate", "Assign"],
  });
}
