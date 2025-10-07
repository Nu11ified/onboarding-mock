"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  AppWindow,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  LayoutDashboard,
  Loader2,
  Menu,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { RealTimeChart } from "@/components/RealTimeChart";
import { MultiChannelChart } from "@/components/MultiChannelChart";

import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AssetProfile = {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
};

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

const SIDENAV_ITEMS: Array<{ key: NavKey; label: string; icon: LucideIcon }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "view-machine", label: "View Machine", icon: Gauge },
  { key: "security", label: "Security Monitoring", icon: Shield },
  { key: "apm", label: "App Performance", icon: Zap },
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "apps", label: "Apps", icon: AppWindow },
  { key: "settings", label: "Settings", icon: Settings },
];

const THREADS = ["MI Onboarding", "Torque Press 4", "Fleet Ops"];

const API_SEQUENCE: ApiTemplate[] = [
  {
    id: "register",
    title: "Register individual user",
    endpoint: "/api/v2/user/RegisterIndividualUser",
    method: "POST",
    payload: { email: "john@factory.com" },
  },
  {
    id: "profile",
    title: "Create device profile",
    endpoint: "/api/v2/device/createdeviceprofile",
    method: "POST",
    payload: {
      assetName: "Injection Molding Machine",
      splitCycle: 20,
      trainingSeconds: 200,
      daysToMaintenance: 30,
    },
  },
  {
    id: "generate-id",
    title: "Generate device ID",
    endpoint: "/api/v1/device/generateID",
    method: "POST",
    payload: {},
  },
  {
    id: "get-id",
    title: "Get device ID",
    endpoint: "/api/v1/device/getDeviceID",
    method: "GET",
  },
  {
    id: "agent-start",
    title: "Start MI agent",
    endpoint: "/api/v1/agent/start",
    method: "POST",
    payload: { profileId: "profile-1", deviceId: "dev-a1b2c3d4e5f6" },
  },
  {
    id: "validate-schema",
    title: "Validate schema",
    endpoint: "/api/v1/ingest/validate-schema",
    method: "POST",
    payload: { topic: "/ext/a1b2c3d4-e5f6", shouldFail: false },
  },
];

const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    name: "Amelia Chen",
    email: "amelia@industrialiq.ai",
    role: "Admin",
    status: "Active",
    verified: true,
  },
  {
    name: "Jane Cooper",
    email: "jcooper@industrialiq.ai",
    role: "Manager",
    status: "Active",
    verified: true,
  },
  {
    name: "Devon Lane",
    email: "devon@industrialiq.ai",
    role: "Technician",
    status: "Invited",
    verified: false,
  },
  {
    name: "Courtney Henry",
    email: "courtney@industrialiq.ai",
    role: "Operator",
    status: "Pending Verification",
    verified: false,
  },
];

const DASHBOARD_KPIS: DashboardKpi[] = [
  {
    id: "asset-status",
    label: "Asset status",
    value: "Stable",
    delta: "+0.8%",
    tone: "positive",
  },
  {
    id: "health-score",
    label: "Health score",
    value: "94",
    suffix: "/100",
    delta: "+5",
    tone: "positive",
  },
  {
    id: "duty-rate",
    label: "Duty rate",
    value: "78%",
    delta: "-3%",
    tone: "warning",
  },
  {
    id: "maintenance",
    label: "Maintenance days",
    value: "30",
    suffix: " planned",
    delta: "+6 predicted",
    tone: "neutral",
  },
  {
    id: "tickets",
    label: "Tickets",
    value: "1",
    suffix: " error",
    delta: "2 warnings",
    tone: "critical",
  },
];

const DASHBOARD_CHARTS: DashboardChart[] = [
  {
    id: "temp",
    title: "Temperature envelope",
    unit: "°C",
    range: "Last 4h",
    accent: "from-purple-100 via-purple-50 to-white",
  },
  {
    id: "pressure",
    title: "Pressure variance",
    unit: "kPa",
    range: "Live",
    accent: "from-slate-100 via-white to-purple-50",
  },
  {
    id: "gyro",
    title: "Gyro axes",
    unit: "rad/s",
    range: "Last 12h",
    accent: "from-white via-purple-50 to-purple-100",
  },
];

const DASHBOARD_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Torque spike warning",
    body: "Machine detected torsion beyond adaptive threshold for 32s.",
    timestamp: "2 min ago",
    tone: "critical",
  },
  {
    id: "n2",
    title: "Training complete",
    body: "Anomaly models refreshed. Next refresh scheduled in 12h.",
    timestamp: "Just now",
    tone: "positive",
  },
  {
    id: "n3",
    title: "SLA insight",
    body: "All monitored lines operating above 96.5% output.",
    timestamp: "18 min ago",
    tone: "neutral",
  },
];

// Common start for both flows
const COMMON_START_FLOW: ScriptStep[] = [
  {
    id: "a1",
    author: "assistant",
    text: "Welcome! Let's add your machine. First, I'll need your email to create your account.",
  },
  {
    id: "u1",
    author: "user",
    text: "john@factory.com",
  },
  {
    id: "a1b",
    author: "assistant",
    text: "Perfect! Account created. Now, can you connect a machine to our MQTT or OPC UA public broker?",
    action: "register-user",
  },
  {
    id: "a1c",
    author: "assistant",
    text: "If you don't have MQTT/OPC UA available, I can set you up with a demo using our test machine instead. Just reply with 'MQTT', 'OPC UA', or 'Demo'.",
  },
  {
    id: "u2",
    author: "user",
    text: "MQTT",
  },
];

// MQTT/OPC UA Flow (Original)
const MQTT_FLOW: ScriptStep[] = [
  {
    id: "a2",
    author: "assistant",
    text: "Great! Let's configure your device profile. What's your machine's name?",
  },
  { id: "u3", author: "user", text: "Injection Molding Machine" },
  {
    id: "a3",
    author: "assistant",
    text: "How long does one machine cycle take in seconds? (Split Counter)",
  },
  { id: "u4", author: "user", text: "20" },
  {
    id: "a4",
    author: "assistant",
    text: "How long should the training period be in seconds?",
  },
  { id: "u5", author: "user", text: "200" },
  {
    id: "a5",
    author: "assistant",
    text: "How many days are there between scheduled maintenance?",
  },
  { id: "u6", author: "user", text: "30" },
  {
    id: "a6",
    author: "assistant",
    text: "Please review the configuration summary above. Does this look correct?",
  },
  { id: "u6a", author: "user", text: "Yes, looks correct." },
  {
    id: "a6b",
    author: "assistant",
    text: "Great — creating your device profile…",
    action: "create-profile",
  },
  {
    id: "a7",
    author: "assistant",
    text: "Device profile created successfully. Now generating your Device ID and starting the MI Agent…",
    action: "start-agent",
  },
  {
    id: "a9",
    author: "assistant",
    text: "Your agent is live. Please connect to our broker:\nmqtt://broker.micro.ai:1883\nTopic: /ext/a1b2c3d4-e5f6\nLet me know when you're connected.",
    action: "show-broker",
  },
  { id: "u8", author: "user", text: "Connected." },
  {
    id: "a10",
    author: "assistant",
    text: "Validating your connection and schema…",
    action: "start-schema-validation",
  },
  {
    id: "a11",
    author: "assistant",
    text: `The payload format doesn't match. Please update to:
{
  "CycleTime": [{ "v": <number>, "t": <timestamp_ms> }],
  "1": [{ "v": <number>, "t": <timestamp_ms> }],
  "2": [{ "v": <number>, "t": <timestamp_ms> }]
}

Each numeric key is a sensor channel. v = measurement, t = timestamp (ms since epoch).`,
    action: "schema-error",
  },
  { id: "u9", author: "user", text: "Updated, please check." },
  {
    id: "a12",
    author: "assistant",
    text: "Re-validating…",
    action: "schema-retry",
  },
  {
    id: "a13",
    author: "assistant",
    text: "Success! Your data is streaming. Training your model now — this will take about 200 seconds.",
    action: "start-training",
  },
  {
    id: "a14",
    author: "assistant",
    text: "Thanks for verifying your email — your account is now active.",
    action: "await-training-complete",
    runActionBeforeMessage: true,
  },
  {
    id: "a15",
    author: "assistant",
    text: "Your machine setup is complete. Health scoring and predictive maintenance are active. Would you like to add another user?",
  },
  { id: "u10", author: "user", text: "Yes." },
];

// Demo Machine Flow (New)
const DEMO_FLOW: ScriptStep[] = [
  {
    id: "a2-demo",
    author: "assistant",
    text: "Excellent! I'll set you up with our demo environment. What would you like to name this demo machine?",
  },
  { id: "u3-demo", author: "user", text: "Injection Molding Machine" },
  {
    id: "a3-demo",
    author: "assistant",
    text: "Perfect! For the demo machine, I'll use pre-configured settings. Here's what we're setting up:",
    action: "show-demo-config",
  },
  {
    id: "a4-demo",
    author: "assistant",
    text: "Please review the configuration above. Does this look correct?",
  },
  { id: "u4-demo", author: "user", text: "Yes." },
  {
    id: "a6-demo",
    author: "assistant",
    text: "",
    action: "create-profile",
    runActionBeforeMessage: true,
  },
  {
    id: "a7-demo",
    author: "assistant",
    text: "Device profile created. Generating Device ID and starting the MI Agent…",
    action: "start-agent",
  },
  {
    id: "a9-demo",
    author: "assistant",
    text: "Normally, you would connect your machine to our public MQTT/OPC UA broker at this step. The broker validates your machine's sensor data and begins ingesting telemetry. Since this is our demo machine, it's already connected and streaming data.",
    action: "show-broker-explanation",
  },
  {
    id: "a10-demo",
    author: "assistant",
    text: "Now validating the data schema. We check that your sensor data matches our expected format with proper timestamps and value structures. The demo machine data is pre-validated, so this step completes automatically.",
    action: "auto-validate-demo",
  },
  {
    id: "a13-demo",
    author: "assistant",
    text: "Schema validated! Training your anomaly detection model now — this will take about 200 seconds.",
    action: "start-training",
  },
  {
    id: "a14-demo",
    author: "assistant",
    text: "Training complete! Your account is now active.",
    action: "await-training-complete",
    runActionBeforeMessage: true,
  },
  {
    id: "a15-demo",
    author: "assistant",
    text: "Demo environment setup complete! You can now:\n\n1. Add your own machine with real sensor data\n2. Invite team members to collaborate\n3. Explore the dashboard and features\n\nWhat would you like to do next?",
  },
  { id: "u10-demo", author: "user", text: "Invite team members" },
];

// Common ending flow (collaborators, tickets, notifications)
const COMMON_END_FLOW: ScriptStep[] = [
  {
    id: "a16",
    author: "assistant",
    text: "Please provide name, email, and role.",
  },
  {
    id: "u11",
    author: "user",
    text: "Add Jane (jane@factory.com) as Operator, and Jake (jake@factory.com) as Operator.",
  },
  {
    id: "a17",
    author: "assistant",
    text: "Done. Jane and Jake have been added as Operators. Verification emails have been sent.",
    action: "add-operators",
  },
  {
    id: "a18",
    author: "assistant",
    text: "Would you like to create a test ticket?",
  },
  { id: "u12", author: "user", text: "Yes." },
  {
    id: "a19",
    author: "assistant",
    text: "Test ticket generated:",
    action: "create-ticket",
    runActionBeforeMessage: true,
  },
  {
    id: "a20",
    author: "assistant",
    text: "Do you want to assign Ticket #T-1025 to yourself or another user?",
  },
  { id: "u13", author: "user", text: "Assign to Jane." },
  {
    id: "a21",
    author: "assistant",
    text: "Ticket #T-1025 assigned to Jane. Would you like to add context?",
    action: "assign-ticket",
  },
  {
    id: "u14",
    author: "user",
    text: "Add: The coolant pump needs to be checked; there may be motor casing dust buildup near Gyro X.",
  },
  {
    id: "a22",
    author: "assistant",
    text: "Added context to Ticket #T-1025. Close ticket?",
    action: "add-ticket-context",
  },
  { id: "u15", author: "user", text: "Yes." },
  {
    id: "a23",
    author: "assistant",
    text: "Ticket #T-1025 resolved. Would you like notifications for new tickets?",
    action: "close-ticket",
  },
  { id: "u16", author: "user", text: "Yes, email only." },
  {
    id: "a24",
    author: "assistant",
    text: "You'll now get ticket notifications at john@factory.com. Setup complete! You can manage users, tickets, and notifications right here in chat.",
    action: "subscribe-notifications",
  },
];

// Helper function to construct active flow based on selected flowType
function getActiveFlow(flowType: 'mqtt' | 'demo' | null): ScriptStep[] {
  if (flowType === null) {
    // Before the user has chosen, only show the common start
    return COMMON_START_FLOW;
  } else if (flowType === 'mqtt') {
    return [...COMMON_START_FLOW, ...MQTT_FLOW, ...COMMON_END_FLOW];
  } else if (flowType === 'demo') {
    return [...COMMON_START_FLOW, ...DEMO_FLOW, ...COMMON_END_FLOW];
  }
  return COMMON_START_FLOW;
}

type Phase = "onboarding" | "dashboard";
type ScenarioKey = "visualize" | "protect" | "monitor";
type NavKey =
  | "overview"
  | "view-machine"
  | "machines"
  | "security"
  | "apm"
  | "tickets"
  | "apps"
  | "settings";

type ApiMethod = "GET" | "POST";

type ApiTemplate = {
  id: string;
  title: string;
  endpoint: string;
  method: ApiMethod;
  payload?: Record<string, unknown>;
};

type ApiStep = ApiTemplate & {
  status: ApiStatus;
  time: string;
};

type ApiStatus = "pending" | "running" | "success";

type ChatEntry = {
  id: string;
  author: ChatAuthor;
  name: string;
  role: string;
  text: string;
  timestamp: string;
  attachment?: ReactNode;
};

type ChatAuthor = "assistant" | "user";

type ScriptAction =
  | "register-user"
  | "create-profile"
  | "show-demo-config"
  | "show-broker-explanation"
  | "auto-validate-demo"
  | "show-summary-card"
  | "start-agent"
  | "show-broker"
  | "start-schema-validation"
  | "schema-error"
  | "schema-retry"
  | "start-training"
  | "await-training-complete"
  | "add-operators"
  | "create-ticket"
  | "assign-ticket"
  | "add-ticket-context"
  | "close-ticket"
  | "subscribe-notifications";

type ScriptStep = {
  id: string;
  author: ChatAuthor;
  text: string;
  action?: ScriptAction;
  runActionBeforeMessage?: boolean;
};

type CollectedData = {
  name?: string;
  email?: string;
  assetName?: string;
  connectionType?: string;
  splitCounter?: string;
  trainingSeconds?: string;
  dtmn?: string;
};

type PlaceholderState = {
  headline: string;
  message: string;
  tone: "idle" | "loading" | "warning" | "success" | "training";
  broker?: BrokerInfo | null;
  schemaHint?: string | null;
  trainingProgress?: number;
};

type BrokerInfo = {
  url: string;
  topic: string;
};

type CollaboratorStatus = "Active" | "Invited" | "Pending Verification";

type Collaborator = {
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Technician" | "Operator";
  status: CollaboratorStatus;
  verified: boolean;
};

type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  delta?: string;
  tone: "positive" | "warning" | "critical" | "neutral";
};

type DashboardChart = {
  id: string;
  title: string;
  unit: string;
  range: string;
  accent: string;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  tone: "critical" | "positive" | "neutral";
};

type NotificationItemWithRead = NotificationItem & {
  isRead: boolean;
};

type TicketRow = {
  timestamp: string;
  workorder: string;
  summary: string;
  related: string;
  severity: "Error" | "Warning" | "Resolved"; // legacy category for chips
  owner: string;
  note?: string; // context
  status: TicketStatus;
  timeline?: TicketTimelineEntry[];
  machine?: string;
  // New demo fields
  severityLevel?: "Low" | "Medium" | "High" | "Very High";
  alertCategory?: "Error" | "Warning";
  alertDateTime?: string;
  remediationSteps?: string;
  predictedRootCause?: string;
  confidenceLevel?: number;
  assetMacAddress?: string;
  alertDescription?: string;
};

type SortState = {
  column: keyof TicketRow;
  direction: "asc" | "desc";
};

type TicketStatus =
  | "New"
  | "Diagnosing"
  | "In Progress"
  | "On Hold"
  | "Resolved";

type TicketTimelineEntry = {
  id: string;
  author: string;
  body: string;
  timestamp: string;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("onboarding");
  const [scenario, setScenario] = useState<ScenarioKey>("visualize");
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [chatCollapsed, setChatCollapsed] = useState<boolean>(false);
  const [activeThread, setActiveThread] = useState<number>(0);

  const [chatMessages, setChatMessages] = useState<ChatEntry[]>([]);
  const [apiSteps, setApiSteps] = useState<ApiStep[]>(initialiseApiSteps);
  const [placeholder, setPlaceholder] = useState<PlaceholderState>({
    headline: "Let’s get your machine online",
    message: "Answer the questions in chat to onboard your machine.",
    tone: "idle",
    broker: null,
    schemaHint: null,
    trainingProgress: 0,
  });
  const [collected, setCollected] = useState<CollectedData>({});
  const [flowType, setFlowType] = useState<'mqtt' | 'demo' | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [assetProfiles, setAssetProfiles] = useState<AssetProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    null,
  );
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [sortState, setSortState] = useState<SortState>({
    column: "timestamp",
    direction: "desc",
  });
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">("All");
  const [severityFilter, setSeverityFilter] = useState<
    "All" | "Error" | "Warning" | "Resolved"
  >("All");
  const [machineFilter, setMachineFilter] = useState<string>("All");
  const [ticketView, setTicketView] = useState<"table" | "kanban">("kanban");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemWithRead[]>(
    DASHBOARD_NOTIFICATIONS.map((n) => ({ ...n, isRead: false }))
  );

  // Pagination state for Tickets view
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const testTicketRef = useRef<TicketRow | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scenarioInitialisedRef = useRef<ScenarioKey | null>(null);
  const automationResumeRef = useRef<number | null>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null);

  const messageIdRef = useRef(0);
  const trainingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trainingResolveRef = useRef<(() => void) | null>(null);
  const agentSequenceRef = useRef<Promise<void> | null>(null);

  const cleanupTraining = useCallback(() => {
    if (trainingTimerRef.current) {
      clearInterval(trainingTimerRef.current);
      trainingTimerRef.current = null;
    }
  }, []);

  const runAgentSequence = useCallback(async () => {
    if (agentSequenceRef.current) {
      await agentSequenceRef.current;
      return;
    }
    const sequence = (async () => {
      for (let i = 0; i < API_SEQUENCE.length; i += 1) {
        setApiSteps((prev) =>
          prev.map((step, idx) =>
            idx === i ? { ...step, status: "running", time: "…" } : step,
          ),
        );
        const template = API_SEQUENCE[i];
        const started = performance.now();
        await fetch(template.endpoint, {
          method: template.method,
          headers: template.payload
            ? { "Content-Type": "application/json" }
            : undefined,
          body: template.payload ? JSON.stringify(template.payload) : undefined,
        })
          .then((response) => response.json())
          .catch(() => ({}));
        const latency = `${Math.max(120, Math.round(performance.now() - started + 60))}ms`;
        setApiSteps((prev) =>
          prev.map((step, idx) =>
            idx === i ? { ...step, status: "success", time: latency } : step,
          ),
        );
      }
    })();
    agentSequenceRef.current = sequence;
    await sequence;
    agentSequenceRef.current = null;
  }, []);

  const validateSchema = useCallback(async (shouldFail: boolean) => {
    const response = await fetch("/api/v1/ingest/validate-schema", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "/ext/a1b2c3d4-e5f6", shouldFail }),
    });
    const result = await response.json();
    if (shouldFail) {
      setPlaceholder((prev) => ({
        ...prev,
        tone: "warning",
        schemaHint: result.expectedMessage ?? "Schema mismatch detected.",
      }));
    } else {
      setPlaceholder((prev) => ({
        ...prev,
        tone: "success",
        schemaHint: null,
      }));
    }
  }, []);

  const startTrainingCountdown = useCallback(() => {
    cleanupTraining();
    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(100, progress + 8);
      setPlaceholder((prev) => ({ ...prev, trainingProgress: progress }));
      if (progress >= 100) {
        cleanupTraining();
        if (trainingResolveRef.current) {
          trainingResolveRef.current();
          trainingResolveRef.current = null;
        }
      }
    }, 400);
    trainingTimerRef.current = interval;
  }, [cleanupTraining]);

  const waitForTraining = useCallback(() => {
    return new Promise<void>((resolve) => {
      if ((placeholder.trainingProgress ?? 0) >= 100) {
        resolve();
        return;
      }
      trainingResolveRef.current = resolve;
    });
  }, [placeholder.trainingProgress]);

  const scenarioParam = searchParams.get("scenario");
  // Load asset profiles, machines and tickets from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load asset profiles
        const profilesRes = await fetch("/api/machines?type=profiles");
        const profilesData = await profilesRes.json();
        if (profilesData.profiles) {
          setAssetProfiles(profilesData.profiles);
          // Select first profile by default
          if (profilesData.profiles.length > 0 && !selectedProfileId) {
            setSelectedProfileId(profilesData.profiles[0].id);
          }
        }

        // Load all machines
        const machinesRes = await fetch("/api/machines");
        const machinesData = await machinesRes.json();
        if (machinesData.machines) {
          setMachines(machinesData.machines);
          // Select the Injection Molding Machine (m456) by default
          if (machinesData.machines.length > 0 && !selectedMachineId) {
            const injectionMoldingMachine = machinesData.machines.find(
              (m: Machine) => m.id === "m456",
            );
            setSelectedMachineId(
              injectionMoldingMachine?.id || machinesData.machines[0].id,
            );
          }
        }

        // Prefer loading tickets and collaborators from state API
        const stateRes = await fetch("/api/state");
        const stateData = await stateRes.json();
        if (stateData.state?.collaborators) {
          setCollaborators(stateData.state.collaborators);
        } else {
          setCollaborators(INITIAL_COLLABORATORS);
        }
        if (Array.isArray(stateData.state?.tickets) && stateData.state.tickets.length > 0) {
          setTickets(stateData.state.tickets);
          if (!selectedTicketId) {
            setSelectedTicketId(stateData.state.tickets[0].related);
          }
        } else {
          // Fallback to default tickets API if state has none
          const ticketsRes = await fetch("/api/tickets");
          const ticketsData = await ticketsRes.json();
          if (ticketsData.tickets) {
            setTickets(ticketsData.tickets);
            if (ticketsData.tickets.length > 0 && !selectedTicketId) {
              setSelectedTicketId(ticketsData.tickets[0].related);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setCollaborators(INITIAL_COLLABORATORS);
      }
    };
    void loadData();
  }, [selectedMachineId, selectedTicketId]);

  useEffect(() => {
    if (scenarioParam === "protect" || scenarioParam === "monitor") {
      setScenario(scenarioParam);
    } else {
      setScenario("visualize");
    }
  }, [scenarioParam]);

  useEffect(() => {
    if (scenarioInitialisedRef.current === scenario) {
      return;
    }
    scenarioInitialisedRef.current = scenario;

    // Start immediately if coming from landing page
    if (chatMessages.length === 0 && currentStepIndex === 0) {
      cleanupTraining();
      messageIdRef.current = 0;
      setPhase("onboarding");
      setChatCollapsed(false);
      setActiveNav("overview");
      setActiveThread(0);
      setChatMessages([]);
      setApiSteps(initialiseApiSteps());
      setPlaceholder({
        headline: "Let's get your machine online",
        message: "Answer the questions in chat to onboard your machine.",
        tone: "idle",
        broker: null,
        schemaHint: null,
        trainingProgress: 0,
      });
      setCollected({});
      setSortState({ column: "timestamp", direction: "desc" });
      setStatusFilter("All");
      setSeverityFilter("All");
      setCurrentStepIndex(0);
      setPendingStepIndex(null);
      automationResumeRef.current = null;

      // Start script immediately without delay
      setTimeout(() => {
        void advanceScript(0);
      }, 50);
    } else {
      resetExperience();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  useEffect(() => () => void cleanupTraining(), [cleanupTraining]);
  useEffect(
    () => () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    },
    [],
  );

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const { column, direction } = sortState;
      const valueA = a[column];
      const valueB = b[column];
      if (valueA === valueB) return 0;
      const comparison = (valueA ?? 0) > (valueB ?? 0) ? 1 : -1;
      return direction === "asc" ? comparison : -comparison;
    });
  }, [tickets, sortState]);

  const filteredTickets = useMemo(() => {
    return sortedTickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;
      const matchesSeverity =
        severityFilter === "All" || ticket.severity === severityFilter;
      const matchesMachine =
        machineFilter === "All" || ticket.machine === machineFilter;
      return matchesStatus && matchesSeverity && matchesMachine;
    });
  }, [sortedTickets, statusFilter, severityFilter, machineFilter]);

  // Slice filtered tickets per page for display
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  // When filters or total change, ensure we are on a valid page
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
    if (page > totalPages) {
      setPage(1);
    }
  }, [filteredTickets.length, pageSize]);

  useEffect(() => {
    if (
      selectedTicketId &&
      !sortedTickets.some((ticket) => ticket.related === selectedTicketId)
    ) {
      setSelectedTicketId(filteredTickets[0]?.related ?? null);
    } else if (!selectedTicketId && filteredTickets.length > 0) {
      setSelectedTicketId(filteredTickets[0].related);
    }
  }, [filteredTickets, selectedTicketId, sortedTickets]);

  const selectedTicket = useMemo(
    () =>
      sortedTickets.find((ticket) => ticket.related === selectedTicketId) ??
      null,
    [sortedTickets, selectedTicketId],
  );

  const appendMessage = useCallback(
    (entry: Omit<ChatEntry, "id" | "timestamp"> & { timestamp?: string }) => {
      const timestamp = entry.timestamp ?? "Just now";
      const id = `msg-${(messageIdRef.current += 1)}`;
      setChatMessages((prev) => [...prev, { ...entry, id, timestamp }]);
    },
    [],
  );

  const handleSort = (column: keyof TicketRow) => {
    setSortState((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "desc" };
    });
  };

  const handleToggleChat = () => {
    setChatCollapsed((prev) => !prev);
  };

  const handleAddCollaborator = (payload: {
    name: string;
    email: string;
    role: Collaborator["role"];
    verified: boolean;
  }) => {
    const email = payload.email.trim();
    if (!email) return;
    setCollaborators((prev) => {
      if (prev.some((collaborator) => collaborator.email === email))
        return prev;
      const updated: Collaborator[] = [
        ...prev,
        {
          name: (payload.name.trim() || email.split("@")[0]) ?? email,
          email,
          role: payload.role,
          status: (payload.verified
            ? "Active"
            : "Invited") as CollaboratorStatus,
          verified: !!payload.verified,
        },
      ];
      void saveState(updated, tickets);
      return updated;
    });
  };

  const handleUpdateCollaboratorRole = (
    email: string,
    role: Collaborator["role"],
  ) => {
    setCollaborators((prev) => {
      const updated = prev.map((collaborator) =>
        collaborator.email === email ? { ...collaborator, role } : collaborator,
      );
      void saveState(updated, tickets);
      return updated;
    });
  };

  const handleToggleCollaboratorVerified = (
    email: string,
    verified: boolean,
  ) => {
    setCollaborators((prev) => {
      const updated = prev.map((collaborator) =>
        collaborator.email === email
          ? {
              ...collaborator,
              verified,
              status: (verified
                ? "Active"
                : "Pending Verification") as CollaboratorStatus,
            }
          : collaborator,
      );
      void saveState(updated, tickets);
      return updated;
    });
  };

  const handleRemoveCollaborator = (email: string) => {
    setCollaborators((prev) => {
      const updated = prev.filter(
        (collaborator) => collaborator.email !== email,
      );
      void saveState(updated, tickets);
      return updated;
    });
  };

  const appendTimeline = (related: string, entry: TicketTimelineEntry) => {
    setTickets((prev) => {
      const updated = prev.map((ticket) =>
        ticket.related === related
          ? {
              ...ticket,
              timeline: [...(ticket.timeline ?? []), entry],
            }
          : ticket,
      );
      void saveState(collaborators, updated);
      return updated;
    });
  };

  const saveState = async (
    updatedCollaborators: Collaborator[],
    updatedTickets: TicketRow[],
  ) => {
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          collaborators: updatedCollaborators,
          tickets: updatedTickets,
        }),
      });
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  };

  const handleTicketStatusChange = useCallback(
    async (related: string, status: TicketStatus) => {
      try {
        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStatus", id: related, status }),
        });
        const data = await response.json();
        if (data.ticket) {
          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.related === related ? data.ticket : ticket,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to update ticket status:", error);
      }
    },
    [],
  );

  const handleTicketAssign = useCallback((related: string, owner: string) => {
    setTickets((prev) => {
      const updated = prev.map((ticket) =>
        ticket.related === related ? { ...ticket, owner } : ticket,
      );
      void saveState(collaborators, updated);
      return updated;
    });
    appendTimeline(related, {
      id: `assign-${Date.now()}`,
      author: "Onboarding Copilot",
      body: `Assigned to ${owner}.`,
      timestamp: new Date().toLocaleString(),
    });
  }, [collaborators]);

  const handleTicketSeverityChange = useCallback(
    (related: string, severity: TicketRow["severity"]) => {
      setTickets((prev) => {
        const updated = prev.map((ticket) =>
          ticket.related === related ? { ...ticket, severity } : ticket,
        );
        void saveState(collaborators, updated);
        return updated;
      });
      appendTimeline(related, {
        id: `severity-${Date.now()}`,
        author: "Onboarding Copilot",
        body: `Severity marked as ${severity}.`,
        timestamp: new Date().toLocaleString(),
      });
    },
    [collaborators],
  );

  const handleTicketAddNote = useCallback(
    async (related: string, author: string, body: string) => {
      try {
        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addNote",
            id: related,
            author,
            body,
          }),
        });
        const data = await response.json();
        if (data.ticket) {
          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.related === related ? data.ticket : ticket,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to add note:", error);
      }
    },
    [],
  );

  const generateId = (prefix: string) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleCreateTicket = useCallback(
    async (payload: {
      summary: string;
      owner: string;
      machine?: string;
      note?: string;
      alertCategory: TicketRow["alertCategory"];
      severityLevel: TicketRow["severityLevel"];
      alertDateTime?: string;
      predictedRootCause?: string;
      confidenceLevel?: number;
      assetMacAddress?: string;
      alertDescription?: string;
      remediationSteps?: string;
    }) => {
      try {
        const legacySeverity: TicketRow["severity"] = payload.alertCategory ?? "Warning";
        const ticket: TicketRow = {
          timestamp: new Date().toLocaleString(),
          workorder: generateId("WO"),
          summary: payload.summary,
          related: generateId("T"),
          severity: legacySeverity,
          owner: payload.owner || "Unassigned",
          note: payload.note,
          status: "New",
          timeline: [
            {
              id: `create-${Date.now()}`,
              author: "Onboarding Copilot",
              body: "Ticket created",
              timestamp: new Date().toLocaleString(),
            },
          ],
          machine: payload.machine,
          // Extended fields
          alertCategory: payload.alertCategory,
          severityLevel: payload.severityLevel,
          alertDateTime: payload.alertDateTime,
          predictedRootCause: payload.predictedRootCause,
          confidenceLevel: payload.confidenceLevel,
          assetMacAddress: payload.assetMacAddress,
          alertDescription: payload.alertDescription,
          remediationSteps: payload.remediationSteps,
        };

        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "addTicket", ticket }),
        });
        const data = await res.json();
        if (res.ok && data.ticket) {
          setTickets((prev) => {
            const updated = [data.ticket, ...prev];
            void saveState(collaborators, updated);
            return updated;
          });
          setSelectedTicketId(data.ticket.related);
        } else {
          console.error("Failed to create ticket:", data?.error || data);
        }
      } catch (err) {
        console.error("Failed to create ticket:", err);
      }
    },
    [collaborators],
  );

  const handleDeleteTicket = useCallback(
    async (related: string) => {
      try {
        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "removeTicket", id: related }),
        });
        const data = await res.json();
        if (res.ok) {
          setTickets((prev) => {
            const updated = prev.filter((t) => t.related !== related);
            void saveState(collaborators, updated);
            return updated;
          });
          setSelectedTicketId((prev) => (prev === related ? null : prev));
        } else {
          console.error("Failed to remove ticket:", data?.error || data);
        }
      } catch (err) {
        console.error("Failed to remove ticket:", err);
      }
    },
    [collaborators],
  );

  const handleUpdateTicketFields = useCallback(
    (related: string, updates: Partial<TicketRow>) => {
      setTickets((prev) => {
        const updated = prev.map((t) => (t.related === related ? { ...t, ...updates } : t));
        void saveState(collaborators, updated);
        return updated;
      });
    },
    [collaborators],
  );

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  // Build a contextual chat attachment for a given script step.
  // For now, return null for all steps to keep the demo lightweight.
  function buildAttachment(
    stepId: string,
    currentCollected: CollectedData,
    ticketsArg: TicketRow[],
    testTicket: TicketRow | null,
  ): ReactNode | null {
    // Show configuration summary after collecting onboarding fields
    // For demo flow, only show on a3-demo (not a6-demo which is empty)
    // For MQTT flow, show on a6
    if (stepId === "a6" || stepId === "a3-demo") {
      // Provide sensible defaults if any field hasn't been collected yet
      const data: CollectedData = {
        email: currentCollected.email ?? "john@factory.com",
        assetName: currentCollected.assetName ?? "Injection Molding Machine",
        connectionType: currentCollected.connectionType ?? "Demo",
        splitCounter: currentCollected.splitCounter ?? "20",
        trainingSeconds: currentCollected.trainingSeconds ?? "200",
        dtmn: currentCollected.dtmn ?? "30",
      };
      return <SummaryCard data={data} />;
    }

    return null;
  }

  const appendAssistantStep = useCallback(
    (step: ScriptStep, currentCollected: CollectedData) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const attachment = buildAttachment(
            step.id,
            currentCollected,
            tickets,
            testTicketRef.current,
          );

          // Skip rendering a bubble when there is no text and no attachment
          if (!attachment && (!step.text || step.text.trim() === "")) {
            resolve();
            return;
          }

          appendMessage({
            author: "assistant",
            name: "Onboarding Copilot",
            role: "Assistant",
            text: step.text,
            attachment,
          });
          resolve();
        }, 450);
      });
    },
    [appendMessage, tickets],
  );

  const performAction = useCallback(
    async (action?: ScriptAction): Promise<"continue" | "await"> => {
      if (!action) return "continue";
      switch (action) {
        case "register-user":
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Creating your account",
            message: "Registering your user account with MicroAI...",
            tone: "loading",
          }));
          // Simulate API call
          await fetch("/api/v2/user/RegisterIndividualUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: collected.email || "john@factory.com" }),
          });
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Account created",
            message: "Your account is ready. Let's set up your machine.",
            tone: "success",
          }));
          return "continue";
        case "create-profile":
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Creating device profile",
            message: "Setting up your machine configuration...",
            tone: "loading",
          }));
          // Simulate API call
          await fetch("/api/v2/device/createdeviceprofile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assetName: collected.assetName || "Injection Molding Machine",
              splitCycle: collected.splitCounter || "20",
              trainingSeconds: "200",
              daysToMaintenance: collected.dtmn || "30",
            }),
          });
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Profile created",
            message: "Device profile configured successfully.",
            tone: "success",
          }));
          return "continue";
        case "show-demo-config":
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Demo configuration ready",
            message: "Pre-configured settings: 20s cycle, 200s training, 30 days maintenance.",
            tone: "idle",
          }));
          return "continue";
        case "show-summary-card":
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Review configuration",
            message: "Confirm the details before we create your asset profile.",
            tone: "idle",
          }));
          return "continue";
        case "start-agent": {
          setPlaceholder({
            headline: "Setting up your agent…",
            message:
              "Registering your account, creating the asset profile, and bootstrapping orchestration.",
            tone: "loading",
            broker: null,
            schemaHint: null,
            trainingProgress: 0,
          });
          await runAgentSequence();
          return "continue";
        }
        case "show-broker":
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Agent live",
            message: "Connect your client to begin streaming telemetry.",
            tone: "success",
            broker: {
              url: "mqtt://broker.micro.ai:1883",
              topic: "/ext/a1b2c3d4-e5f6",
            },
          }));
          return "continue";
        case "show-broker-explanation":
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Demo broker connection",
            message: "Demo machine is pre-connected and streaming data.",
            tone: "success",
            broker: {
              url: "mqtt://demo.micro.ai:1883",
              topic: "/demo/machine-1",
            },
          }));
          return "continue";
        case "auto-validate-demo":
          setPlaceholder((prev) => ({
            ...prev,
            headline: "Schema validated",
            message: "Demo data schema is pre-validated and compliant.",
            tone: "success",
          }));
          return "continue";
        case "start-schema-validation":
          await validateSchema(true);
          return "continue";
        case "schema-error":
          setPlaceholder((prev) => ({
            ...prev,
            tone: "warning",
            schemaHint:
              "Schema mismatch detected. Update payload keys to match the expected format.",
          }));
          return "continue";
        case "schema-retry":
          await validateSchema(false);
          return "continue";
        case "start-training":
          startTrainingCountdown();
          setPlaceholder((prev) => ({
            ...prev,
            tone: "training",
            headline: "Training in progress",
            message: "Building anomaly models and baselines (~200s)…",
          }));
          return "await";
        case "await-training-complete": {
          await waitForTraining();
          setPhase("dashboard");
          setActiveNav("machines"); // Navigate to machines view to show the instantiated machine
          setChatCollapsed(false);
          setPlaceholder((prev) => ({
            ...prev,
            tone: "success",
            headline: "Account activated",
            message: "Health scoring and predictive maintenance are live.",
            trainingProgress: 100,
          }));
          return "continue";
        }
        case "add-operators":
          setCollaborators((prev) => addDemoCollaborators(prev));
          return "continue";
        case "create-ticket": {
          const ticket: TicketRow = {
            timestamp: "2024-11-18 14:36",
            workorder: "WO-8125",
            summary: "Torque spike beyond tolerance",
            related: "T-1025",
            severity: "Error",
            owner: "Unassigned",
            note: "Cause: Testing, Linked Sensor: Gyro X",
            status: "New",
            timeline: [
              {
                id: "t-init",
                author: "Onboarding Copilot",
                body: "Test ticket generated for demo purposes.",
                timestamp: new Date().toLocaleString(),
              },
            ],
          };
          testTicketRef.current = ticket;
          setTickets((prev) => {
            const updated = [
              ticket,
              ...prev.filter((item) => item.related !== ticket.related),
            ];
            void saveState(collaborators, updated);
            return updated;
          });
          setSelectedTicketId(ticket.related);
          return "continue";
        }
        case "assign-ticket":
          handleTicketAssign("T-1025", "Jane Cooper");
          return "continue";
        case "add-ticket-context":
          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.related === "T-1025"
                ? {
                    ...ticket,
                    note: "The coolant pump needs to be checked; there may be motor casing dust buildup near Gyro X.",
                  }
                : ticket,
            ),
          );
          handleTicketAddNote(
            "T-1025",
            "John",
            "The coolant pump needs to be checked; there may be motor casing dust buildup near Gyro X.",
          );
          return "continue";
        case "close-ticket":
          handleTicketSeverityChange("T-1025", "Resolved");
          handleTicketStatusChange("T-1025", "Resolved");
          return "continue";
        case "subscribe-notifications":
          setPlaceholder((prev) => ({
            ...prev,
            tone: "success",
            headline: "Notifications configured",
            message: "Ticket alerts will reach john@factory.com.",
          }));
          return "continue";
        default:
          return "continue";
      }
    },
    [
      collected,
      collaborators,
      runAgentSequence,
      validateSchema,
      startTrainingCountdown,
      waitForTraining,
      handleTicketAssign,
      handleTicketAddNote,
      handleTicketSeverityChange,
      handleTicketStatusChange,
    ],
  );

  const advanceScript = useCallback(
    async (
      startIndex?: number,
      currentCollected?: CollectedData,
      flowOverride?: 'mqtt' | 'demo' | null,
    ) => {
      let index = startIndex ?? currentStepIndex;
      const collectedData = currentCollected ?? collected;
      const activeFlow = getActiveFlow(
        typeof flowOverride !== 'undefined' ? flowOverride : flowType,
      );

      while (index < activeFlow.length) {
        const step = activeFlow[index];
        if (step.author === "user") {
          setPendingStepIndex(index);
          setCurrentStepIndex(index);
          return;
        }

        if (step.runActionBeforeMessage && step.action) {
          const actionResult = await performAction(step.action);
          if (actionResult === "await") {
            automationResumeRef.current = index + 1;
            setCurrentStepIndex(index + 1);
            return;
          }
        }

        await appendAssistantStep(step, collectedData);

        if (!step.runActionBeforeMessage && step.action) {
          const actionResult = await performAction(step.action);
          if (actionResult === "await") {
            automationResumeRef.current = index + 1;
            setCurrentStepIndex(index + 1);
            return;
          }
        }

        index += 1;
        setCurrentStepIndex(index);
      }
      setPendingStepIndex(null);
    },
    [appendAssistantStep, currentStepIndex, performAction, collected, flowType],
  );

  const pendingStep =
    typeof pendingStepIndex === "number" ? getActiveFlow(flowType)[pendingStepIndex] : null;

  const handleSendScripted = () => {
    if (!pendingStep || pendingStep.author !== "user") return;
    const stepId = pendingStep.id;
    const text = pendingStep.text;

    appendMessage({ author: "user", name: "You", role: "Operator", text });

    // Update collected data and get the new value immediately
    const updatedCollected = applyUserInput(collected, stepId, text);
    setCollected(updatedCollected);

    // Determine flow override if user just chose a path
    let flowOverride: 'mqtt' | 'demo' | null | undefined;
    if (stepId === "u2") {
      const normalizedText = text.toLowerCase().trim();
      if (normalizedText.includes("demo")) {
        flowOverride = 'demo';
        setFlowType('demo');
      } else if (normalizedText.includes("mqtt") || normalizedText.includes("opc")) {
        flowOverride = 'mqtt';
        setFlowType('mqtt');
      } else {
        flowOverride = 'mqtt';
        setFlowType('mqtt');
      }
    }

    if (stepId === "u8") {
      setPlaceholder((prev) => ({
        ...prev,
        headline: "Validating connection",
        message: "Checking schema compliance for your MQTT feed…",
        tone: "loading",
        schemaHint: null,
      }));
    }

    if (stepId === "u9") {
      setPlaceholder((prev) => ({
        ...prev,
        headline: "Schema update received",
        message: "Re-running schema checks with your latest payload…",
        tone: "loading",
        schemaHint: null,
      }));
    }

    if (stepId === "u16") {
      setPlaceholder((prev) => ({
        ...prev,
        headline: "Notifications configured",
        message: "Ticket alerts will be delivered to john@factory.com.",
        tone: "success",
      }));
    }

    const nextIndex = pendingStepIndex! + 1;
    setPendingStepIndex(null);
    setCurrentStepIndex(nextIndex);
    void advanceScript(nextIndex, updatedCollected, flowOverride);
  };

  useEffect(() => {
    if (
      automationResumeRef.current !== null &&
      phase === "onboarding" &&
      (placeholder.trainingProgress ?? 0) >= 100
    ) {
      const resumeIndex = automationResumeRef.current;
      automationResumeRef.current = null;
      void advanceScript(resumeIndex);
    }
  }, [advanceScript, phase, placeholder.trainingProgress]);

  const resetExperience = () => {
    cleanupTraining();
    messageIdRef.current = 0;
    setPhase("onboarding");
    setChatCollapsed(false);
    setActiveNav("overview");
    setActiveThread(0);
    setChatMessages([]);
    setApiSteps(initialiseApiSteps());
    setPlaceholder({
      headline: "Let’s get your machine online",
      message: "Answer the questions in chat to begin the scripted demo.",
      tone: "idle",
      broker: null,
      schemaHint: null,
      trainingProgress: 0,
    });
    setCollected({});
    setFlowType(null);
    setCollaborators(INITIAL_COLLABORATORS);
    setTickets(INITIAL_TICKETS);
    setSortState({ column: "timestamp", direction: "desc" });
    setSelectedTicketId(INITIAL_TICKETS[0]?.related ?? null);
    setStatusFilter("All");
    setSeverityFilter("All");
    setCurrentStepIndex(0);
    setPendingStepIndex(null);
    automationResumeRef.current = null;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      void advanceScript(0);
    }, 100);
  };

  const handleThreadChange = (index: number) => {
    setActiveThread(index);
  };

  // Allow sending a custom reply (e.g., clicking quick-reply buttons)
  const handleSendCustom = (text: string) => {
    if (!pendingStep || pendingStep.author !== "user") return;
    const stepId = pendingStep.id;

    appendMessage({ author: "user", name: "You", role: "Operator", text });

    const updatedCollected = applyUserInput(collected, stepId, text);
    setCollected(updatedCollected);

    let flowOverride: 'mqtt' | 'demo' | null | undefined;
    if (stepId === 'u2') {
      const normalizedText = text.toLowerCase().trim();
      if (normalizedText.includes('demo')) {
        flowOverride = 'demo';
        setFlowType('demo');
      } else if (normalizedText.includes('mqtt') || normalizedText.includes('opc')) {
        flowOverride = 'mqtt';
        setFlowType('mqtt');
      } else {
        flowOverride = 'mqtt';
        setFlowType('mqtt');
      }
    }

    const nextIndex = (pendingStepIndex ?? 0) + 1;
    setPendingStepIndex(null);
    setCurrentStepIndex(nextIndex);
    void advanceScript(nextIndex, updatedCollected, flowOverride);
  };

  if (phase === "onboarding") {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 text-slate-900">
        <ChatSidebar
          messages={chatMessages}
          threads={THREADS}
          activeThread={activeThread}
          onSelectThread={handleThreadChange}
          pendingStep={pendingStep}
          onSendScripted={handleSendScripted}
          onSendCustom={(text) => handleSendCustom(text)}
          scriptRemaining={countRemainingSteps(currentStepIndex, flowType)}
          isDashboard={false}
        />
        <OnboardingPlaceholder state={placeholder} apiSteps={apiSteps} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 text-slate-900">
      {!chatCollapsed && (
        <ChatSidebar
          messages={chatMessages}
          threads={THREADS}
          activeThread={activeThread}
          onSelectThread={handleThreadChange}
          pendingStep={pendingStep}
          onSendScripted={handleSendScripted}
          onSendCustom={(text) => handleSendCustom(text)}
          scriptRemaining={countRemainingSteps(currentStepIndex, flowType)}
          isDashboard
        />
      )}
      <Sidebar
        active={activeNav}
        onSelect={setActiveNav}
        collapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onToggleChat={handleToggleChat}
          chatCollapsed={chatCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
          onOpenShare={() => setShareOpen(true)}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <DashboardMain
              activeNav={activeNav}
              collaborators={collaborators}
              assetProfiles={assetProfiles}
              machines={machines}
              selectedProfileId={selectedProfileId}
              selectedMachineId={selectedMachineId}
              onProfileChange={(profileId) => {
                setSelectedProfileId(profileId);
                // Select first machine in the new profile
                const profileMachines = machines.filter(
                  (m) => m.profileId === profileId,
                );
                if (profileMachines.length > 0) {
                  setSelectedMachineId(profileMachines[0].id);
                }
              }}
              onMachineChange={setSelectedMachineId}
              onSelect={setActiveNav}
              notifications={DASHBOARD_NOTIFICATIONS}
              kpis={DASHBOARD_KPIS}
              charts={DASHBOARD_CHARTS}
              tickets={paginatedTickets}
              allTickets={sortedTickets}
              sortState={sortState}
              onSort={handleSort}
              selectedTicket={selectedTicket}
              onSelectTicket={setSelectedTicketId}
              onStatusFilterChange={setStatusFilter}
              onSeverityFilterChange={setSeverityFilter}
              onMachineFilterChange={setMachineFilter}
              statusFilter={statusFilter}
              severityFilter={severityFilter}
              machineFilter={machineFilter}
              ticketView={ticketView}
              onTicketViewChange={setTicketView}
              ticketModalOpen={ticketModalOpen}
              onTicketModalChange={setTicketModalOpen}
              onStatusChange={handleTicketStatusChange}
              onAssign={handleTicketAssign}
              onSeverityChange={handleTicketSeverityChange}
              onAddNote={handleTicketAddNote}
              chatCollapsed={chatCollapsed}
              sidebarCollapsed={sidebarCollapsed}
              onNewTicketOpenChange={setNewTicketOpen}
              onDeleteTicket={handleDeleteTicket}
              onUpdateFields={handleUpdateTicketFields}
              page={page}
              pageSize={pageSize}
              total={filteredTickets.length}
              onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            />
          </main>
        </div>
      </div>
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        collaborators={collaborators}
        onAdd={handleAddCollaborator}
        onUpdateRole={handleUpdateCollaboratorRole}
        onToggleVerified={handleToggleCollaboratorVerified}
        onRemove={handleRemoveCollaborator}
      />
      <NewTicketModal
        open={newTicketOpen}
        onOpenChange={setNewTicketOpen}
        collaborators={collaborators}
        machines={machines}
        onCreate={(payload) => {
          void (async () => handleCreateTicket(payload))();
        }}
      />
    </div>
  );
}

function Sidebar({
  active,
  onSelect,
  collapsed,
}: {
  active: NavKey;
  onSelect: (key: NavKey) => void;
  collapsed: boolean;
}) {
  return (
    <nav
      className={cn(
        "flex flex-col border-r border-purple-100 bg-white/70 py-6 backdrop-blur transition-all",
        collapsed ? "w-[72px] px-2" : "w-60 px-4",
      )}
      aria-label="Primary navigation"
    >
      <div className="flex items-center justify-center px-2">
        {!collapsed ? (
          <Image
            src="/microai-logo-dark.svg"
            alt="MicroAI"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        ) : (
          <div className="relative w-12 h-12 flex items-center justify-center">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>
      <div className="mt-8 space-y-2">
        {SIDENAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const activeStyle = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition",
                activeStyle
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:bg-purple-50 hover:text-slate-900",
              )}
              aria-current={activeStyle ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar({
  onToggleChat,
  chatCollapsed,
  onToggleSidebar,
  sidebarCollapsed,
  onOpenShare,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: {
  onToggleChat: () => void;
  chatCollapsed: boolean;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onOpenShare: () => void;
  notifications: NotificationItemWithRead[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
}) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return (
    <header className="flex h-16 items-center justify-between border-b border-purple-100 bg-white/70 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-purple-100 px-4 py-2 text-xs font-semibold",
            chatCollapsed
              ? "bg-white text-purple-600"
              : "bg-purple-600 text-white",
          )}
          onClick={onToggleChat}
        >
          <MessageSquare className="h-4 w-4" />
          {chatCollapsed ? "Show chat" : "Hide chat"}
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-100 bg-white text-purple-500"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenShare}
          className="inline-flex items-center gap-2 rounded-full border border-purple-600 bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
        >
          <Sparkles className="h-4 w-4" /> Share workspace
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50">
              <Bell className="h-4 w-4" /> Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-white">
            <div className="flex items-center justify-between px-2 py-2">
              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Notifications
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllNotificationsRead}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer transition-all"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start gap-1 px-4 py-3 border-b border-slate-100 last:border-b-0",
                    !notification.isRead && "bg-purple-50/30"
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-purple-600" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => onMarkNotificationRead(notification.id)}
                        className="ml-2 text-xs text-purple-600 hover:text-purple-700 hover:underline font-medium cursor-pointer transition-all"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        notification.tone === "critical" && "bg-red-100 text-red-700",
                        notification.tone === "positive" && "bg-green-100 text-green-700",
                        notification.tone === "neutral" && "bg-slate-100 text-slate-700"
                      )}
                    >
                      {notification.tone}
                    </span>
                    <span className="text-xs text-slate-400">{notification.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1.5 text-left text-sm text-slate-600">
          <Avatar className="h-8 w-8">
            <AvatarFallback>JN</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block">John</span>
        </div>
      </div>
    </header>
  );
}

type PromptTemplate = {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'onboarding' | 'line' | 'bulk' | 'custom';
};

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'onboard-asset',
    name: 'Onboard Single Asset',
    description: 'Template for onboarding a single machine or asset',
    content: 'I need to onboard a new asset with the following details:\nAsset Name: [name]\nConnection Type: [MQTT/OPC UA]\nSensors: [list]',
    category: 'onboarding',
  },
  {
    id: 'create-line',
    name: 'Create Production Line',
    description: 'Set up a new production line with multiple assets',
    content: 'Create a production line:\nLine Name: [name]\nAssets: [list]\nSequence: [order]',
    category: 'line',
  },
  {
    id: 'bulk-add',
    name: 'Bulk Asset Addition',
    description: 'Add multiple assets at once',
    content: 'Bulk add assets from:\nSource: [CSV/Excel file]\nColumns: [mapping]',
    category: 'bulk',
  },
];

function ChatSidebar({
  messages,
  pendingStep,
  onSendScripted,
  onSendCustom,
  scriptRemaining,
  threads,
  activeThread,
  onSelectThread,
  isDashboard,
}: {
  messages: ChatEntry[];
  pendingStep: ScriptStep | null;
  onSendScripted: () => void;
  onSendCustom: (text: string) => void;
  scriptRemaining: number;
  threads: string[];
  activeThread: number;
  onSelectThread: (index: number) => void;
  isDashboard: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [threadSearchOpen, setThreadSearchOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const [promptMenuOpen, setPromptMenuOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');

  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Scroll only the chat container, not the entire page
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [messages]);

  const filteredThreads = threads.filter(thread => 
    thread.toLowerCase().includes(threadSearch.toLowerCase())
  );

  const handleSavePrompt = () => {
    if (newPromptName.trim() && newPromptContent.trim()) {
      const newPrompt: PromptTemplate = {
        id: `custom-${Date.now()}`,
        name: newPromptName,
        description: 'Custom prompt',
        content: newPromptContent,
        category: 'custom',
      };
      setSavedPrompts([...savedPrompts, newPrompt]);
      setNewPromptName('');
      setNewPromptContent('');
      setShowSavePrompt(false);
    }
  };

  const handleUsePrompt = (prompt: PromptTemplate) => {
    onSendCustom(prompt.content);
    setPromptMenuOpen(false);
  };

  return (
    <aside
      className={cn(
        "flex w-[340px] flex-col border-r border-purple-100 bg-white/80",
        isDashboard ? "" : "backdrop-blur",
      )}
      aria-label="Chat sidebar"
    >
      <div className="border-b border-purple-100 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Thread Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setThreadSearchOpen(!threadSearchOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-purple-200 bg-white px-2 py-1.5 text-left text-xs hover:bg-purple-50"
            >
              <span className="font-medium text-slate-700 truncate">{threads[activeThread]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            </button>
            {threadSearchOpen && (
              <div className="absolute left-0 top-9 z-50 w-full rounded-xl border border-purple-100 bg-white shadow-lg">
              <div className="border-b border-purple-100 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search threads..."
                    value={threadSearch}
                    onChange={(e) => setThreadSearch(e.target.value)}
                    className="w-full rounded-lg border border-purple-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                {filteredThreads.length > 0 ? (
                  filteredThreads.map((thread, index) => {
                    const originalIndex = threads.indexOf(thread);
                    return (
                      <button
                        key={thread}
                        onClick={() => {
                          onSelectThread(originalIndex);
                          setThreadSearchOpen(false);
                          setThreadSearch('');
                        }}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          activeThread === originalIndex
                            ? "bg-purple-100 text-purple-700 font-semibold"
                            : "text-slate-700 hover:bg-purple-50"
                        )}
                      >
                        <span>{thread}</span>
                        {activeThread === originalIndex && (
                          <Check className="h-4 w-4 text-purple-600" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-4 text-center text-xs text-slate-400">No threads found</p>
                )}
                </div>
              </div>
            )}
          </div>
          <button 
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 flex-shrink-0"
            onClick={() => {
              // Create new thread logic
              alert('Create new thread functionality');
            }}
            title="Create new thread"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={chatContainerRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-slate-400 text-center max-w-[200px]">
              Start a conversation to begin onboarding
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-purple-100 p-4">
        <div className="space-y-3">
          {/* Input Area with Plus and Attach Buttons */}
          <div className="relative flex items-center gap-2">
            {/* Plus Button - Prompt Library */}
            <div className="relative">
              <button 
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-200 text-purple-500 hover:bg-purple-50"
                onClick={() => setPromptMenuOpen(!promptMenuOpen)}
                title="Prompt library"
              >
                <Plus className="h-4 w-4" />
              </button>
              {promptMenuOpen && (
                <div className="absolute bottom-12 left-0 z-50 w-72 rounded-xl border border-purple-100 bg-white shadow-lg">
                  <div className="border-b border-purple-100 p-3">
                    <p className="text-xs font-semibold text-slate-700">Prompt Library</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {savedPrompts.map(prompt => (
                      <button
                        key={prompt.id}
                        onClick={() => handleUsePrompt(prompt)}
                        className="w-full rounded-lg p-3 text-left hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{prompt.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{prompt.description}</p>
                          </div>
                          <FileText className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600 font-mono line-clamp-2">
                          {prompt.content}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-purple-100 p-2">
                    {!showSavePrompt ? (
                      <button
                        onClick={() => setShowSavePrompt(true)}
                        className="w-full flex items-center gap-2 rounded-lg border border-dashed border-purple-200 p-2 text-xs font-semibold text-purple-600 hover:bg-purple-50"
                      >
                        <Save className="h-3 w-3" />
                        Save New Prompt
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Prompt name"
                          value={newPromptName}
                          onChange={(e) => setNewPromptName(e.target.value)}
                          className="w-full rounded border border-purple-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <textarea
                          placeholder="Prompt content"
                          value={newPromptContent}
                          onChange={(e) => setNewPromptContent(e.target.value)}
                          rows={3}
                          className="w-full rounded border border-purple-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSavePrompt}
                            className="flex-1 rounded bg-purple-600 px-2 py-1 text-xs font-semibold text-white hover:bg-purple-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShowSavePrompt(false);
                              setNewPromptName('');
                              setNewPromptContent('');
                            }}
                            className="flex-1 rounded border border-purple-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Attach Button */}
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-purple-200 px-3 text-xs font-medium text-purple-600 hover:bg-purple-50"
              title="Attach files"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach
            </button>
            {/* Send Button */}
            <button
              className={cn(
                "flex-1 flex items-center justify-between rounded-full border px-4 py-2 text-xs font-semibold",
                pendingStep
                  ? "border-purple-200 text-purple-600 hover:bg-purple-50"
                  : "border-slate-100 text-slate-300",
              )}
              onClick={onSendScripted}
              disabled={!pendingStep}
            >
              {pendingStep
                ? `Send: ${truncateText(pendingStep.text, 42)}`
                : "Waiting for assistant"}
              <span className="text-[11px] uppercase tracking-wide">
                {scriptRemaining} left
              </span>
            </button>
          </div>

          {pendingStep?.id === "u2" && (
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-semibold text-purple-600 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => onSendCustom("MQTT")}
              >
                MQTT
              </button>
              <button
                className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-semibold text-purple-600 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => onSendCustom("OPC UA")}
              >
                OPC UA
              </button>
              <button
                className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-semibold text-purple-600 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => onSendCustom("Demo machine")}
              >
                Demo machine
              </button>
            </div>
          )}

          <p className="rounded-2xl border border-purple-100 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            This mock keeps you on script so you can rehearse the full
            onboarding narrative end-to-end.
          </p>
        </div>
      </div>
    </aside>
  );
}

function ChatBubble({ message }: { message: ChatEntry }) {
  const isAssistant = message.author === "assistant";
  return (
    <div
      className={cn(
        "flex gap-2",
        isAssistant ? "flex-row" : "flex-row-reverse",
      )}
      role="listitem"
    >
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarFallback
          className={cn(
            "text-[10px] font-semibold",
            isAssistant
              ? "bg-purple-100 text-purple-700"
              : "bg-slate-900 text-white",
          )}
        >
          {isAssistant ? "M" : message.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn(
            "text-[10px] font-semibold",
            isAssistant ? "text-purple-600" : "text-slate-700"
          )}>
            {message.name}
          </span>
          <span className="text-[9px] text-slate-400">{message.timestamp}</span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-xs leading-relaxed",
            isAssistant
              ? "bg-purple-50 text-slate-700"
              : "bg-slate-900 text-white",
          )}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
          {message.attachment && (
            <div className="mt-2 space-y-2">{message.attachment}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingPlaceholder({
  state,
  apiSteps,
}: {
  state: PlaceholderState;
  apiSteps: ApiStep[];
}) {
  return (
    <section className="flex flex-1 flex-col gap-5 px-8 py-12">
      <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-purple-600">
          <Loader2
            className={cn(
              "h-4 w-4",
              state.tone === "loading" || state.tone === "training"
                ? "animate-spin"
                : "",
            )}
          />
          {state.headline}
        </div>
        <p className="mt-3 text-sm text-slate-600">{state.message}</p>
        {state.broker && (
          <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-purple-600">
              Broker connection details
            </p>
            <p className="mt-2 font-mono text-[11px]">
              URL: {state.broker.url}
            </p>
            <p className="mt-1 font-mono text-[11px]">
              Topic: {state.broker.topic}
            </p>
          </div>
        )}
        {state.schemaHint && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
            {state.schemaHint}
          </div>
        )}
        {state.tone === "training" && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Training progress</span>
              <span>{state.trainingProgress ?? 0}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-purple-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 transition-all"
                style={{ width: `${state.trainingProgress ?? 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg">
        <p className="text-sm font-semibold text-slate-800">
          Mock API orchestration
        </p>
        <ul className="mt-4 space-y-3 text-xs text-slate-600">
          {apiSteps.map((step) => (
            <li
              key={step.id}
              className="rounded-2xl border border-purple-100 bg-white px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  {step.title}
                </span>
                <StatusPill status={step.status} />
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                {step.endpoint}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Latency: {step.time}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const INITIAL_TICKETS: TicketRow[] = [];

function DashboardMain({
  activeNav,
  collaborators,
  assetProfiles,
  machines,
  selectedProfileId,
  selectedMachineId,
  onProfileChange,
  onMachineChange,
  onSelect,
  notifications,
  kpis,
  charts,
  tickets,
  allTickets,
  sortState,
  onSort,
  selectedTicket,
  onSelectTicket,
  statusFilter,
  severityFilter,
  machineFilter,
  ticketView,
  ticketModalOpen,
  onStatusFilterChange,
  onSeverityFilterChange,
  onMachineFilterChange,
  onTicketViewChange,
  onTicketModalChange,
  onStatusChange,
  onAssign,
  onSeverityChange,
  onAddNote,
  chatCollapsed,
  sidebarCollapsed,
  onNewTicketOpenChange,
  onDeleteTicket,
  onUpdateFields,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  activeNav: NavKey;
  collaborators: Collaborator[];
  assetProfiles: AssetProfile[];
  machines: Machine[];
  selectedProfileId: string | null;
  selectedMachineId: string | null;
  onProfileChange: (profileId: string) => void;
  onMachineChange: (machineId: string) => void;
  onSelect: (nav: NavKey) => void;
  notifications: NotificationItem[];
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  tickets: TicketRow[];
  allTickets: TicketRow[];
  sortState: SortState;
  onSort: (column: keyof TicketRow) => void;
  selectedTicket: TicketRow | null;
  onSelectTicket: (related: string) => void;
  statusFilter: TicketStatus | "All";
  severityFilter: "All" | "Error" | "Warning" | "Resolved";
  machineFilter: string;
  ticketView: "table" | "kanban";
  ticketModalOpen: boolean;
  onStatusFilterChange: (value: TicketStatus | "All") => void;
  onSeverityFilterChange: (
    value: "All" | "Error" | "Warning" | "Resolved",
  ) => void;
  onMachineFilterChange: (value: string) => void;
  onTicketViewChange: (value: "table" | "kanban") => void;
  onTicketModalChange: (open: boolean) => void;
  onStatusChange: (related: string, status: TicketStatus) => void;
  onAssign: (related: string, owner: string) => void;
  onSeverityChange: (related: string, severity: TicketRow["severity"]) => void;
  onAddNote: (related: string, author: string, body: string) => void;
  chatCollapsed: boolean;
  sidebarCollapsed: boolean;
  onNewTicketOpenChange: (open: boolean) => void;
  onDeleteTicket: (related: string) => void;
  onUpdateFields: (related: string, updates: Partial<TicketRow>) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const selectedMachine = machines.find((m) => m.id === selectedMachineId);

  // Render different views based on activeNav
  // Overview shows list of all machines (and future SM/APM cards)
  if (activeNav === "overview") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
            <OverviewPage machines={machines} />
          </div>
        </div>
      </div>
    );
  }

  // View Machine - prompts user to select profile and asset
  if (activeNav === "view-machine") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
            <AssetSelectionView
              profiles={assetProfiles}
              machines={machines}
              onSelect={(profileId, machineId) => {
                onProfileChange(profileId);
                onMachineChange(machineId);
                onSelect("machines");
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Security Monitoring - Coming Soon
  if (activeNav === "security") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
            <ComingSoonView
              icon={Shield}
              title="Security Monitoring"
              description="Monitor and protect your endpoints, APIs, and infrastructure from threats in real-time."
            />
          </div>
        </div>
      </div>
    );
  }

  // Application Performance Monitoring - Coming Soon
  if (activeNav === "apm") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
            <ComingSoonView
              icon={Zap}
              title="Application Performance Monitoring"
              description="Track latency, errors, and throughput across your applications and microservices."
            />
          </div>
        </div>
      </div>
    );
  }

  // Machines shows the selected machine dashboard
  if (activeNav === "machines" && selectedMachine) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
            <MachineDetailView
              machine={selectedMachine}
              tickets={tickets.filter(
                (t) => t.machine === selectedMachine.name,
              )}
              kpis={DASHBOARD_KPIS}
              charts={DASHBOARD_CHARTS}
              notifications={DASHBOARD_NOTIFICATIONS}
              profiles={assetProfiles}
              machines={machines}
              selectedProfileId={selectedProfileId}
              selectedMachineId={selectedMachineId}
              onProfileChange={onProfileChange}
              onMachineChange={onMachineChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // Tickets shows full Kanban board
  if (activeNav === "tickets") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
            <header className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                Tickets Management
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                All Tickets
              </h1>
              <p className="text-sm text-slate-500">
                Track and manage maintenance tickets across all machines
              </p>
            </header>

            <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Ticket Board
                  </p>
                  <p className="text-xs text-slate-500">
                    Drag tickets between columns to update status
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
                    <span className="text-slate-400">Severity</span>
                    <select
                      value={severityFilter}
                      onChange={(event) =>
                        onSeverityFilterChange(
                          event.target.value as
                            | "All"
                            | "Error"
                            | "Warning"
                            | "Resolved",
                        )
                      }
                      className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                    >
                      {["All", "Error", "Warning", "Resolved"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
                    <span className="text-slate-400">Machine</span>
                    <select
                      value={machineFilter}
                      onChange={(event) =>
                        onMachineFilterChange(event.target.value)
                      }
                      className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                    >
                      {[
                        "All",
                        ...Array.from(
                          new Set(
                            allTickets.map((t) => t.machine).filter(Boolean),
                          ),
                        ),
                      ].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-500">
                    <span>Total</span>
                    <span className="font-semibold text-slate-800">
                      {allTickets.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onNewTicketOpenChange(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" /> New Ticket
                  </button>
                </div>
              </div>

              {/* Pagination controls */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
                  <span className="text-slate-400">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white px-3 py-1 font-semibold text-slate-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <span className="text-slate-500">
                    Page <span className="font-semibold text-slate-800">{page}</span> of
                    <span className="font-semibold text-slate-800"> {Math.max(1, Math.ceil(total / pageSize))}</span>
                  </span>
                  <button
                    onClick={() => onPageChange(Math.min(Math.max(1, Math.ceil(total / pageSize)), page + 1))}
                    disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
                    className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white px-3 py-1 font-semibold text-slate-600 disabled:opacity-50"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <KanbanBoard
                tickets={tickets}
                onSelectTicket={(id) => {
                  onSelectTicket(id);
                  onTicketModalChange(true);
                }}
                onStatusChange={onStatusChange}
              />
            </div>
          </div>
        </div>

        {/* Ticket Detail Modal */}
        <TicketModal
          ticket={selectedTicket}
          open={ticketModalOpen}
          onOpenChange={onTicketModalChange}
          onStatusChange={onStatusChange}
          onAssign={onAssign}
          onSeverityChange={onSeverityChange}
          onAddNote={onAddNote}
          onDelete={onDeleteTicket}
          collaborators={collaborators}
          machines={machines}
          onUpdateFields={onUpdateFields}
        />
      </div>
    );
  }

  if (activeNav === "apps") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
            <AppsView />
          </div>
        </div>
      </div>
    );
  }

  if (activeNav === "settings") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
            <SettingsView />
          </div>
        </div>
      </div>
    );
  }

  // Fallback view
  return null;
}

function OverviewPage({ machines }: { machines: Machine[] }) {
  return (
    <>
      <header className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
          Dashboard Overview
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Your Intelligence Platform
        </h1>
        <p className="text-sm text-slate-500">
          Monitor and manage all your assets and applications
        </p>
      </header>

      {/* Machine Monitoring Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Machine Monitoring
          </h2>
          <span className="text-sm text-slate-500">
            {machines.length} machines
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      </div>

      {/* Coming Soon Products */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Security Monitoring
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Real-time threat detection and endpoint protection
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            <Sparkles className="h-3 w-3" /> Coming Soon
          </div>
        </div>
        <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-amber-50/50 to-white p-6 shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            App Performance Monitoring
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Track latency, errors, and uptime across services
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
            <Sparkles className="h-3 w-3" /> Coming Soon
          </div>
        </div>
      </div>
    </>
  );
}

function MachineCard({ machine }: { machine: Machine }) {
  return (
    <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md transition hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{machine.name}</h3>
          <p className="text-xs text-slate-500">{machine.location}</p>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase",
            machine.status === "Online"
              ? "bg-emerald-100 text-emerald-700"
              : machine.status === "Warning"
                ? "bg-amber-100 text-amber-700"
                : machine.status === "Error"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-500",
          )}
        >
          {machine.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-purple-50/50 px-3 py-2">
          <p className="text-slate-500">Health</p>
          <p className="font-semibold text-slate-900">
            {machine.healthScore}/100
          </p>
        </div>
        <div className="rounded-xl bg-purple-50/50 px-3 py-2">
          <p className="text-slate-500">Uptime</p>
          <p className="font-semibold text-slate-900">{machine.uptime}</p>
        </div>
      </div>
    </div>
  );
}

function AssetSelectionView({
  profiles,
  machines,
  onSelect,
}: {
  profiles: AssetProfile[];
  machines: Machine[];
  onSelect: (profileId: string, machineId: string) => void;
}) {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const profileMachines = selectedProfile
    ? machines.filter((m) => m.profileId === selectedProfile)
    : [];

  return (
    <>
      <header className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
              Machine Monitoring
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Select an Asset
            </h1>
          </div>
        </div>
      </header>

      {/* Step 1: Select Asset Profile */}
      <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-900">
          1. Choose Asset Profile
        </h2>
        <p className="text-sm text-slate-500">
          Select a profile containing your assets
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfile(profile.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                selectedProfile === profile.id
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-purple-200 bg-white hover:border-purple-300 hover:shadow-sm",
              )}
            >
              <p className="font-semibold text-slate-900">{profile.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {profile.description}
              </p>
              <p className="mt-2 text-xs text-purple-600">
                {profile.assetIds.length} assets
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Asset */}
      {selectedProfile && (
        <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">
            2. Choose Asset
          </h2>
          <p className="text-sm text-slate-500">
            Select the machine you want to view
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profileMachines.map((machine) => (
              <button
                key={machine.id}
                onClick={() => onSelect(selectedProfile, machine.id)}
                className="rounded-2xl border border-purple-200 bg-white p-4 text-left transition hover:border-purple-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {machine.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {machine.location}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      machine.status === "Online"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {machine.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-purple-600">
                  View Dashboard →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ComingSoonView({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[600px] items-center justify-center rounded-3xl border border-purple-100 bg-white/80 p-12 shadow-lg backdrop-blur">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
          <Icon className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-4 text-lg text-slate-600">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-6 py-3 text-sm font-semibold text-purple-600">
          <Sparkles className="h-4 w-4" />
          Coming Soon
        </div>
        <p className="mt-6 text-sm text-slate-400">
          This feature is under development and will be available in a future
          release.
        </p>
      </div>
    </div>
  );
}
function MachineDetailView({
  machine,
  tickets,
  kpis,
  charts,
  notifications,
  profiles,
  machines,
  selectedProfileId,
  selectedMachineId,
  onProfileChange,
  onMachineChange,
}: {
  machine: Machine;
  tickets: TicketRow[];
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  notifications: NotificationItem[];
  profiles: AssetProfile[];
  machines: Machine[];
  selectedProfileId: string | null;
  selectedMachineId: string | null;
  onProfileChange: (profileId: string) => void;
  onMachineChange: (machineId: string) => void;
}) {
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const profileMachines = selectedProfileId
    ? machines.filter((m) => m.profileId === selectedProfileId)
    : [];

  // Real-time telemetry data state
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const channelsPerPage = 6;

  // Pagination state for Recent Tickets
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsPageSize, setTicketsPageSize] = useState(5);

  // Fetch telemetry data from API
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(`/api/telemetry?machineId=${machine.id}&channels=14&points=30`);
        const data = await response.json();
        setTelemetryData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch telemetry:", error);
        setIsLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [machine.id]);

  // Pagination logic
  const totalPages = telemetryData
    ? Math.ceil(telemetryData.channels.length / channelsPerPage)
    : 0;
  const paginatedChannels = telemetryData
    ? telemetryData.channels.slice(
        currentPage * channelsPerPage,
        (currentPage + 1) * channelsPerPage
      )
    : [];

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Update machine health score with telemetry data
  const displayHealthScore = telemetryData?.overallHealthScore ?? machine.healthScore;

  // Paginate tickets
  const totalTickets = tickets.length;
  const totalTicketPages = Math.max(1, Math.ceil(totalTickets / ticketsPageSize));
  const paginatedTickets = tickets.slice(
    (ticketsPage - 1) * ticketsPageSize,
    ticketsPage * ticketsPageSize
  );

  return (
    <>
      <header className="space-y-4 rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg backdrop-blur">
        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple-600">
            <Gauge className="h-4 w-4" /> Machine Monitoring
          </div>
          <div className="relative">
            <select
              value={selectedProfileId || ""}
              onChange={(e) => onProfileChange(e.target.value)}
              className="rounded-full border border-purple-200 bg-white px-4 py-2 pr-8 text-sm font-medium text-slate-700 shadow-sm transition hover:border-purple-300 focus:border-purple-400 focus:outline-none"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <div className="relative">
            <select
              value={selectedMachineId || ""}
              onChange={(e) => onMachineChange(e.target.value)}
              className="rounded-full border border-purple-200 bg-white px-4 py-2 pr-8 text-sm font-medium text-slate-700 shadow-sm transition hover:border-purple-300 focus:border-purple-400 focus:outline-none"
            >
              {profileMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Machine Info */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              {machine.name}
            </h1>
            <p className="text-sm text-slate-500">
              {machine.location} · Updated {machine.lastSync} ·{" "}
              {machine.protocol} · Health {displayHealthScore}/100
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-600 shadow-sm">
            <Bell className="h-4 w-4" /> Notifications
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-600 shadow-sm">
            <Clock className="h-4 w-4" /> Last sync {machine.lastSync}
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        {/* Live health score KPI */}
        <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Health score
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-2xl font-semibold text-slate-900">
              {displayHealthScore}
            </span>
            <span className="text-sm text-slate-400">/100</span>
          </div>
          <DeltaLabel tone={displayHealthScore > 85 ? "positive" : displayHealthScore > 70 ? "warning" : "critical"}>
            {telemetryData ? "Live" : "Loading..."}
          </DeltaLabel>
        </div>
        
        {kpis.filter((kpi) => kpi.id !== "health-score").map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {kpi.label}
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-2xl font-semibold text-slate-900">
                {kpi.value}
              </span>
              {kpi.suffix && (
                <span className="text-sm text-slate-400">{kpi.suffix}</span>
              )}
            </div>
            {kpi.delta && <DeltaLabel tone={kpi.tone}>{kpi.delta}</DeltaLabel>}
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {/* Real-time Charts Section with Pagination */}
          <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Real-Time Sensor Channels
                </h3>
                <p className="text-sm text-slate-500">
                  Live telemetry with upper/lower bounds · Auto-refresh every 3s
                </p>
              </div>
              {!isLoading && telemetryData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full border transition",
                      currentPage === 0
                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                        : "border-purple-200 text-purple-600 hover:bg-purple-50"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full border transition",
                      currentPage === totalPages - 1
                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                        : "border-purple-200 text-purple-600 hover:bg-purple-50"
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            )}

            {!isLoading && telemetryData && (
              <div className="grid gap-4 md:grid-cols-2">
                {paginatedChannels.map((channel: any) => (
                  <RealTimeChart key={channel.channelId} channel={channel} />
                ))}
              </div>
            )}
          </div>

          {/* Multi-Channel Analysis */}
          {!isLoading && telemetryData && (
            <MultiChannelChart channels={telemetryData.channels} />
          )}

          {/* Recent Tickets for this machine */}
          <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Recent Tickets
                </p>
                <p className="text-xs text-slate-500">
                  Maintenance issues for this machine
                </p>
              </div>
              {totalTickets > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
                  <span className="text-xs text-slate-400">Per page</span>
                  <select
                    value={ticketsPageSize}
                    onChange={(e) => {
                      setTicketsPageSize(Number(e.target.value));
                      setTicketsPage(1);
                    }}
                    className="rounded border-none bg-transparent px-1 text-xs text-slate-600 focus:outline-none"
                  >
                    {[3, 5, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {paginatedTickets.length > 0 ? (
                paginatedTickets.map((ticket) => (
                  <div
                    key={ticket.related}
                    className="rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">
                          {ticket.summary}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {ticket.workorder} · {ticket.owner}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase",
                          ticket.severity === "Error"
                            ? "bg-rose-100 text-rose-700"
                            : ticket.severity === "Resolved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {ticket.severity}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-purple-200 bg-white px-4 py-3 text-center text-xs text-slate-400">
                  No tickets for this machine
                </p>
              )}
            </div>
            {totalTickets > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-purple-100 pt-4">
                <button
                  onClick={() => setTicketsPage(Math.max(1, ticketsPage - 1))}
                  disabled={ticketsPage <= 1}
                  className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" /> Prev
                </button>
                <span className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-800">{ticketsPage}</span> of{" "}
                  <span className="font-semibold text-slate-800">{totalTicketPages}</span>
                  {" "}·{" "}
                  <span className="font-semibold text-slate-800">{totalTickets}</span> total
                </span>
                <button
                  onClick={() => setTicketsPage(Math.min(totalTicketPages, ticketsPage + 1))}
                  disabled={ticketsPage >= totalTicketPages}
                  className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
            <p className="text-sm font-semibold text-slate-800">
              Notifications
            </p>
            <p className="text-xs text-slate-500">
              Recent alerts from orchestration agent
            </p>
            <div className="mt-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={cn(
                        "mt-0.5 h-5 w-5",
                        notification.tone === "critical" && "text-rose-500",
                        notification.tone === "positive" && "text-emerald-500",
                        notification.tone === "neutral" && "text-purple-400",
                      )}
                    />
                    <div>
                      <p className="font-semibold text-slate-800">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {notification.body}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-purple-500">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

function TicketModal({
  ticket,
  open,
  onOpenChange,
  onStatusChange,
  onAssign,
  onSeverityChange,
  onAddNote,
  onDelete,
  collaborators,
  machines,
  onUpdateFields,
}: {
  ticket: TicketRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (related: string, status: TicketStatus) => void;
  onAssign: (related: string, owner: string) => void;
  onSeverityChange: (related: string, severity: TicketRow["severity"]) => void;
  onAddNote: (related: string, author: string, body: string) => void;
  onDelete: (related: string) => void;
  collaborators: Collaborator[];
  machines: Machine[];
  onUpdateFields: (related: string, updates: Partial<TicketRow>) => void;
}) {
  const [noteDraft, setNoteDraft] = useState("");
  const [ownerDraft, setOwnerDraft] = useState("");
  const [severityLevelDraft, setSeverityLevelDraft] = useState<TicketRow["severityLevel"]>(ticket?.severityLevel ?? "High");
  const [alertCategoryDraft, setAlertCategoryDraft] = useState<TicketRow["alertCategory"]>(ticket?.alertCategory ?? (ticket?.severity === "Error" ? "Error" : "Warning"));
  const [alertDateTimeDraft, setAlertDateTimeDraft] = useState<string>("");
  const [predictedRootCauseDraft, setPredictedRootCauseDraft] = useState<string>("");
  const [confidenceLevelDraft, setConfidenceLevelDraft] = useState<number>(ticket?.confidenceLevel ?? 85);
  const [assetMacDraft, setAssetMacDraft] = useState<string>(ticket?.assetMacAddress ?? "");
  const [alertDescriptionDraft, setAlertDescriptionDraft] = useState<string>(ticket?.alertDescription ?? "");
  const [remediationStepsDraft, setRemediationStepsDraft] = useState<string>(ticket?.remediationSteps ?? "");

  useEffect(() => {
    if (ticket) {
      setOwnerDraft(ticket.owner);
      setNoteDraft(ticket.note ?? "");
      setSeverityLevelDraft(ticket.severityLevel ?? "High");
      setAlertCategoryDraft(ticket.alertCategory ?? (ticket.severity === "Error" ? "Error" : "Warning"));
      setAlertDateTimeDraft(ticket.alertDateTime ?? new Date().toISOString().slice(0,16));
      setPredictedRootCauseDraft(ticket.predictedRootCause ?? "");
      setConfidenceLevelDraft(ticket.confidenceLevel ?? 85);
      setAssetMacDraft(ticket.assetMacAddress ?? "");
      setAlertDescriptionDraft(ticket.alertDescription ?? "");
      setRemediationStepsDraft(ticket.remediationSteps ?? "");
    } else {
      setOwnerDraft("");
      setNoteDraft("");
      setSeverityLevelDraft("High");
      setAlertCategoryDraft("Warning");
      setAlertDateTimeDraft("");
      setPredictedRootCauseDraft("");
      setConfidenceLevelDraft(85);
      setAssetMacDraft("");
      setAlertDescriptionDraft("");
      setRemediationStepsDraft("");
    }
  }, [ticket]);

  if (!ticket) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {ticket.summary}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                {ticket.workorder} · Ticket #{ticket.related}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full border border-purple-100 p-2 text-slate-400 transition hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                onDelete(ticket.related);
                onOpenChange(false);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600 hover:bg-rose-100"
            >
              Delete ticket
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-4 py-3">
                <span className="font-semibold text-slate-700">Status</span>
                <select
                  value={ticket.status}
                  onChange={(event) =>
                    onStatusChange(
                      ticket.related,
                      event.target.value as TicketStatus,
                    )
                  }
                  className="min-w-0 max-w-[160px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  {(
                    [
                      "New",
                      "Diagnosing",
                      "In Progress",
                      "On Hold",
                      "Resolved",
                    ] as TicketStatus[]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-4 py-3">
                <span className="font-semibold text-slate-700">Owner</span>
                <select
                  value={ownerDraft}
                  onChange={(e) => {
                    setOwnerDraft(e.target.value);
                    onAssign(ticket.related, e.target.value);
                  }}
                  className="min-w-0 flex-1 max-w-[200px] rounded-full border border-purple-100 bg-white px-3 py-2 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  {collaborators.map((c) => (
                    <option key={c.email} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-4 py-3">
                <span className="font-semibold text-slate-700">Alert Category</span>
                <select
                  value={alertCategoryDraft ?? (ticket.severity === "Error" ? "Error" : "Warning")}
                  onChange={(e) => {
                    const cat = (e.target.value as TicketRow["alertCategory"]) ?? "Warning";
                    setAlertCategoryDraft(cat);
                    // keep legacy severity in sync for chips
                    const sev: TicketRow["severity"] = cat === "Error" ? "Error" : "Warning";
                    onSeverityChange(ticket.related, sev);
                    onUpdateFields(ticket.related, { alertCategory: cat });
                  }}
                  className="min-w-0 max-w-[160px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  {(["Error", "Warning"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-3 py-2">
                <span className="font-semibold text-slate-700 shrink-0">
                  Severity level
                </span>
                <select
                  value={severityLevelDraft}
                  onChange={(event) => {
                    const lvl = event.target.value as TicketRow["severityLevel"];
                    setSeverityLevelDraft(lvl);
                    onUpdateFields(ticket.related, { severityLevel: lvl });
                  }}
                  className="min-w-0 max-w-[160px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  {(["Low", "Medium", "High", "Very High"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-3 py-2">
                <span className="font-semibold text-slate-700 shrink-0">Machine</span>
                <select
                  value={ticket.machine ?? ""}
                  onChange={(event) => onUpdateFields(ticket.related, { machine: event.target.value || undefined })}
                  className="min-w-0 max-w-[160px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-3 py-2">
                <span className="font-semibold text-slate-700 shrink-0">Alert date/time</span>
                <input
                  type="datetime-local"
                  value={alertDateTimeDraft}
                  onChange={(e) => {
                    setAlertDateTimeDraft(e.target.value);
                    onUpdateFields(ticket.related, { alertDateTime: e.target.value });
                  }}
                  className="min-w-0 max-w-[200px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-semibold text-slate-700">Alert description</p>
              <textarea
                value={alertDescriptionDraft}
                onChange={(e) => {
                  setAlertDescriptionDraft(e.target.value);
                  onUpdateFields(ticket.related, { alertDescription: e.target.value });
                }}
                placeholder="Describe the alert details (separate from context)"
                rows={3}
                className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
              />

              <p className="font-semibold text-slate-700">Most recent note (context)</p>
              <p className="rounded-2xl border border-purple-100 bg-purple-50/30 px-4 py-3 text-slate-600 break-words">
                {ticket.note ?? "No context added yet."}
              </p>
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Add context for operators and planners"
                rows={3}
                className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (!noteDraft.trim()) return;
                  onAddNote(ticket.related, "John", noteDraft.trim());
                  setNoteDraft("");
                }}
                className="w-full inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
              >
                Save note
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-semibold text-slate-700">Predicted root cause</p>
              <input
                value={predictedRootCauseDraft}
                onChange={(e) => {
                  setPredictedRootCauseDraft(e.target.value);
                  onUpdateFields(ticket.related, { predictedRootCause: e.target.value });
                }}
                placeholder="e.g., Coolant pump wear"
                className="w-full rounded-2xl border border-purple-100 bg-white px-4 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Confidence level</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={confidenceLevelDraft}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setConfidenceLevelDraft(v);
                      onUpdateFields(ticket.related, { confidenceLevel: v });
                    }}
                    className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Asset MAC</span>
                  <input
                    value={assetMacDraft}
                    onChange={(e) => {
                      setAssetMacDraft(e.target.value);
                      onUpdateFields(ticket.related, { assetMacAddress: e.target.value });
                    }}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
                  />
                </label>
              </div>
              <p className="font-semibold text-slate-700">Remediation steps taken</p>
              <textarea
                value={remediationStepsDraft}
                onChange={(e) => {
                  setRemediationStepsDraft(e.target.value);
                  onUpdateFields(ticket.related, { remediationSteps: e.target.value });
                }}
                placeholder="Document any steps or mitigations performed"
                rows={3}
                className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
              />

              <p className="font-semibold text-slate-700">Timeline</p>
              <div className="max-h-60 space-y-3 overflow-y-auto">
                {ticket.timeline?.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-purple-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-purple-500">
                      <span className="truncate">{entry.author}</span>
                      <span className="shrink-0">{entry.timestamp}</span>
                    </div>
                    <p className="mt-2 text-slate-600 break-words">
                      {entry.body}
                    </p>
                  </div>
                ))}
                {!ticket.timeline?.length && (
                  <p className="rounded-2xl border border-dashed border-purple-200 bg-white px-4 py-3 text-center text-slate-400">
                    No updates yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AppsView() {
  return (
    <div className="flex min-h-[600px] items-center justify-center rounded-3xl border border-purple-100 bg-white/80 p-12 shadow-lg backdrop-blur">
      <div className="text-center">
        <AppWindow className="mx-auto h-16 w-16 text-purple-300" />
        <h1 className="mt-6 text-4xl font-semibold text-slate-900">
          Coming Soon
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          The Apps marketplace is under development.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Connect third-party integrations and extend your workflow.
        </p>
      </div>
    </div>
  );
}

function NewTicketModal({
  open,
  onOpenChange,
  onCreate,
  collaborators,
  machines,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    summary: string;
    owner: string;
    machine?: string;
    note?: string;
    alertCategory: TicketRow["alertCategory"];
    severityLevel: TicketRow["severityLevel"];
    alertDateTime?: string;
    predictedRootCause?: string;
    confidenceLevel?: number;
    assetMacAddress?: string;
    alertDescription?: string;
    remediationSteps?: string;
  }) => void;
  collaborators: Collaborator[];
  machines: Machine[];
}) {
  const [summary, setSummary] = useState("");
  const [owner, setOwner] = useState("");
  const [machine, setMachine] = useState("");
  const [note, setNote] = useState("");
  const [alertCategory, setAlertCategory] = useState<TicketRow["alertCategory"]>("Warning");
  const [severityLevel, setSeverityLevel] = useState<TicketRow["severityLevel"]>("High");
  const [alertDateTime, setAlertDateTime] = useState<string>(new Date().toISOString().slice(0,16));
  const [predictedRootCause, setPredictedRootCause] = useState<string>("");
  const [confidenceLevel, setConfidenceLevel] = useState<number>(85);
  const [assetMacAddress, setAssetMacAddress] = useState<string>("");
  const [alertDescription, setAlertDescription] = useState<string>("");
  const [remediationSteps, setRemediationSteps] = useState<string>("");

  useEffect(() => {
    if (!owner && collaborators.length > 0) setOwner(collaborators[0].name);
  }, [collaborators, owner]);

  const reset = () => {
    setSummary("");
    setOwner(collaborators[0]?.name ?? "");
    setMachine("");
    setNote("");
    setAlertCategory("Warning");
    setSeverityLevel("High");
    setAlertDateTime(new Date().toISOString().slice(0,16));
    setPredictedRootCause("");
    setConfidenceLevel(85);
    setAssetMacAddress("");
    setAlertDescription("");
    setRemediationSteps("");
  };

  const submit = () => {
    if (!summary.trim()) return;
    onCreate({
      summary: summary.trim(),
      owner: owner || "Unassigned",
      machine: machine || undefined,
      note: note || undefined,
      alertCategory,
      severityLevel,
      alertDateTime,
      predictedRootCause: predictedRootCause || undefined,
      confidenceLevel,
      assetMacAddress: assetMacAddress || undefined,
      alertDescription: alertDescription || undefined,
      remediationSteps: remediationSteps || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w/full max-w-lg max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-purple-100 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">New Ticket</Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">Create a ticket that will persist in server memory.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full border border-purple-100 p-2 text-slate-400 transition hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <label className="space-y-1">
              <span className="text-slate-600">Summary</span>
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Issue summary"
                className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-slate-600">Alert Category</span>
                <select
                  value={alertCategory}
                  onChange={(e) => setAlertCategory(e.target.value as TicketRow["alertCategory"])}
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                >
                  {(["Error", "Warning"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">Severity level</span>
                <select
                  value={severityLevel}
                  onChange={(e) => setSeverityLevel(e.target.value as TicketRow["severityLevel"])}
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                >
                  {(["Low", "Medium", "High", "Very High"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-slate-600">Owner</span>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                >
                  {collaborators.map((c) => (
                    <option key={c.email} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">Machine</span>
                <select
                  value={machine}
                  onChange={(e) => setMachine(e.target.value)}
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-slate-600">Alert date/time</span>
                <input
                  type="datetime-local"
                  value={alertDateTime}
                  onChange={(e) => setAlertDateTime(e.target.value)}
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">Confidence level</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-slate-600">Predicted root cause</span>
                <input
                  value={predictedRootCause}
                  onChange={(e) => setPredictedRootCause(e.target.value)}
                  placeholder="e.g., Coolant pump wear"
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">Asset MAC</span>
                <input
                  value={assetMacAddress}
                  onChange={(e) => setAssetMacAddress(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-slate-600">Alert description</span>
              <textarea
                value={alertDescription}
                onChange={(e) => setAlertDescription(e.target.value)}
                placeholder="Describe the alert details (separate from context)"
                rows={3}
                className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-600">Remediation steps taken</span>
              <textarea
                value={remediationSteps}
                onChange={(e) => setRemediationSteps(e.target.value)}
                placeholder="Document any steps or mitigations performed"
                rows={3}
                className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-600">Context note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional context for operators and planners"
                rows={3}
                className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
              />
            </label>

            <button
              onClick={submit}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              Create ticket
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SettingsView() {
  const [companyName, setCompanyName] = useState("Factory Operations Inc.");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);

  return (
    <>
      <header className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
          Account Settings
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Manage your workspace configuration and preferences
        </p>
      </header>

      <div className="space-y-6">
        {/* Company Settings */}
        <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Company Information
          </h2>
          <p className="text-sm text-slate-500">
            Update your company profile and branding
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700">
              Save Changes
            </button>
          </div>
        </div>

        {/* Plan Details */}
        <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Subscription Plan
          </h2>
          <p className="text-sm text-slate-500">
            Your current plan and usage details
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-purple-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Professional Plan
                  </p>
                  <p className="text-xs text-slate-500">
                    $499/month · Billed annually
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">Machines</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    3 / 10
                  </p>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">API Credits</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    8.2K / 50K
                  </p>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">Users</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    4 / 25
                  </p>
                </div>
              </div>
            </div>
            <button className="inline-flex items-center justify-center rounded-full border border-purple-600 bg-white px-6 py-2 text-sm font-semibold text-purple-600 shadow-sm hover:bg-purple-50">
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Notification Preferences
          </h2>
          <p className="text-sm text-slate-500">
            Choose how you want to receive alerts and updates
          </p>
          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between rounded-2xl bg-purple-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Email Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Receive alerts via email at john@factory.com
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-5 w-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl bg-purple-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Slack Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Send alerts to your Slack workspace
                </p>
              </div>
              <input
                type="checkbox"
                checked={slackNotifications}
                onChange={(e) => setSlackNotifications(e.target.checked)}
                className="h-5 w-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl bg-purple-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  SMS Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Get critical alerts via text message
                </p>
              </div>
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="h-5 w-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: ApiStatus }) {
  const map: Record<ApiStatus, string> = {
    pending: "bg-slate-100 text-slate-500",
    running: "bg-purple-100 text-purple-600",
    success: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        map[status],
      )}
    >
      {status}
    </span>
  );
}

function DeltaLabel({
  tone,
  children,
}: {
  tone: DashboardKpi["tone"];
  children: ReactNode;
}) {
  const map: Record<DashboardKpi["tone"], string> = {
    positive: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-rose-100 text-rose-700",
    neutral: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={cn(
        "mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

function SummaryCard({ data }: { data: CollectedData }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-xs text-slate-600">
      <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
        Configuration summary
      </p>
      <dl className="mt-3 space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="w-32 text-slate-400">Email</dt>
          <dd className="flex-1 text-slate-700">{data.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="w-32 text-slate-400">Asset Name</dt>
          <dd className="flex-1 text-slate-700">{data.assetName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="w-32 text-slate-400">Connection Type</dt>
          <dd className="flex-1 text-slate-700">{data.connectionType}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="w-32 text-slate-400">Split Counter</dt>
          <dd className="flex-1 text-slate-700">{data.splitCounter} seconds</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="w-32 text-slate-400">Training Duration</dt>
          <dd className="flex-1 text-slate-700">{data.trainingSeconds} seconds</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="w-32 text-slate-400">Maintenance Cycle</dt>
          <dd className="flex-1 text-slate-700">{data.dtmn} days</dd>
        </div>
      </dl>
    </div>
  );
}

function KanbanBoard({
  tickets,
  onSelectTicket,
  onStatusChange,
}: {
  tickets: TicketRow[];
  onSelectTicket: (related: string) => void;
  onStatusChange: (related: string, status: TicketStatus) => void;
}) {
  const statusColumns: TicketStatus[] = [
    "New",
    "Diagnosing",
    "In Progress",
    "On Hold",
    "Resolved",
  ];

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter((ticket) => ticket.status === status);
  };

  const handleDragStart = (e: React.DragEvent, ticket: TicketRow) => {
    e.dataTransfer.setData("ticketId", ticket.related);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TicketStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("ticketId");
    const ticket = tickets.find((t) => t.related === ticketId);
    if (ticket && ticket.status !== newStatus) {
      onStatusChange(ticketId, newStatus);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((status) => {
        const columnTickets = getTicketsByStatus(status);
        return (
          <div
            key={status}
            className="min-w-[280px] flex-1 rounded-2xl border border-purple-100 bg-white/50 p-4"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{status}</h3>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                {columnTickets.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnTickets.map((ticket) => (
                <div
                  key={ticket.related}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ticket)}
                  onClick={() => onSelectTicket(ticket.related)}
                  className="cursor-move rounded-2xl border border-purple-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-purple-600">
                        {ticket.related}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-slate-800">
                        {ticket.summary}
                      </h4>
                      {ticket.machine && (
                        <p className="mt-2 text-xs text-slate-500">
                          <Gauge className="mr-1 inline h-3 w-3" />
                          {ticket.machine}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase",
                        ticket.severity === "Error"
                          ? "bg-rose-100 text-rose-700"
                          : ticket.severity === "Resolved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {ticket.severity}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-purple-100 pt-3 text-xs">
                    <span className="text-slate-500">{ticket.owner}</span>
                    <span className="text-slate-400">
                      {ticket.timestamp.split(" ")[0]}
                    </span>
                  </div>
                </div>
              ))}
              {columnTickets.length === 0 && (
                <div className="rounded-2xl border border-dashed border-purple-200 bg-white/50 p-4 text-center text-xs text-slate-400">
                  No tickets
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TicketWorkspace({
  tickets,
  allTickets,
  sortState,
  onSort,
  selectedTicket,
  onSelectTicket,
  statusFilter,
  severityFilter,
  machineFilter,
  ticketView,
  onStatusFilterChange,
  onSeverityFilterChange,
  onMachineFilterChange,
  onTicketViewChange,
  onStatusChange,
  onAssign,
  onSeverityChange,
  onAddNote,
  chatCollapsed,
  sidebarCollapsed,
}: {
  tickets: TicketRow[];
  allTickets: TicketRow[];
  sortState: SortState;
  onSort: (column: keyof TicketRow) => void;
  selectedTicket: TicketRow | null;
  onSelectTicket: (related: string) => void;
  statusFilter: TicketStatus | "All";
  severityFilter: "All" | "Error" | "Warning" | "Resolved";
  machineFilter: string;
  ticketView: "table" | "kanban";
  onStatusFilterChange: (value: TicketStatus | "All") => void;
  onSeverityFilterChange: (
    value: "All" | "Error" | "Warning" | "Resolved",
  ) => void;
  onMachineFilterChange: (value: string) => void;
  onTicketViewChange: (value: "table" | "kanban") => void;
  onStatusChange: (related: string, status: TicketStatus) => void;
  onAssign: (related: string, owner: string) => void;
  onSeverityChange: (related: string, severity: TicketRow["severity"]) => void;
  onAddNote: (related: string, author: string, body: string) => void;
  chatCollapsed: boolean;
  sidebarCollapsed: boolean;
  collaborators: Collaborator[];
  machines: Machine[];
  onUpdateFields: (related: string, updates: Partial<TicketRow>) => void;
}) {
  const statusOptions: (TicketStatus | "All")[] = [
    "All",
    "New",
    "Diagnosing",
    "In Progress",
    "On Hold",
    "Resolved",
  ];
  const severityOptions: ("All" | "Error" | "Warning" | "Resolved")[] = [
    "All",
    "Error",
    "Warning",
    "Resolved",
  ];
  const machineOptions = [
    "All",
    ...Array.from(new Set(allTickets.map((t) => t.machine).filter(Boolean))),
  ] as string[];

  return (
    <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Tickets workspace
          </p>
          <p className="text-xs text-slate-500">
            Manage escalations, assignments, and production readiness.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-600 bg-white px-3 py-1">
            <button
              onClick={() => onTicketViewChange("table")}
              className={cn(
                "rounded-full px-3 py-1 font-semibold transition",
                ticketView === "table"
                  ? "bg-purple-600 text-white"
                  : "text-purple-600 hover:bg-purple-50",
              )}
            >
              Table
            </button>
            <button
              onClick={() => onTicketViewChange("kanban")}
              className={cn(
                "rounded-full px-3 py-1 font-semibold transition",
                ticketView === "kanban"
                  ? "bg-purple-600 text-white"
                  : "text-purple-600 hover:bg-purple-50",
              )}
            >
              Kanban
            </button>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
            <span className="text-slate-400">Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as TicketStatus | "All")
              }
              className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
            <span className="text-slate-400">Severity</span>
            <select
              value={severityFilter}
              onChange={(event) =>
                onSeverityFilterChange(
                  event.target.value as
                    | "All"
                    | "Error"
                    | "Warning"
                    | "Resolved",
                )
              }
              className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
            <span className="text-slate-400">Machine</span>
            <select
              value={machineFilter}
              onChange={(event) => onMachineFilterChange(event.target.value)}
              className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
            >
              {machineOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-500">
            <span>Total</span>
            <span className="font-semibold text-slate-800">
              {allTickets.length}
            </span>
          </div>
        </div>
      </div>

      {ticketView === "kanban" ? (
        <KanbanBoard
          tickets={tickets}
          onSelectTicket={onSelectTicket}
          onStatusChange={onStatusChange}
        />
      ) : (
        <div
          className={cn(
            "mt-4 grid gap-6 transition-all",
            chatCollapsed && sidebarCollapsed
              ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
              : chatCollapsed || sidebarCollapsed
                ? "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]",
          )}
        >
          <div className="overflow-hidden rounded-2xl border border-purple-100 min-w-0">
            <table className="min-w-full divide-y divide-purple-100 text-left text-sm">
              <thead className="bg-purple-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {(
                    [
                      { key: "timestamp", label: "Timestamp" },
                      { key: "workorder", label: "Workorder ID" },
                      { key: "summary", label: "Summary" },
                      { key: "related", label: "Ticket" },
                      { key: "status", label: "Status" },
                      { key: "severity", label: "Severity" },
                      { key: "owner", label: "Owner" },
                    ] as { key: keyof TicketRow; label: string }[]
                  ).map((column) => (
                    <th
                      key={column.key}
                      className="cursor-pointer px-4 py-3"
                      onClick={() => onSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {sortState.column === column.key && (
                          <ChevronRight
                            className={cn(
                              "h-3 w-3 text-purple-500 transition",
                              sortState.direction === "asc"
                                ? "rotate-90"
                                : "-rotate-90",
                            )}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.workorder}
                    className={cn(
                      "cursor-pointer px-4 py-3 transition",
                      selectedTicket?.related === ticket.related
                        ? "bg-purple-50/80"
                        : "odd:bg-white even:bg-purple-50/40 hover:bg-purple-50/60",
                    )}
                    onClick={() => onSelectTicket(ticket.related)}
                  >
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {ticket.timestamp}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {ticket.workorder}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ticket.summary}
                    </td>
                    <td className="px-4 py-3 text-xs text-purple-600">
                      {ticket.related}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {ticket.status}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase",
                          ticket.severity === "Error"
                            ? "bg-rose-100 text-rose-700"
                            : ticket.severity === "Resolved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {ticket.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ticket.owner}</td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-xs text-slate-400"
                    >
                      No tickets match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="min-w-0">
            {selectedTicket && (
              <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-purple-600">
                      {selectedTicket.related}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-slate-800 truncate">
                      {selectedTicket.summary}
                    </h4>
                    {selectedTicket.machine && (
                      <p className="mt-2 text-xs text-slate-500">
                        <Gauge className="mr-1 inline h-3 w-3" />
                        {selectedTicket.machine}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase",
                      selectedTicket.severity === "Error"
                        ? "bg-rose-100 text-rose-700"
                        : selectedTicket.severity === "Resolved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {selectedTicket.severity}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-purple-100 pt-3 text-xs">
                  <span className="text-slate-500">{selectedTicket.owner}</span>
                  <span className="text-slate-400">{selectedTicket.timestamp.split(" ")[0]}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function applyUserInput(
  data: CollectedData,
  stepId: string,
  text: string,
): CollectedData {
  switch (stepId) {
    case "u1":
      // User provides email
      return { ...data, email: text.trim() };
    case "u2": {
      // User selects connection type (MQTT/OPC UA/Demo)
      // Parse the response to extract just the protocol name
      const response = text.trim().toLowerCase();
      let connectionType = "MQTT"; // default
      
      if (response.includes("opc") || response.includes("ua")) {
        connectionType = "OPC UA";
      } else if (response.includes("demo")) {
        connectionType = "Demo";
      } else if (response.includes("mqtt")) {
        connectionType = "MQTT";
      }
      
      return { ...data, connectionType };
    }
    case "u3":
      // User provides machine name
      return { ...data, assetName: text.trim() };
    case "u4":
      // User provides split counter
      return { ...data, splitCounter: text.trim() };
    case "u5":
      // User provides training seconds
      return { ...data, trainingSeconds: text.trim() };
    case "u6":
      // User provides days to maintenance
      return { ...data, dtmn: text.trim() };
    default:
      return data;
  }
}

function addDemoCollaborators(collaborators: Collaborator[]): Collaborator[] {
  const existing = new Set(collaborators.map((item) => item.email));
  const additions: Collaborator[] = [
    {
      name: "Jane",
      email: "jane@factory.com",
      role: "Operator",
      status: existing.has("jane@factory.com") ? "Active" : "Invited",
      verified: existing.has("jane@factory.com"),
    },
    {
      name: "Jake",
      email: "jake@factory.com",
      role: "Operator",
      status: existing.has("jake@factory.com") ? "Active" : "Invited",
      verified: existing.has("jake@factory.com"),
    },
  ];
  const filteredAdditions = additions.filter(
    (item) => !existing.has(item.email),
  );
  return [...collaborators, ...filteredAdditions];
}

function ShareModal({
  open,
  onOpenChange,
  collaborators,
  onAdd,
  onUpdateRole,
  onToggleVerified,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  collaborators: Collaborator[];
  onAdd: (payload: {
    name: string;
    email: string;
    role: Collaborator["role"];
    verified: boolean;
  }) => void;
  onUpdateRole: (email: string, role: Collaborator["role"]) => void;
  onToggleVerified: (email: string, verified: boolean) => void;
  onRemove: (email: string) => void;
}) {
  const [name, setName] = useState("Jane Operator");
  const [email, setEmail] = useState("jane@factory.com");
  const [role, setRole] = useState<Collaborator["role"]>("Operator");
  const [verified, setVerified] = useState(false);

  const handleAdd = () => {
    if (!email.trim()) return;
    onAdd({ name, email, role, verified });
    setName("Jane Operator");
    setEmail("jane@factory.com");
    setRole("Operator");
    setVerified(false);
  };

  const roleOptions: Collaborator["role"][] = [
    "Admin",
    "Manager",
    "Technician",
    "Operator",
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-purple-100 bg-white/95 p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <UsersRound className="h-5 w-5 text-purple-500" /> Share
                workspace
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                Invite maintenance teams, update permissions, and track
                verification status.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full border border-purple-100 p-2 text-slate-400 transition hover:text-slate-700">
                ×
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                Invite collaborator
              </p>
              <div className="grid gap-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  className="rounded-full border border-purple-100 bg-white px-3 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
                />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="rounded-full border border-purple-100 bg-white px-3 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as Collaborator["role"])
                    }
                    className="rounded-full border border-purple-100 bg-white px-3 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-2 text-xs font-semibold text-purple-600">
                    <input
                      type="checkbox"
                      checked={verified}
                      onChange={(event) => setVerified(event.target.checked)}
                      className="size-3"
                    />
                    Verified
                  </label>
                </div>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
                >
                  Send invite
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                Current access
              </p>
              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.email}
                    className="flex flex-col gap-3 rounded-2xl border border-purple-100 bg-white px-3 py-3 text-sm text-slate-600 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {collaborator.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {collaborator.email}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemove(collaborator.email)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <select
                        value={collaborator.role}
                        onChange={(event) =>
                          onUpdateRole(
                            collaborator.email,
                            event.target.value as Collaborator["role"],
                          )
                        }
                        className="rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                      >
                        {roleOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          onToggleVerified(
                            collaborator.email,
                            !collaborator.verified,
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase",
                          collaborator.verified
                            ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                            : "border border-amber-100 bg-amber-50 text-amber-600",
                        )}
                      >
                        {collaborator.verified
                          ? "Verified"
                          : "Awaiting Verification"}
                      </button>
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase text-purple-600">
                        {collaborator.status}
                      </span>
                    </div>
                  </div>
                ))}
                {!collaborators.length && (
                  <p className="rounded-2xl border border-dashed border-purple-200 bg-white px-3 py-3 text-xs text-slate-400">
                    No collaborators yet. Invite your maintenance and quality
                    teams.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function initialiseApiSteps(): ApiStep[] {
  return API_SEQUENCE.map((template) => ({
    ...template,
    status: "pending",
    time: "--",
  }));
}

function countRemainingSteps(currentIndex: number, flowType: 'mqtt' | 'demo' | null): number {
  const activeFlow = getActiveFlow(flowType);
  return Math.max(
    0,
    activeFlow.filter(
      (step, index) => index >= currentIndex && step.author === "user",
    ).length,
  );
}

function truncateText(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}
