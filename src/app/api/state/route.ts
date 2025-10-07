import { NextRequest, NextResponse } from "next/server";

type Collaborator = {
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Technician" | "Operator";
  status: "Active" | "Invited" | "Pending Verification";
  verified: boolean;
};

type TicketRow = {
  timestamp: string;
  workorder: string;
  summary: string;
  related: string;
  // Existing alert category for legacy display chips
  severity: "Error" | "Warning" | "Resolved";
  owner: string;
  note?: string;
  status: "New" | "Diagnosing" | "In Progress" | "On Hold" | "Resolved";
  timeline?: Array<{
    id: string;
    author: string;
    body: string;
    timestamp: string;
  }>;
  machine?: string;
  // New demo fields
  severityLevel?: "Low" | "Medium" | "High" | "Very High";
  alertCategory?: "Error" | "Warning";
  alertDateTime?: string; // ISO or locale string
  remediationSteps?: string;
  predictedRootCause?: string;
  confidenceLevel?: number; // 0-100
  assetMacAddress?: string;
  alertDescription?: string;
};

type AppState = {
  collaborators: Collaborator[];
  tickets: TicketRow[];
};

// In-memory state storage (will be lost on server restart)
let serverState: AppState | null = null;

export async function GET() {
  return NextResponse.json({ state: serverState });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "save") {
      serverState = {
        collaborators: body.collaborators || [],
        tickets: body.tickets || [],
      };
      return NextResponse.json({ success: true, message: "State saved", state: serverState });
    }

    if (body.action === "clear") {
      serverState = null;
      return NextResponse.json({ success: true, message: "State cleared" });
    }

    if (body.action === "addTicket") {
      const newTicket: TicketRow | undefined = body.ticket;
      if (!newTicket || !newTicket.related) {
        return NextResponse.json({ error: "Missing or invalid ticket" }, { status: 400 });
      }
      if (!serverState) {
        serverState = { collaborators: [], tickets: [] };
      }
      const exists = serverState.tickets.some((t) => t.related === newTicket.related);
      if (exists) {
        return NextResponse.json({ error: "Ticket already exists" }, { status: 409 });
      }
      serverState.tickets = [newTicket, ...serverState.tickets];
      return NextResponse.json({ success: true, ticket: newTicket, tickets: serverState.tickets });
    }

    if (body.action === "removeTicket") {
      const id: string | undefined = body.id;
      if (!id) {
        return NextResponse.json({ error: "Missing ticket id" }, { status: 400 });
      }
      if (!serverState) {
        serverState = { collaborators: [], tickets: [] };
      }
      const before = serverState.tickets.length;
      serverState.tickets = serverState.tickets.filter((t) => t.related !== id);
      const removed = serverState.tickets.length < before;
      if (!removed) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, id, tickets: serverState.tickets });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("State API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
