import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(320);
  const email = typeof payload?.email === "string" ? payload.email : "operator@industrialiq.ai";
  return NextResponse.json({ status: "success", userId: "u123", email });
}
