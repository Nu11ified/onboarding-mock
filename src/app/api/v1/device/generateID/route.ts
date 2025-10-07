import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  await request.json().catch(() => ({}));
  await delay(280);
  
  const deviceId = `dev-${Math.random().toString(36).substr(2, 9)}`;
  
  return NextResponse.json({ 
    status: "success", 
    deviceId,
    message: "Device ID generated successfully"
  });
}
