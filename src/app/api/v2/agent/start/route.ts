import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  await request.json().catch(() => ({}));
  await delay(420);
  return NextResponse.json({ status: "starting", agentId: "a789" });
}
