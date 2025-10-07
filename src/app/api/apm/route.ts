import { NextRequest, NextResponse } from "next/server";

type APMApplication = {
  id: string;
  name: string;
  type: "API" | "Web App" | "Mobile App" | "Microservice";
  status: "Healthy" | "Degraded" | "Down";
  environment: string;
  latency: string;
  errorRate: string;
  throughput: string;
  uptime: string;
  profileId: string;
};

type APMProfile = {
  id: string;
  name: string;
  description: string;
  applicationIds: string[];
};

// In-memory storage (resets on server restart)
let apmProfiles: APMProfile[] = [
  {
    id: "apm-profile-1",
    name: "Production Services",
    description: "All production applications and services",
    applicationIds: ["apm-1", "apm-2"],
  },
];

let apmApplications: APMApplication[] = [
  {
    id: "apm-1",
    name: "Customer API",
    type: "API",
    status: "Healthy",
    environment: "production",
    latency: "45ms",
    errorRate: "0.02%",
    throughput: "1.2K req/min",
    uptime: "99.98%",
    profileId: "apm-profile-1",
  },
  {
    id: "apm-2",
    name: "Dashboard Web App",
    type: "Web App",
    status: "Healthy",
    environment: "production",
    latency: "120ms",
    errorRate: "0.01%",
    throughput: "850 req/min",
    uptime: "99.95%",
    profileId: "apm-profile-1",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const profileId = searchParams.get("profileId");
  const id = searchParams.get("id");

  // Return APM profiles
  if (type === "profiles") {
    return NextResponse.json({ profiles: apmProfiles });
  }

  // Return specific application
  if (id) {
    const app = apmApplications.find((a) => a.id === id);
    if (app) {
      return NextResponse.json({ application: app });
    }
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Return applications filtered by profile
  if (profileId) {
    const filtered = apmApplications.filter((a) => a.profileId === profileId);
    return NextResponse.json({ applications: filtered });
  }

  // Return all applications
  return NextResponse.json({ applications: apmApplications });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "update") {
    const { id, updates } = body;
    const index = apmApplications.findIndex((a) => a.id === id);
    if (index !== -1) {
      apmApplications[index] = { ...apmApplications[index], ...updates };
      return NextResponse.json({ application: apmApplications[index] });
    }
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
