import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  await delay(200);
  
  const deviceId = `dev-a1b2c3d4e5f6`;
  
  return NextResponse.json({ 
    status: "success", 
    deviceId,
    message: "Device ID retrieved successfully"
  });
}
