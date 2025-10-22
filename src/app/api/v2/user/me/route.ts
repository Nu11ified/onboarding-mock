import { NextResponse } from "next/server";

export async function GET() {
  // In a real app, derive from auth context; here we mock from local state
  return NextResponse.json({ email: "user@example.com" });
}
