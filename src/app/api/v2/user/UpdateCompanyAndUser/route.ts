import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(290);
  
  const { userId, email, permissions, role } = payload;
  
  return NextResponse.json({
    status: "success",
    message: "User permissions updated successfully",
    userId: userId || `user-${Date.now()}`,
    email,
    permissions: permissions || ["read", "write"],
    role: role || "Operator",
    updatedAt: new Date().toISOString()
  });
}
