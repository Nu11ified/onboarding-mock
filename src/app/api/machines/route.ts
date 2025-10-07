import { NextRequest, NextResponse } from "next/server";

type Machine = {
  id: string;
  name: string;
  status: "Online" | "Offline" | "Warning" | "Error";
  location: string;
  healthScore: number;
  lastSync: string;
  uptime: string;
  dutyCycle: string;
  nextMaintenance: string;
  sensors: number;
  protocol: "MQTT" | "OPC UA" | "Modbus";
  profileId: string;
};

type AssetProfile = {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
};

// In-memory storage (resets on server restart)
let assetProfiles: AssetProfile[] = [
  {
    id: "profile-1",
    name: "Plant 4 Production Line",
    description: "Primary manufacturing assets in Plant 4",
    assetIds: ["m456", "m789"],
  },
  {
    id: "profile-2",
    name: "Plant 2 Assembly Line",
    description: "Assembly line equipment in Plant 2",
    assetIds: ["m123"],
  },
];

let machines: Machine[] = [
  {
    id: "m456",
    name: "Injection Molding Machine",
    status: "Online",
    location: "Plant 4, Line B",
    healthScore: 94,
    lastSync: "2 minutes ago",
    uptime: "99.8%",
    dutyCycle: "78%",
    nextMaintenance: "30 days",
    sensors: 6,
    protocol: "MQTT",
    profileId: "profile-1",
  },
  {
    id: "m123",
    name: "Torque Press 4",
    status: "Online",
    location: "Plant 2, Line A",
    healthScore: 88,
    lastSync: "5 minutes ago",
    uptime: "97.2%",
    dutyCycle: "82%",
    nextMaintenance: "15 days",
    sensors: 8,
    protocol: "OPC UA",
    profileId: "profile-2",
  },
  {
    id: "m789",
    name: "CNC Mill 7",
    status: "Warning",
    location: "Plant 4, Line C",
    healthScore: 72,
    lastSync: "1 minute ago",
    uptime: "94.5%",
    dutyCycle: "65%",
    nextMaintenance: "7 days",
    sensors: 5,
    protocol: "MQTT",
    profileId: "profile-1",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const profileId = searchParams.get("profileId");
  const type = searchParams.get("type");

  // Return asset profiles
  if (type === "profiles") {
    return NextResponse.json({ profiles: assetProfiles });
  }

  // Return specific machine
  if (id) {
    const machine = machines.find((m) => m.id === id);
    if (machine) {
      return NextResponse.json({ machine });
    }
    return NextResponse.json({ error: "Machine not found" }, { status: 404 });
  }

  // Return machines filtered by profile
  if (profileId) {
    const filteredMachines = machines.filter((m) => m.profileId === profileId);
    return NextResponse.json({ machines: filteredMachines });
  }

  // Return all machines
  return NextResponse.json({ machines });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "update") {
    const { id, updates } = body;
    const index = machines.findIndex((m) => m.id === id);
    if (index !== -1) {
      machines[index] = { ...machines[index], ...updates };
      return NextResponse.json({ machine: machines[index] });
    }
    return NextResponse.json({ error: "Machine not found" }, { status: 404 });
  }

  if (action === "create") {
    const newMachine: Machine = body.machine;
    machines.push(newMachine);
    return NextResponse.json({ machine: newMachine });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
