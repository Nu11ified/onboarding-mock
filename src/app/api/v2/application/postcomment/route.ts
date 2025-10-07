import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(270);
  
  const { ticketId, comment, action, author } = payload;
  
  return NextResponse.json({
    status: "success",
    message: "Comment/action added to ticket",
    ticketId: ticketId || "T-1025",
    commentId: `comment-${Date.now()}`,
    comment: comment || action,
    author: author || "System",
    timestamp: new Date().toISOString()
  });
}
