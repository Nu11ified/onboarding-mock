import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  await delay(180);
  
  return NextResponse.json({
    status: "success",
    count: 2,
    unreadCount: 1
  });
}
