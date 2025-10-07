import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(340);
  
  const { email, name, role, companyId } = payload;
  
  return NextResponse.json({
    status: "success",
    message: "User and company registered successfully",
    userId: `user-${Date.now()}`,
    email,
    name,
    role: role || "Operator",
    companyId: companyId || `company-${Date.now()}`,
    activationEmailSent: true
  });
}
