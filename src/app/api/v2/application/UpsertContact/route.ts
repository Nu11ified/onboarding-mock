import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(310);
  
  const { ticketId, contactEmail, notificationType, action } = payload;
  
  if (action === "subscribe") {
    return NextResponse.json({
      status: "success",
      message: "Contact subscribed to ticket notifications",
      ticketId: ticketId || "T-1025",
      contactEmail,
      notificationType: notificationType || "email",
      subscribed: true
    });
  }
  
  return NextResponse.json({
    status: "success",
    message: "Contact attached to ticket",
    ticketId: ticketId || "T-1025",
    contactEmail,
    role: payload.role || "Collaborator"
  });
}
