import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(380);
  
  const ticketNumber = `T-${Math.floor(1000 + Math.random() * 9000)}`;
  
  return NextResponse.json({
    status: "success",
    message: "Sample ticket created successfully",
    ticketNumber,
    workorder: `WO-${Math.floor(8000 + Math.random() * 2000)}`,
    summary: payload.summary || "Torque spike beyond tolerance",
    severity: payload.severity || "Error",
    owner: "Unassigned",
    createdAt: new Date().toISOString()
  });
}
