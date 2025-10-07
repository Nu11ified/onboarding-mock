import { NextRequest, NextResponse } from "next/server";

type SecurityEndpoint = {
  id: string;
  name: string;
  type: "Network" | "API" | "Database" | "Server";
  status: "Secure" | "Warning" | "Threat Detected";
  location: string;
  lastScan: string;
  threatsBlocked: number;
  vulnerabilities: number;
  profileId: string;
};

type SecurityProfile = {
  id: string;
  name: string;
  description: string;
  endpointIds: string[];
};

// In-memory storage (resets on server restart)
let securityProfiles: SecurityProfile[] = [
  {
    id: "sec-profile-1",
    name: "Production Network Security",
    description: "Security monitoring for production infrastructure",
    endpointIds: ["sec-1", "sec-2"],
  },
];

let securityEndpoints: SecurityEndpoint[] = [
  {
    id: "sec-1",
    name: "Production API Gateway",
    type: "API",
    status: "Secure",
    location: "us-east-1",
    lastScan: "5 minutes ago",
    threatsBlocked: 127,
    vulnerabilities: 0,
    profileId: "sec-profile-1",
  },
  {
    id: "sec-2",
    name: "Database Cluster",
    type: "Database",
    status: "Secure",
    location: "us-west-2",
    lastScan: "3 minutes ago",
    threatsBlocked: 42,
    vulnerabilities: 1,
    profileId: "sec-profile-1",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const profileId = searchParams.get("profileId");
  const id = searchParams.get("id");

  // Return security profiles
  if (type === "profiles") {
    return NextResponse.json({ profiles: securityProfiles });
  }

  // Return specific endpoint
  if (id) {
    const endpoint = securityEndpoints.find((e) => e.id === id);
    if (endpoint) {
      return NextResponse.json({ endpoint });
    }
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  // Return endpoints filtered by profile
  if (profileId) {
    const filtered = securityEndpoints.filter((e) => e.profileId === profileId);
    return NextResponse.json({ endpoints: filtered });
  }

  // Return all endpoints
  return NextResponse.json({ endpoints: securityEndpoints });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "update") {
    const { id, updates } = body;
    const index = securityEndpoints.findIndex((e) => e.id === id);
    if (index !== -1) {
      securityEndpoints[index] = { ...securityEndpoints[index], ...updates };
      return NextResponse.json({ endpoint: securityEndpoints[index] });
    }
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
