import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  await delay(500);
  const topic = typeof payload?.topic === "string" ? payload.topic : "plant/press/torque";
  const shouldFail = Boolean(payload?.shouldFail);

  if (shouldFail) {
    return NextResponse.json({
      status: "error",
      expectedMessage: "Expected keys: CycleTime, 1, 2 with timestamp/value structure.",
      expected: {
        topic,
        channels: ["CycleTime", "1", "2"],
      },
    });
  }

  return NextResponse.json({
    status: "ok",
    expected: {
      topic,
      channels: ["torque_sensor", "vibration_axis_2", "coolant_temp"],
    },
  });
}
