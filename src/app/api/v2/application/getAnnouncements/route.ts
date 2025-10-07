import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  await delay(240);
  
  return NextResponse.json({
    status: "success",
    announcements: [
      {
        id: "ann-1",
        title: "Training completed successfully",
        message: "Your machine intelligence model is now live",
        type: "success",
        timestamp: new Date().toISOString()
      },
      {
        id: "ann-2",
        title: "New ticket generated",
        message: "Test ticket T-1025 has been created",
        type: "info",
        timestamp: new Date().toISOString()
      }
    ]
  });
}
