import { NextResponse } from "next/server";

export async function GET() {
  // Return mock top drivers with contributions
  const drivers = [
    { factor: "Vibration", contribution: 0.42, note: "Above typical during shifts 2–3" },
    { factor: "Cycle Duration", contribution: 0.31, note: "Longer cycles observed" },
    { factor: "Coolant Temp", contribution: 0.18, note: "Slight drift upward" },
  ];
  return NextResponse.json({ drivers });
}
