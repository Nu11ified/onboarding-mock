import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(300);
  const channel = typeof payload?.channel === "string" ? payload.channel : "email";
  return NextResponse.json({ status: "confirmed", channel });
}
