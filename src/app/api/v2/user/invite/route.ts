import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const users: Array<{ name?: string; email: string; role?: string }> = Array.isArray(body?.users)
      ? body.users
      : [];

    // Basic validation
    const valid = users.filter((u) => typeof u?.email === "string" && u.email.includes("@"));
    await delay(300);

    // Build invitation payloads with 24h expiry
    const invitations = valid.map((u) => ({
      email: u.email,
      name: u.name || u.email.split("@")[0],
      role: u.role || "Viewer",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "sent",
    }));

    return NextResponse.json({ success: true, invitations, count: invitations.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
