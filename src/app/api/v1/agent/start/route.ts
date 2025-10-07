import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(420);
  
  return NextResponse.json({ 
    status: "started", 
    agentId: "agent-mi-789",
    message: "MI Agent started successfully",
    payload
  });
}
