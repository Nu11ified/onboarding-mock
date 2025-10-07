import { NextRequest, NextResponse } from "next/server";

type TicketStatus = "New" | "Diagnosing" | "In Progress" | "On Hold" | "Resolved";

type TicketTimelineEntry = {
  id: string;
  author: string;
  body: string;
  timestamp: string;
};

type TicketRow = {
  timestamp: string;
  workorder: string;
  summary: string;
  related: string;
  severity: "Error" | "Warning" | "Resolved";
  owner: string;
  note?: string;
  status: TicketStatus;
  timeline?: TicketTimelineEntry[];
  machine?: string;
  severityLevel?: "Low" | "Medium" | "High" | "Very High";
  alertCategory?: "Error" | "Warning";
  alertDateTime?: string;
  remediationSteps?: string;
  predictedRootCause?: string;
  confidenceLevel?: number;
  assetMacAddress?: string;
  alertDescription?: string;
};

// In-memory storage (resets on server restart)
let tickets: TicketRow[] = [
  {
    timestamp: "2024-11-18 11:02",
    workorder: "WO-8082",
    summary: "Coolant temperature drift detected",
    related: "T-1044",
    severity: "Warning",
    owner: "Courtney Henry",
    status: "Diagnosing",
    machine: "Injection Molding Machine",
    timeline: [
      { id: "t1", author: "Courtney Henry", body: "Flagged temperature variance during pre-shift checks.", timestamp: "2024-11-18 11:05" },
    ],
  },
  {
    timestamp: "2024-11-17 20:44",
    workorder: "WO-7991",
    summary: "MQTT heartbeat loss",
    related: "T-0968",
    severity: "Warning",
    owner: "Devon Lane",
    status: "In Progress",
    machine: "Injection Molding Machine",
    timeline: [
      { id: "t2", author: "Devon Lane", body: "Reset edge gateway and monitoring stability for 30 minutes.", timestamp: "2024-11-17 21:00" },
    ],
  },
  {
    timestamp: "2024-11-16 14:22",
    workorder: "WO-7856",
    summary: "Pressure sensor calibration needed",
    related: "T-0892",
    severity: "Warning",
    owner: "Jane Cooper",
    status: "New",
    machine: "Torque Press 4",
    timeline: [
      { id: "t3", author: "System", body: "Automated alert triggered.", timestamp: "2024-11-16 14:22" },
    ],
  },
  {
    timestamp: "2024-11-15 09:15",
    workorder: "WO-7723",
    summary: "Vibration levels above threshold",
    related: "T-0834",
    severity: "Error",
    owner: "Devon Lane",
    status: "On Hold",
    machine: "CNC Mill 7",
    timeline: [
      { id: "t4", author: "Devon Lane", body: "Waiting for replacement part.", timestamp: "2024-11-15 10:00" },
    ],
  },
  {
    timestamp: "2024-11-14 16:30",
    workorder: "WO-7655",
    summary: "Routine maintenance completed",
    related: "T-0801",
    severity: "Resolved",
    owner: "Jane Cooper",
    status: "Resolved",
    machine: "Torque Press 4",
    timeline: [
      { id: "t5", author: "Jane Cooper", body: "All checks passed, machine back online.", timestamp: "2024-11-14 17:00" },
    ],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const ticket = tickets.find((t) => t.related === id);
    if (ticket) {
      return NextResponse.json({ ticket });
    }
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "update") {
    const { id, updates } = body;
    const index = tickets.findIndex((t) => t.related === id);
    if (index !== -1) {
      tickets[index] = { ...tickets[index], ...updates };
      return NextResponse.json({ ticket: tickets[index] });
    }
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (action === "updateStatus") {
    const { id, status } = body;
    const index = tickets.findIndex((t) => t.related === id);
    if (index !== -1) {
      tickets[index].status = status;
      const timelineEntry: TicketTimelineEntry = {
        id: `status-${Date.now()}`,
        author: "System",
        body: `Status changed to ${status}.`,
        timestamp: new Date().toLocaleString(),
      };
      tickets[index].timeline = [...(tickets[index].timeline || []), timelineEntry];
      return NextResponse.json({ ticket: tickets[index] });
    }
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (action === "addNote") {
    const { id, author, body: noteBody } = body;
    const index = tickets.findIndex((t) => t.related === id);
    if (index !== -1) {
      tickets[index].note = noteBody;
      const timelineEntry: TicketTimelineEntry = {
        id: `note-${Date.now()}`,
        author,
        body: noteBody,
        timestamp: new Date().toLocaleString(),
      };
      tickets[index].timeline = [...(tickets[index].timeline || []), timelineEntry];
      return NextResponse.json({ ticket: tickets[index] });
    }
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (action === "create") {
    const newTicket: TicketRow = body.ticket;
    tickets.push(newTicket);
    return NextResponse.json({ ticket: newTicket });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
