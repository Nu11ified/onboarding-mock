import { NextResponse } from "next/server";

export async function POST() {
  // Return a maintenance forecast date ~ 9 days out
  const days = 9;
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  return NextResponse.json({ predictedInDays: days, date });
}
