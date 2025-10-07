import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(350);
  
  const { shouldFail = false, topic } = payload;
  
  if (shouldFail) {
    return NextResponse.json({
      status: "validation_failed",
      valid: false,
      errors: [
        "Missing required field: CycleTime",
        "Invalid timestamp format in channel data"
      ],
      expectedMessage: 'The payload format doesn\'t match. Please update to:\n{\n  "CycleTime": [{ "v": <number>, "t": <timestamp_ms> }],\n  "1": [{ "v": <number>, "t": <timestamp_ms> }],\n  "2": [{ "v": <number>, "t": <timestamp_ms> }]\n}\n\nEach numeric key is a sensor channel. v = measurement, t = timestamp (ms since epoch).'
    });
  }
  
  return NextResponse.json({
    status: "validated",
    valid: true,
    message: "Schema validation successful",
    topic
  });
}
