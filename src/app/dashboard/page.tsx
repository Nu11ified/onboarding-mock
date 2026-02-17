"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Activity,
  AlertCircle,
  AppWindow,
  Bell,
  Check,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Loader2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  Trash2,
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
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDashboardOnboarding } from "@/hooks/useDashboardOnboarding";
import {
  EmailFormWidget,
  UserInvitationWidget,
  NotificationPreferencesWidget,
  DeviceStatusWidget,
  MqttConnectionInfoWidget,
  ProfileSelectionWidget,
  ProfileConfigFormWidget,
  MachineDetailsFormWidget,
} from "@/components/onboarding";
import { SMSConsentPopup } from "@/components/SMSConsentPopup";
import { VideoPopup } from "@/components/widgets/VideoPopup";
import { VideoWidget } from "@/components/widgets/VideoWidget";
import { InfoPopupButton } from "@/components/widgets/InfoPopupButton";
import { RightPanelButton } from "@/components/widgets/RightPanelButton";
import { InfoGridWidget } from "@/components/widgets/InfoGridWidget";
import { ChannelConfigurationWidget } from "@/components/widgets/ChannelConfigurationWidget";
import { LoginButtonWidget } from "@/components/widgets/LoginButtonWidget";
import { RestartOnboardingWidget } from "@/components/widgets/RestartOnboardingWidget";
import {
  RightSidePanelProvider,
  useRightSidePanel,
} from "@/components/widgets/RightSidePanelContext";
import { RightSidePanel } from "@/components/widgets/RightSidePanel";
import { StatusPanel } from "@/components/widgets/StatusPanel";

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
  { key: "view-machine", label: "Assets", icon: Gauge },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "settings", label: "Settings", icon: Settings },
];

const THREADS = ["MI Onboarding", "Torque Press 4", "Fleet Ops"];

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

type NavKey =
  | "overview"
  | "view-machine"
  | "machines"
  | "security"
  | "apm"
  | "tickets"
  | "projects"
  | "apps"
  | "settings";

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

type Project = {
  id: string;
  name: string;
  color: string; // Tailwind color name: "red", "blue", "green", "amber", "purple", "pink"
  isDefault: boolean;
  autoFilter?: {
    alertCategory?: ("Error" | "Warning")[];
  };
  ticketIds: string[];
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

type ChatEntry = {
  id: string;
  author: "user" | "assistant";
  name: string;
  role: string;
  text: string;
  timestamp: string;
  attachment?: ReactNode;
};

// Onboarding Chat Input Component
function OnboardingChatInput({
  onSend,
  isProcessing,
}: {
  onSend: (text: string) => Promise<void>;
  isProcessing: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (input.trim() && !isProcessing) {
      await onSend(input);
      setInput("");
    }
  };

  return (
    <div className="border-t border-purple-100 p-4">
      <div className="space-y-3">
        <div className="relative flex items-center gap-2">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-200 text-purple-500 hover:bg-purple-50"
            title="Quick actions"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-purple-200 px-3 text-xs font-medium text-purple-600 hover:bg-purple-50"
            title="Attach files"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim() && !isProcessing) {
                void handleSend();
              }
            }}
            placeholder="Ask AI"
            className="flex-1 rounded-full border border-purple-200 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
            disabled={isProcessing}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isProcessing}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold",
              input.trim() && !isProcessing
                ? "border-purple-600 bg-purple-600 text-white hover:bg-purple-700"
                : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
          >
            Send
          </button>
        </div>
        {/* LLM Disclaimer */}
        <p className="text-[11px] text-slate-400 text-center mt-1">
          LLM based systems can hallucinate! Try again if you don&apos;t get the desired response.
        </p>
      </div>
    </div>
  );
}

// Onboarding Content Area Component
function OnboardingContentArea() {
  return (
    <main className="flex-1 flex items-center justify-center px-12 py-16">
      <div className="max-w-2xl">
        <div className="mb-8 inline-flex rounded-2xl bg-purple-100 p-4">
          <Gauge className="h-12 w-12 text-purple-600" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-slate-900">
          Add a new device
        </h1>
        <p className="mb-8 text-lg text-slate-600">
          Get started by adding your machine to the platform
        </p>

        <div className="mb-12 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">How it works</h2>
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 flex-shrink-0">
                1
              </div>
              <p className="text-sm text-slate-600 pt-1">
                Choose between a demo device or configure your own machine
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 flex-shrink-0">
                2
              </div>
              <p className="text-sm text-slate-600 pt-1">
                Configure your machine profile with cycle time and maintenance
                schedule
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 flex-shrink-0">
                3
              </div>
              <p className="text-sm text-slate-600 pt-1">
                Connect to our broker and start streaming telemetry data
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 flex-shrink-0">
                4
              </div>
              <p className="text-sm text-slate-600 pt-1">
                Train the anomaly detection model and activate monitoring
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 px-6 py-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-purple-700">
              ← Use the chat on the left
            </span>{" "}
            to begin the onboarding process
          </p>
        </div>
      </div>
    </main>
  );
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-alerts",
    name: "Alerts",
    color: "red",
    isDefault: true,
    autoFilter: { alertCategory: ["Error", "Warning"] },
    ticketIds: [],
  },
  {
    id: "proj-general",
    name: "General",
    color: "blue",
    isDefault: true,
    ticketIds: [],
  },
];

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { panel: rightPanel, isOpen: rightPanelOpen, openPanel, closePanel } =
    useRightSidePanel();

  // New onboarding system
  const {
    messages: onboardingMessages,
    isProcessing: onboardingProcessing,
    isActive: onboardingActive,
    currentStep: onboardingStep,
    handleUserInput: handleOnboardingInput,
    getCurrentWidget,
    getContext: getOnboardingContext,
    addMessage: addOnboardingMessage,
  } = useDashboardOnboarding();

  // Handler for video widget submission
  const handleVideoSubmit = useCallback((data: { url: string; title: string; description: string }) => {
    // Add assistant message with the video widget (no text, just the widget)
    addOnboardingMessage(
      'assistant',
      '',
      {
        type: 'video-widget',
        data: {
          url: data.url,
          title: data.title,
          description: data.description,
        },
      }
    );
  }, [addOnboardingMessage]);

  // Check URL params early to set initial state correctly
  const scenarioParam = searchParams.get("scenario");
  const onboardedParam = searchParams.get("onboarded");
  const showDashboard = searchParams.get("showDashboard");
  const autoSelectMachine = searchParams.get("autoSelectMachine");

  console.log("🚀 Dashboard initializing with params:", {
    onboarded: onboardedParam,
    showDashboard,
    autoSelectMachine,
    scenario: scenarioParam,
  });

  // Initialize activeNav - default to 'overview' for new users, or based on params
  const [activeNav, setActiveNav] = useState<NavKey>(
    autoSelectMachine === "true" ? "machines" : "overview",
  );
  const [chatCollapsed, setChatCollapsed] = useState<boolean>(false);
  const [chatWidth, setChatWidth] = useState<number>(380);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [chatOverlay, setChatOverlay] = useState<boolean>(false);
  const [chatMaximized, setChatMaximized] = useState<boolean>(false);
  const chatScrollTopRef = useRef<number>(0);
  const DOCK_MAX = 420; // px threshold where chat snaps from docked to overlay mode
  const chatResizeRef = useRef<{ startX: number; startWidth: number }>({
    startX: 0,
    startWidth: 0,
  });
  const [activeThread, setActiveThread] = useState<number>(0);
  const chatSidebarRef = useRef<ChatSidebarHandle | null>(null);
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
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    NotificationItemWithRead[]
  >(DASHBOARD_NOTIFICATIONS.map((n) => ({ ...n, isRead: false })));
  const [showSMSConsent, setShowSMSConsent] = useState(false);
  const [smsConsentRequiresPhone, setSmsConsentRequiresPhone] = useState(false);

  // Pagination state for Tickets view
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const testTicketRef = useRef<TicketRow | null>(null);

  // If the chat is closed, also close any open right-side help panel
  useEffect(() => {
    if (chatCollapsed) {
      closePanel();
    }
  }, [chatCollapsed, closePanel]);

  // Auto-open the right-side help panel as soon as a "View …" info button appears in chat.
  const autoOpenedRef = useRef<Set<string>>(new Set());
  const seededAutoOpenRef = useRef(false);
  const hasPersistedChatHistoryRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (hasPersistedChatHistoryRef.current !== null) return;
    try {
      const raw = localStorage.getItem('dashboard_chat_messages');
      if (!raw) {
        hasPersistedChatHistoryRef.current = false;
        return;
      }
      const parsed = JSON.parse(raw);
      hasPersistedChatHistoryRef.current = Array.isArray(parsed) && parsed.length > 0;
    } catch {
      hasPersistedChatHistoryRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (chatCollapsed) return;

    // If we restored chat history from localStorage, treat the current list as "history" and do NOT
    // auto-open panels from it (prevents wrong panel on /onboarding -> /dashboard).
    if (
      !seededAutoOpenRef.current &&
      hasPersistedChatHistoryRef.current === true &&
      onboardingMessages.length > 0
    ) {
      seededAutoOpenRef.current = true;
      for (const m of onboardingMessages as any[]) {
        if (m?.actor === 'assistant' && m?.id) {
          autoOpenedRef.current.add(m.id);
        }
      }
    }

    const unwrapInfoPayload = (node: any): any => {
      let p = node;
      for (let i = 0; i < 5; i++) {
        if (!p || typeof p !== 'object') return {};
        if ('infoType' in p || 'buttonText' in p || 'title' in p || 'content' in p) return p;
        if (p.data && typeof p.data === 'object') {
          p = p.data;
          continue;
        }
        break;
      }
      return p || {};
    };

    const panelFromWidget = (w: any) => {
      if (!w) return null;
      if (w.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
        for (const child of w.data.widgets) {
          const candidate = panelFromWidget(child);
          if (candidate) return candidate;
        }
      }
      if (w.type === 'right-panel-button') {
        const p = w?.data || {};
        const panelType = p?.panelType;
        if (
          panelType !== 'machine-config-help' &&
          panelType !== 'channel-config-help' &&
          panelType !== 'mqtt-setup' &&
          panelType !== 'health-metrics' &&
          panelType !== 'agentic-workflow' &&
          panelType !== 'what-can-i-do-next'
        ) {
          return null;
        }
        return {
          type: panelType,
          title: p?.title,
          data: p?.content,
        };
      }
      if (w.type === 'info-popup-button') {
        const payload = unwrapInfoPayload(w);

        const inferInfoType = (t?: string, b?: string) => {
          const s = `${t || ''} ${b || ''}`.toLowerCase();
          if (s.includes('mqtt')) return 'mqtt-setup';
          if (s.includes('channel')) return 'channel-config-help';
          if (s.includes('parameter') || s.includes('machine configuration') || s.includes('machine parameter')) {
            return 'machine-config-help';
          }
          if (s.includes('metrics') || s.includes('health score') || s.includes('dashboard metrics')) {
            return 'health-metrics';
          }
          if (s.includes('agentic workflow') || s.includes('agentic') || s.includes('workflow')) {
            return 'agentic-workflow';
          }
          if (s.includes('what can i do next') || s.includes('what can i do')) {
            return 'what-can-i-do-next';
          }
          return null;
        };

        const infoType =
          payload?.infoType || inferInfoType(payload?.title, payload?.buttonText);
        if (
          infoType !== 'machine-config-help' &&
          infoType !== 'channel-config-help' &&
          infoType !== 'mqtt-setup' &&
          infoType !== 'health-metrics' &&
          infoType !== 'agentic-workflow' &&
          infoType !== 'what-can-i-do-next'
        ) {
          return null;
        }
        return {
          type: infoType,
          title: payload?.title,
          data: payload?.content,
        };
      }
      return null;
    };

    // First priority: if a metrics-explanation widget appears, always open it.
    // This ensures that when the "View Metrics Explanation" message arrives after
    // /onboarding -> /dashboard, it takes over the right panel (even if something
    // like channel-config-help was previously auto-opened).
    for (let i = onboardingMessages.length - 1; i >= 0; i--) {
      const msg: any = onboardingMessages[i];
      if (!msg || msg.actor !== 'assistant') continue;
      if (!msg.id) continue;
      if (autoOpenedRef.current.has(msg.id)) continue;

      const nextPanel = panelFromWidget(msg.widget);
      if (nextPanel?.type === 'health-metrics') {
        openPanel(nextPanel as any);
        autoOpenedRef.current.add(msg.id);
        return;
      }
    }

    // Default: open the most recent supported panel.
    for (let i = onboardingMessages.length - 1; i >= 0; i--) {
      const msg: any = onboardingMessages[i];
      if (!msg || msg.actor !== 'assistant') continue;
      if (!msg.id) continue;
      if (autoOpenedRef.current.has(msg.id)) continue;

      const nextPanel = panelFromWidget(msg.widget);
      if (nextPanel) {
        openPanel(nextPanel as any);
        autoOpenedRef.current.add(msg.id);
        break;
      }
    }
  }, [chatCollapsed, onboardingMessages, openPanel]);

  // URL params are now read at the top of the component

  // Check URL params for SMS consent popup
  const smsConsentParam = searchParams.get("smsConsent");

  // Check if user just completed onboarding - do this BEFORE other effects
  useEffect(() => {
    if (onboardedParam === "true") {
      // Chat should be visible for post-onboarding flow
      setChatCollapsed(false);

      const onboardingData = localStorage.getItem("onboarding_complete");
      if (onboardingData) {
        const data = JSON.parse(onboardingData);
        console.log("✅ Onboarding completed:", data);

        // Clear the flags
        localStorage.removeItem("onboarding_complete");
      }

      // DISABLED: SMS consent popup after onboarding/password setup
      // Always show SMS consent popup after onboarding/password setup
      // Default to requiring phone number for new users
      // Small delay to let the dashboard render first
      // setTimeout(() => {
      //   setSmsConsentRequiresPhone(true); // New users need to enter phone
      //   setShowSMSConsent(true);
      // }, 1000);
    }
  }, [onboardedParam]);

  // Handle SMS consent URL param (for manually triggering the popup)
  useEffect(() => {
    if (smsConsentParam === "true") {
      // User has phone number on file - just show yes/no
      setSmsConsentRequiresPhone(false);
      setShowSMSConsent(true);
    } else if (smsConsentParam === "new") {
      // User needs to enter phone number
      setSmsConsentRequiresPhone(true);
      setShowSMSConsent(true);
    }
  }, [smsConsentParam]);

  // Auto-select newly onboarded machine
  useEffect(() => {
    // Only run this if autoSelectMachine flag is set and we have machines
    if (autoSelectMachine === "true" && machines.length > 0) {
      console.log("🔍 Auto-selecting machine...");
      console.log(
        "Available machines:",
        machines.map((m) => ({
          id: m.id,
          name: m.name,
          profileId: m.profileId,
        })),
      );

      const onboardingState = localStorage.getItem("onboarding_state");
      if (onboardingState) {
        try {
          const state = JSON.parse(onboardingState);
          console.log("Onboarding state:", state);

          if (state.deviceId) {
            // Try to find the machine by deviceId
            const newMachine = machines.find((m) => m.id === state.deviceId);
            if (newMachine) {
              setSelectedMachineId(newMachine.id);
              // Also select the correct profile for this machine
              if (newMachine.profileId) {
                setSelectedProfileId(newMachine.profileId);
              }
              console.log(
                "✅ Auto-selected machine:",
                newMachine.id,
                "Name:",
                newMachine.name,
                "Profile:",
                newMachine.profileId,
              );
              console.log("🎯 ActiveNav should be: machines");
            } else {
              // Fallback: select the first available machine (Injection Molding Machine)
              const defaultMachine =
                machines.find((m: Machine) => m.id === "m456") || machines[0];
              setSelectedMachineId(defaultMachine.id);
              if (defaultMachine.profileId) {
                setSelectedProfileId(defaultMachine.profileId);
              }
              console.log(
                "✅ Fallback - Auto-selected default machine:",
                defaultMachine.id,
                "Name:",
                defaultMachine.name,
              );
            }
          }
        } catch (error) {
          console.error("Failed to parse onboarding state:", error);
        }
      } else {
        // No onboarding state, just select the demo machine
        console.log("No onboarding state found, selecting demo machine...");
        const defaultMachine =
          machines.find((m: Machine) => m.id === "m456") || machines[0];
        setSelectedMachineId(defaultMachine.id);
        if (defaultMachine.profileId) {
          setSelectedProfileId(defaultMachine.profileId);
        }
        console.log(
          "✅ No onboarding state - Auto-selected demo machine:",
          defaultMachine.id,
          "Name:",
          defaultMachine.name,
        );
      }
    }
  }, [autoSelectMachine, machines]);

  const readJsonSafe = useCallback(async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      // Surface a useful error but don't throw a SyntaxError from res.json()
      throw new Error(text.slice(0, 200));
    }
  }, []);

  // Load asset profiles, machines and tickets from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load asset profiles
        const profilesRes = await fetch("/api/machines?type=profiles");
        const profilesData: any = await readJsonSafe(profilesRes);
        if (profilesData.profiles) {
          setAssetProfiles(profilesData.profiles);
          // Select first profile by default
          if (profilesData.profiles.length > 0 && !selectedProfileId) {
            setSelectedProfileId(profilesData.profiles[0].id);
          }
        }

        // Load all machines
        const machinesRes = await fetch("/api/machines");
        const machinesData: any = await readJsonSafe(machinesRes);
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
        const stateData: any = await readJsonSafe(stateRes);
        if (stateData.state?.collaborators) {
          setCollaborators(stateData.state.collaborators);
        } else {
          setCollaborators(INITIAL_COLLABORATORS);
        }
        if (
          Array.isArray(stateData.state?.tickets) &&
          stateData.state.tickets.length > 0
        ) {
          setTickets(stateData.state.tickets);
          if (!selectedTicketId) {
            setSelectedTicketId(stateData.state.tickets[0].related);
          }
        } else {
          // Fallback to default tickets API if state has none
          const ticketsRes = await fetch("/api/tickets");
          const ticketsData: any = await readJsonSafe(ticketsRes);
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
  }, [readJsonSafe, selectedMachineId, selectedTicketId]);

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

  // Filter tickets by selected project
  const projectFilteredTickets = useMemo(() => {
    if (!selectedProjectId) return sortedTickets; // "All Tickets"
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return sortedTickets;
    const idSet = new Set(project.ticketIds);
    return sortedTickets.filter((t) => idSet.has(t.workorder));
  }, [sortedTickets, selectedProjectId, projects]);

  // When filters or total change, ensure we are on a valid page
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredTickets.length / pageSize),
    );
    if (page > totalPages) {
      setPage(1);
    }
  }, [filteredTickets.length, pageSize]);

  // Auto-assign tickets to projects when tickets load
  useEffect(() => {
    if (tickets.length === 0) return;

    setProjects((prev) => {
      // Only auto-assign tickets that aren't already in any project
      const assignedIds = new Set(prev.flatMap((p) => p.ticketIds));
      const unassigned = tickets.filter((t) => !assignedIds.has(t.workorder));
      if (unassigned.length === 0) return prev;

      const updated = prev.map((p) => ({ ...p, ticketIds: [...p.ticketIds] }));
      for (const ticket of unassigned) {
        const alertProject = updated.find(
          (p) =>
            p.autoFilter?.alertCategory &&
            ticket.alertCategory &&
            p.autoFilter.alertCategory.includes(ticket.alertCategory),
        );
        if (alertProject) {
          alertProject.ticketIds.push(ticket.workorder);
        } else {
          const general = updated.find((p) => p.id === "proj-general");
          if (general) general.ticketIds.push(ticket.workorder);
        }
      }
      return updated;
    });
  }, [tickets]);

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

  const handleSort = (column: keyof TicketRow) => {
    setSortState((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "desc" };
    });
  };

  const handleToggleChat = () => {
    // Preserve scroll before toggling visibility
    chatScrollTopRef.current = getChatScrollTop();
    setChatCollapsed((prev) => !prev);
    if (chatCollapsed) {
      // When re-opening, default to docked mode if width is small
      setChatOverlay(chatWidth > DOCK_MAX);
    }
  };

  const getChatScrollTop = () => {
    return chatSidebarRef.current?.getScrollTop() ?? 0;
  };

  const startChatResize = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsResizing(true);
    chatResizeRef.current = { startX: e.clientX, startWidth: chatWidth };
    // Attach listeners on window to track mouse movements outside the handle
    window.addEventListener("mousemove", handleChatResizeMove);
    window.addEventListener("mouseup", stopChatResize);
  };

  const handleChatResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const delta = e.clientX - chatResizeRef.current.startX;
    const maxWidth = Math.max(300, window.innerWidth - 80);
    const next = Math.min(
      Math.max(chatResizeRef.current.startWidth + delta, 300),
      maxWidth,
    );
    // Capture scroll before a potential layout switch (dock <-> overlay)
    chatScrollTopRef.current =
      chatSidebarRef.current?.getScrollTop() ?? chatScrollTopRef.current;
    setChatWidth(next);
    setChatOverlay(next > DOCK_MAX);
  };

  const stopChatResize = () => {
    setIsResizing(false);
    // Snap overlay mode based on final width
    setChatOverlay((prev) => chatWidth > DOCK_MAX);
    window.removeEventListener("mousemove", handleChatResizeMove);
    window.removeEventListener("mouseup", stopChatResize);
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

  const handleTicketAssign = useCallback(
    (related: string, owner: string) => {
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
    },
    [collaborators],
  );

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

  const generateId = (prefix: string) =>
    `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

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
        const legacySeverity: TicketRow["severity"] =
          payload.alertCategory ?? "Warning";
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
        const updated = prev.map((t) =>
          t.related === related ? { ...t, ...updates } : t,
        );
        void saveState(collaborators, updated);
        return updated;
      });
    },
    [collaborators],
  );

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const handleThreadChange = (index: number) => {
    setActiveThread(index);
  };

  const renderOnboardingWidget = useCallback(
    (widgetDef: any) => {
      const context = getOnboardingContext();

      const render = (def: any): React.ReactNode => {
        if (!def) return null;

        switch (def.type) {
        case "profile-selection-form":
          return (
            <ProfileSelectionWidget
              onSelectExisting={async (
                profileKey: string,
                profileName: string,
              ) => {
                await handleOnboardingInput({
                  profileKey,
                  profileConfig: {
                    profileName,
                    trainingSeconds: 200,
                    daysToMaintenance: 30,
                    cycleDuration: 20,
                  },
                });
              }}
              onCreateNew={async () => {
                await handleOnboardingInput({
                  profileKey: null,
                  profileConfig: null,
                });
              }}
            />
          );

        case "email-form":
          return (
            <EmailFormWidget
              initialEmail={widgetDef.data?.initialEmail}
              label={widgetDef.data?.label}
              helperText={widgetDef.data?.helperText}
              submitLabel={widgetDef.data?.submitLabel}
              onSubmit={async (email: string) => {
                await handleOnboardingInput({ email });
              }}
            />
          );

        case "profile-config-form":
          return (
            <ProfileConfigFormWidget
              onSubmit={async (config: any) => {
                await handleOnboardingInput({ profileConfig: config });
              }}
            />
          );

        case "device-status-widget":
          return context.deviceId ? (
            <DeviceStatusWidget
              deviceId={context.deviceId}
              status="spawning"
              onComplete={() => {
                console.log("✅ Device spawn complete");
                handleOnboardingInput({ deviceStatus: "active" });
              }}
            />
          ) : null;

        case "mqtt-connection-info":
          return context.mqttConnection ? (
            <MqttConnectionInfoWidget connection={context.mqttConnection} />
          ) : null;

        case "user-invitation-form":
          return (
            <UserInvitationWidget
              onSubmit={async (users) => {
                await handleOnboardingInput({ invitedUsers: users });
              }}
            />
          );

        case "notification-preferences-form":
          return (
            <NotificationPreferencesWidget
              onConfirm={async (enabled) => {
                await handleOnboardingInput({ notificationsEnabled: enabled });
              }}
            />
          );

        case "video-widget":
          return (
            <VideoWidget
              url={widgetDef.data?.url || ''}
              title={widgetDef.data?.title || 'Video'}
              description={widgetDef.data?.description}
            />
          );

        case "info-grid":
          return (
            <InfoGridWidget
              title={widgetDef.data?.title}
              description={widgetDef.data?.description}
              fields={widgetDef.data?.fields || []}
            />
          );

        case "view-dashboard-button":
          return (
            <button
              onClick={() => {
                chatScrollTopRef.current = getChatScrollTop();
                setChatCollapsed(true);
                setChatMaximized(false);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
            >
              <LayoutDashboard className="h-4 w-4" />
              View Dashboard
            </button>
          );

        case "right-panel-button": {
          const extractPayload = (input: any) => {
            let p = input;
            for (let i = 0; i < 5; i++) {
              if (!p || typeof p !== 'object') return {};
              if ('panelType' in p || 'buttonText' in p || 'title' in p || 'content' in p) return p;
              if (p.data && typeof p.data === 'object') {
                p = p.data;
                continue;
              }
              return p;
            }
            return p || {};
          };

          const p: any = extractPayload(def);
          if (!p?.panelType) return null;
          return (
            <RightPanelButton
              panelType={p.panelType}
              title={p.title || 'Information'}
              buttonText={p.buttonText}
              data={p.content}
            />
          );
        }

        case "info-popup-button": {
          const extractPayload = (input: any) => {
            let p = input;
            for (let i = 0; i < 5; i++) {
              if (!p || typeof p !== 'object') return {};
              if ('infoType' in p || 'buttonText' in p || 'title' in p || 'content' in p) {
                return p;
              }
              if (p.data && typeof p.data === 'object') {
                p = p.data;
                continue;
              }
              return p;
            }
            return p || {};
          };

          const payload: any = extractPayload(widgetDef);

          const inferInfoType = (t?: string, b?: string) => {
            const s = `${t || ''} ${b || ''}`.toLowerCase();
            if (s.includes('mqtt')) return 'mqtt-setup';
            if (s.includes('channel')) return 'channel-config-help';
            if (s.includes('parameter') || s.includes('machine configuration') || s.includes('machine parameter')) {
              return 'machine-config-help';
            }
            if (s.includes('metrics') || s.includes('health score') || s.includes('dashboard metrics')) {
              return 'health-metrics';
            }
            return null;
          };

          const infoType =
            payload?.infoType ||
            inferInfoType(payload?.title, payload?.buttonText) ||
            'custom';

          const defaultButtonTextForType = (it: string) => {
            if (it === 'channel-config-help') return 'View Channel Configuration Info';
            if (it === 'machine-config-help') return 'View Parameter Configuration Info';
            if (it === 'mqtt-setup') return 'View MQTT Configuration Info';
            if (it === 'health-metrics') return 'What are the metrics?';
            return 'View Details';
          };

          const rawButtonText = payload?.buttonText;
          const buttonText =
            rawButtonText && rawButtonText !== 'View Details'
              ? rawButtonText
              : defaultButtonTextForType(infoType);

          return (
            <InfoPopupButton
              type={infoType}
              title={payload?.title || 'Information'}
              buttonText={buttonText}
              data={payload?.content}
            />
          );
        }

        case "machine-details-form":
          return (
            <MachineDetailsFormWidget
              onSubmit={async (details) => {
                await handleOnboardingInput({ machineDetails: details });
              }}
            />
          );

        case "channel-configuration-widget":
          return (
            <ChannelConfigurationWidget
              onSubmit={async (mapping) => {
                await handleOnboardingInput({ channelMapping: mapping });
              }}
            />
          );

        case "login-button-widget":
          return (
            <LoginButtonWidget
              buttonText={widgetDef.data?.buttonText || 'Resend Email'}
              url={widgetDef.data?.url || '/reset'}
              message={widgetDef.data?.message}
              onSubmit={() => {
                console.log('Login button clicked');
              }}
            />
          );

        case "restart-onboarding-widget":
          return (
            <RestartOnboardingWidget
              message={widgetDef.data?.message}
              onRestart={() => {
                console.log('Restarting onboarding...');
              }}
            />
          );

        case "widget-stack": {
          const widgets = def.data?.widgets;
          if (!Array.isArray(widgets) || widgets.length === 0) return null;
          return (
            <div className="space-y-3">
              {widgets.map((w: any, idx: number) => (
                <div key={w?.type ? `${w.type}-${idx}` : idx}>{render(w)}</div>
              ))}
            </div>
          );
        }

        default:
          return null;
      }
    };

    return render(widgetDef);
    },
    [getOnboardingContext, handleOnboardingInput],
  );

  const handleSMSConsent = (consent: boolean, phoneNumber?: string) => {
    console.log(
      "SMS consent:",
      consent,
      phoneNumber ? `Phone: ${phoneNumber}` : "",
    );
    // Consent is already stored in localStorage by the popup component
    // Optionally send to backend here
  };

  return (
    <>
      <SMSConsentPopup
        isOpen={showSMSConsent}
        onClose={() => setShowSMSConsent(false)}
        onConsent={handleSMSConsent}
        requirePhoneNumber={smsConsentRequiresPhone}
        forceOtpVerification={smsConsentParam === "true" || smsConsentParam === "new"}
      />
      <div className="relative flex h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 text-slate-900">
        <Sidebar
          active={activeNav}
          onSelect={(key) => {
            setActiveNav(key);
          }}
          collapsed={sidebarCollapsed}
          isMobile={isMobile}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <TopBar
            onToggleChat={handleToggleChat}
            chatCollapsed={chatCollapsed}
            onToggleSidebar={() => {
              if (isMobile) {
                setMobileSidebarOpen((prev) => !prev);
              } else {
                setSidebarCollapsed((prev) => !prev);
              }
            }}
            sidebarCollapsed={sidebarCollapsed}
            onOpenShare={() => setShareOpen(true)}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />
          <div className="relative flex-1 overflow-hidden">
            {/* Mobile: Fullscreen right panel overlay (Task 4) */}
            {isMobile && rightPanel && (
              <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-white flex flex-col">
                <div className="flex items-center justify-between border-b border-purple-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">Details</p>
                  <button
                    onClick={closePanel}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple-50 text-slate-500"
                    aria-label="Close panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <RightSidePanel
                    panel={rightPanel}
                    className="h-full"
                  />
                </div>
              </div>
            )}

            {/* Mobile: Fullscreen chat overlay (Task 3) */}
            {isMobile && !chatCollapsed && (
              <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-white flex flex-col">
                <ChatSidebar
                  ref={chatSidebarRef}
                  messages={onboardingMessages}
                  threads={THREADS}
                  activeThread={activeThread}
                  onSelectThread={handleThreadChange}
                  onSendCustom={async (text: string) => {
                    await handleOnboardingInput(text);
                  }}
                  onVideoSubmit={handleVideoSubmit}
                  isDashboard
                  isOnboarding={true}
                  onboardingProcessing={onboardingProcessing}
                  renderWidget={renderOnboardingWidget}
                  fullWidth
                  isMaximized={false}
                  rightPanelOpen={rightPanelOpen}
                  onToggleRightPanel={() => closePanel()}
                  onToggleMaximize={() => {}}
                  onClose={() => {
                    chatScrollTopRef.current = getChatScrollTop();
                    setChatCollapsed(true);
                    setChatMaximized(false);
                  }}
                  restoredScrollTop={chatScrollTopRef.current}
                />
              </div>
            )}

            {/* Mobile: show only dashboard content when chat is collapsed */}
            {isMobile && chatCollapsed && (
              <main className="h-full overflow-hidden relative">
                {/* Close button to go back to chat */}
                <button
                  onClick={() => setChatCollapsed(false)}
                  className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Back to chat"
                >
                  <X className="h-4 w-4" />
                </button>
                <DashboardMain
                  activeNav={activeNav}
                  collaborators={collaborators}
                  assetProfiles={assetProfiles}
                  machines={machines}
                  selectedProfileId={selectedProfileId}
                  selectedMachineId={selectedMachineId}
                  onProfileChange={(profileId) => {
                    setSelectedProfileId(profileId);
                    const profileMachines = machines.filter(
                      (m) => m.profileId === profileId,
                    );
                    if (profileMachines.length > 0) {
                      setSelectedMachineId(profileMachines[0].id);
                    }
                  }}
                  onMachineChange={setSelectedMachineId}
                  onSelect={(key) => {
                    setActiveNav(key);
                  }}
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
                  onPageSizeChange={(n) => {
                    setPageSize(n);
                    setPage(1);
                  }}
                  onboardingMessages={onboardingMessages}
                  onboardingProcessing={onboardingProcessing}
                  onHandleOnboardingInput={handleOnboardingInput}
                  renderOnboardingWidget={renderOnboardingWidget}
                />
              </main>
            )}

            {/* Desktop: Docked layout (chat consumes its own space) */}
            {!isMobile && !chatCollapsed && !chatOverlay ? (
              <div className="h-full min-h-0 flex relative">
                <div className="relative" style={{ width: `${chatWidth}px` }}>
                  <ChatSidebar
                    ref={chatSidebarRef}
                    messages={onboardingMessages}
                    threads={THREADS}
                    activeThread={activeThread}
                    onSelectThread={handleThreadChange}
                    onSendCustom={async (text: string) => {
                      await handleOnboardingInput(text);
                    }}
                    onVideoSubmit={handleVideoSubmit}
                    isDashboard
                    isOnboarding={true}
                    onboardingProcessing={onboardingProcessing}
                    renderWidget={renderOnboardingWidget}
                    fullWidth
                    isMaximized={false}
                    rightPanelOpen={rightPanelOpen}
                    onToggleRightPanel={() => closePanel()}
                    onToggleMaximize={() => {
                      // capture scroll, then maximize
                      chatScrollTopRef.current = getChatScrollTop();
                      setChatMaximized(true);
                    }}
                    restoredScrollTop={chatScrollTopRef.current}
                  />
                  {/* Resize Handle (docked) */}
                  <div
                    className={cn(
                      "absolute top-0 right-0 h-full w-1 cursor-ew-resize bg-transparent",
                      isResizing
                        ? "bg-purple-300/50"
                        : "hover:bg-purple-300/40",
                    )}
                    onMouseDown={startChatResize}
                    title="Resize (docked)"
                  />
                </div>

                {/* Right-side help panel (docked): only show when a specific panel is open */}
                {rightPanel && (
                  <div
                    className="absolute top-0 bottom-0 z-30 w-[440px] max-w-[calc(100vw-16px)] p-4"
                    style={{ left: `${chatWidth}px` }}
                  >
                    <RightSidePanel
                      panel={rightPanel}
                      onClose={closePanel}
                      className="h-full"
                    />
                  </div>
                )}

                <main className="h-full flex-1 overflow-hidden">
                  <DashboardMain
                    activeNav={activeNav}
                    collaborators={collaborators}
                    assetProfiles={assetProfiles}
                    machines={machines}
                    selectedProfileId={selectedProfileId}
                    selectedMachineId={selectedMachineId}
                    onProfileChange={(profileId) => {
                      setSelectedProfileId(profileId);
                      const profileMachines = machines.filter(
                        (m) => m.profileId === profileId,
                      );
                      if (profileMachines.length > 0) {
                        setSelectedMachineId(profileMachines[0].id);
                      }
                    }}
                    onMachineChange={setSelectedMachineId}
                    onSelect={(key) => {
                      setActiveNav(key);
                    }}
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
                    onPageSizeChange={(n) => {
                      setPageSize(n);
                      setPage(1);
                    }}
                    onboardingMessages={onboardingMessages}
                    onboardingProcessing={onboardingProcessing}
                    onHandleOnboardingInput={handleOnboardingInput}
                    renderOnboardingWidget={renderOnboardingWidget}
                  />
                </main>
              </div>
            ) : !isMobile ? (
              <main className="h-full overflow-hidden">
                <DashboardMain
                  activeNav={activeNav}
                  collaborators={collaborators}
                  assetProfiles={assetProfiles}
                  machines={machines}
                  selectedProfileId={selectedProfileId}
                  selectedMachineId={selectedMachineId}
                  onProfileChange={(profileId) => {
                    setSelectedProfileId(profileId);
                    const profileMachines = machines.filter(
                      (m) => m.profileId === profileId,
                    );
                    if (profileMachines.length > 0) {
                      setSelectedMachineId(profileMachines[0].id);
                    }
                  }}
                  onMachineChange={setSelectedMachineId}
                  onSelect={(key) => {
                    setActiveNav(key);
                  }}
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
                  onPageSizeChange={(n) => {
                    setPageSize(n);
                    setPage(1);
                  }}
                  onboardingMessages={onboardingMessages}
                  onboardingProcessing={onboardingProcessing}
                  onHandleOnboardingInput={handleOnboardingInput}
                  renderOnboardingWidget={renderOnboardingWidget}
                />
              </main>
            ) : null}

            {/* Desktop: Overlay layout (chat floats over content) */}
            {!isMobile && !chatCollapsed && chatOverlay && (
              <div
                className={cn(
                  "absolute top-16 left-0 bottom-0 z-40 shadow-2xl",
                )}
                style={{ width: `${chatWidth}px` }}
              >
                <ChatSidebar
                  ref={chatSidebarRef}
                  messages={onboardingMessages}
                  threads={THREADS}
                  activeThread={activeThread}
                  onSelectThread={handleThreadChange}
                  onSendCustom={async (text: string) => {
                    await handleOnboardingInput(text);
                  }}
                  onVideoSubmit={handleVideoSubmit}
                  isDashboard
                  isOnboarding={true}
                  onboardingProcessing={onboardingProcessing}
                  renderWidget={renderOnboardingWidget}
                  fullWidth
                  isMaximized={false}
                  rightPanelOpen={rightPanelOpen}
                  onToggleRightPanel={() => closePanel()}
                  onToggleMaximize={() => {
                    chatScrollTopRef.current = getChatScrollTop();
                    setChatMaximized(true);
                  }}
                  restoredScrollTop={chatScrollTopRef.current}
                />

                {/* Resize Handle (overlay) */}
                <div
                  className={cn(
                    "absolute top-0 right-0 h-full w-1 cursor-ew-resize bg-transparent",
                    isResizing ? "bg-purple-300/50" : "hover:bg-purple-300/40",
                  )}
                  onMouseDown={startChatResize}
                  title="Resize (overlay)"
                />
              </div>
            )}

            {/* Desktop: Right-side help panel (overlay): only show when a specific panel is open */}
            {!isMobile && !chatCollapsed && chatOverlay && !chatMaximized && rightPanel && (
              <div
                className="absolute top-16 bottom-0 z-40 w-[440px] max-w-[calc(100vw-16px)] p-4"
                style={{ left: `${chatWidth}px` }}
              >
                <RightSidePanel
                  panel={rightPanel}
                  onClose={closePanel}
                  className="h-full"
                />
              </div>
            )}

            {/* Desktop: Maximized chat overlay (full page) */}
            {!isMobile && !chatCollapsed && chatMaximized && (
              <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm">
                <div className="flex h-full min-h-0">
                  <div className="flex-1 min-w-0">
                    <ChatSidebar
                      ref={chatSidebarRef}
                      messages={onboardingMessages}
                      threads={THREADS}
                      activeThread={activeThread}
                      onSelectThread={handleThreadChange}
                      onSendCustom={async (text: string) => {
                        await handleOnboardingInput(text);
                      }}
                      onVideoSubmit={handleVideoSubmit}
                      isDashboard
                      isOnboarding={true}
                      onboardingProcessing={onboardingProcessing}
                      renderWidget={renderOnboardingWidget}
                      fullWidth
                      isMaximized
                      rightPanelOpen={rightPanelOpen}
                      onToggleRightPanel={() => closePanel()}
                      onToggleMaximize={() => {
                        // restore to minimized overlay or docked based on width
                        chatScrollTopRef.current = getChatScrollTop();
                        setChatMaximized(false);
                      }}
                      onClose={() => {
                        chatScrollTopRef.current = getChatScrollTop();
                        setChatCollapsed(true);
                        setChatMaximized(false);
                      }}
                      restoredScrollTop={chatScrollTopRef.current}
                    />
                  </div>

                  <div className="w-[440px] shrink-0 border-l border-purple-100 bg-white p-4">
                    {rightPanel ? (
                      <RightSidePanel
                        panel={rightPanel}
                        onClose={closePanel}
                        className="h-full"
                      />
                    ) : (
                      <StatusPanel
                        phase="welcome"
                        mode="demo"
                        videoConfig={{
                          url: "https://youtu.be/YQj_I-Zpx4Q",
                          title: "What you unlock with onboarding",
                          description:
                            "See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.",
                          duration: "5:30",
                        }}
                        className="h-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
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
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            </div>
            <p className="text-sm text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <RightSidePanelProvider>
        <DashboardPageContent />
      </RightSidePanelProvider>
    </Suspense>
  );
}

function Sidebar({
  active,
  onSelect,
  collapsed,
  isMobile,
  mobileOpen,
  onClose,
}: {
  active: NavKey;
  onSelect: (key: NavKey) => void;
  collapsed: boolean;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  // Mobile: hidden when closed, overlay when open
  if (isMobile) {
    if (!mobileOpen) return null;
    return (
      <div className="fixed inset-0 z-50" aria-label="Mobile navigation overlay">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        {/* Sidebar content */}
        <nav
          className="relative w-64 h-full bg-white flex flex-col px-3 py-4 shadow-xl"
          aria-label="Primary navigation"
        >
          {/* Logo Section */}
          <div className="flex items-center justify-between px-3 mb-8">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              width={100}
              height={28}
              className="h-7 w-auto"
            />
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-purple-50 text-slate-500"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 space-y-1">
            {SIDENAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const activeStyle = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelect(item.key);
                    onClose?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    activeStyle
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-purple-50 hover:text-purple-700",
                  )}
                  aria-current={activeStyle ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Section - User Profile Area */}
          <div className="mt-auto pt-4 border-t border-purple-100">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-semibold">
                D
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  Demo User
                </p>
                <p className="text-xs text-slate-500 truncate">
                  demo@microai.com
                </p>
              </div>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Desktop: existing behavior unchanged
  return (
    <nav
      className={cn(
        "flex flex-col border-r border-purple-100 bg-white/70 backdrop-blur transition-all",
        collapsed ? "w-[72px] px-2 py-4" : "w-60 px-3 py-4",
      )}
      aria-label="Primary navigation"
    >
      {/* Logo Section */}
      <div className="flex items-center px-3 mb-8">
        {!collapsed ? (
          <Image
            src="/microai-logo-dark.svg"
            alt="MicroAI"
            width={100}
            height={28}
            className="h-7 w-auto"
          />
        ) : (
          <div className="relative w-10 h-10 flex items-center justify-center">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 space-y-1">
        {SIDENAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const activeStyle = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                activeStyle
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-purple-50 hover:text-purple-700",
                collapsed && "justify-center",
              )}
              aria-current={activeStyle ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn("h-5 w-5", collapsed ? "" : "flex-shrink-0")}
              />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Section - User Profile Area (optional) */}
      {!collapsed && (
        <div className="mt-auto pt-4 border-t border-purple-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-semibold">
              D
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                Demo User
              </p>
              <p className="text-xs text-slate-500 truncate">
                demo@microai.com
              </p>
            </div>
          </div>
        </div>
      )}
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
    <header className="flex h-16 items-center justify-between border-b border-purple-100 bg-white/70 px-3 md:px-6 backdrop-blur">
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
          {chatCollapsed ? "Ask AI" : "Ask AI"}
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-100 bg-white text-purple-500"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
      {/* Right side intentionally left minimal for demo (no share/notifications) */}
    </header>
  );
}

type PromptTemplate = {
  id: string;
  name: string;
  description: string;
  content: string;
  category: "onboarding" | "line" | "bulk" | "custom";
};

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: "onboard-asset",
    name: "Onboard Single Asset",
    description: "Template for onboarding a single machine or asset",
    content:
      "I need to onboard a new asset with the following details:\nAsset Name: [name]\nConnection Type: [MQTT/OPC UA]\nSensors: [list]",
    category: "onboarding",
  },
  {
    id: "create-line",
    name: "Create Production Line",
    description: "Set up a new production line with multiple assets",
    content:
      "Create a production line:\nLine Name: [name]\nAssets: [list]\nSequence: [order]",
    category: "line",
  },
  {
    id: "bulk-add",
    name: "Bulk Asset Addition",
    description: "Add multiple assets at once",
    content:
      "Bulk add assets from:\nSource: [CSV/Excel file]\nColumns: [mapping]",
    category: "bulk",
  },
];

function renderMarkdownLite(text: string) {
  // Intentionally minimal: supports **bold** and treats \n as real line breaks.
  const renderInline = (line: string) => {
    const parts = line.split('**');
    if (parts.length === 1) return line;
    return parts.map((part, idx) =>
      idx % 2 === 1 ? (
        <strong key={`b-${idx}`} className="font-semibold text-slate-900">
          {part}
        </strong>
      ) : (
        <span key={`t-${idx}`}>{part}</span>
      ),
    );
  };

  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, idx) => (
        <span key={`l-${idx}`}>
          {renderInline(line)}
          {idx < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  );
}

function ChatBubble({ message }: { message: any }) {
  const actor = message?.actor || message?.author || "assistant";
  const text = message?.message || message?.text || "";
  return (
    <div className="group">
      <div className="flex items-start gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              actor === "assistant"
                ? "bg-purple-100 text-purple-700"
                : "bg-slate-800 text-white",
            )}
          >
            {actor === "assistant" ? "AI" : "YO"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-slate-700">
              {actor === "assistant" ? "Onboarding Copilot" : "You"}
            </p>
            <p className="text-xs text-slate-400">Just now</p>
          </div>
          {text && (
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div className="leading-relaxed">{renderMarkdownLite(text)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ChatSidebarHandle = {
  getScrollTop: () => number;
  setScrollTop: (n: number) => void;
};

const ChatSidebar = forwardRef<
  ChatSidebarHandle,
  {
    messages: any[];
    onSendCustom: (text: string) => void;
    onVideoSubmit?: (data: { url: string; title: string; description: string }) => void;
    threads: string[];
    activeThread: number;
    onSelectThread: (index: number) => void;
    isDashboard: boolean;
    isOnboarding?: boolean;
    onboardingProcessing?: boolean;
    renderWidget?: (widgetDef: any) => React.ReactNode;
    fullWidth?: boolean;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
    onClose?: () => void;
    restoredScrollTop?: number | null;
    rightPanelOpen?: boolean;
    onToggleRightPanel?: () => void;
  }
>(
  (
    {
      messages,
      onSendCustom,
      onVideoSubmit,
      threads,
      activeThread,
      onSelectThread,
      isDashboard,
      isOnboarding,
      onboardingProcessing,
      renderWidget,
      fullWidth,
      isMaximized,
      onToggleMaximize,
      onClose,
      restoredScrollTop,
      rightPanelOpen,
      onToggleRightPanel,
    },
    ref,
  ) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [threadSearchOpen, setThreadSearchOpen] = useState(false);
    const [threadSearch, setThreadSearch] = useState("");
    const [promptMenuOpen, setPromptMenuOpen] = useState(false);
    const [activeMenuSection, setActiveMenuSection] = useState<
      "templates" | "library"
    >("templates");
    const [savedPrompts, setSavedPrompts] =
      useState<PromptTemplate[]>(DEFAULT_PROMPTS);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [newPromptName, setNewPromptName] = useState("");
    const [newPromptContent, setNewPromptContent] = useState("");
    const [customInput, setCustomInput] = useState("");
    const [showVideoPopup, setShowVideoPopup] = useState(false);

    useEffect(() => {
      if (messagesEndRef.current && chatContainerRef.current) {
        // Scroll only the chat container, not the entire page
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }, [messages]);

    // Restore scroll position when provided
    useEffect(() => {
      if (typeof restoredScrollTop === "number" && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = restoredScrollTop;
      }
    }, [restoredScrollTop]);

    // Expose scroll helpers to parent
    useImperativeHandle(ref, () => ({
      getScrollTop: () => chatContainerRef.current?.scrollTop ?? 0,
      setScrollTop: (n: number) => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = n;
      },
    }));

    const filteredThreads = threads.filter((thread) =>
      thread.toLowerCase().includes(threadSearch.toLowerCase()),
    );

    const handleSavePrompt = () => {
      if (newPromptName.trim() && newPromptContent.trim()) {
        const newPrompt: PromptTemplate = {
          id: `custom-${Date.now()}`,
          name: newPromptName,
          description: "Custom prompt",
          content: newPromptContent,
          category: "custom",
        };
        setSavedPrompts([...savedPrompts, newPrompt]);
        setNewPromptName("");
        setNewPromptContent("");
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
          "h-full min-h-0 flex flex-col border-r border-purple-100 bg-white",
          fullWidth ? "w-full" : "w-[340px]",
        )}
        aria-label="Chat sidebar"
      >
        <div className="border-b border-purple-100 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Thread Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setThreadSearchOpen(!threadSearchOpen)}
                className="w-full flex items-center justify-between rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-left text-xs hover:bg-purple-100"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Clock className="h-3.5 w-3.5 text-purple-600" />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold text-slate-500 leading-none">
                      History
                    </span>
                    <span className="block text-xs font-semibold text-slate-800 truncate">
                      {threads[activeThread]}
                    </span>
                  </span>
                </span>
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
                          <div
                            key={thread}
                            className={cn(
                              "group w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                              activeThread === originalIndex
                                ? "bg-purple-100 text-purple-700 font-semibold"
                                : "text-slate-700 hover:bg-purple-50",
                            )}
                          >
                            <button
                              onClick={() => {
                                onSelectThread(originalIndex);
                                setThreadSearchOpen(false);
                                setThreadSearch("");
                              }}
                              className="flex-1 text-left truncate"
                            >
                              {thread}
                            </button>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-white border border-slate-200 shadow-lg">
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Delete functionality placeholder
                                    }}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="px-3 py-4 text-center text-xs text-slate-400">
                        No threads found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 flex-shrink-0"
              onClick={() => {
                // Create new thread logic
                alert("Create new thread functionality");
              }}
              title="Create new thread"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              {/* Remove close panel button - panel space is always reserved */}
              <button
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 flex-shrink-0"
                onClick={onToggleMaximize}
                title={isMaximized ? "Minimize chat" : "Maximize chat"}
                aria-label={isMaximized ? "Minimize chat" : "Maximize chat"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
              {isMaximized && (
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 text-slate-500 hover:bg-slate-50 flex-shrink-0"
                  onClick={onClose}
                  title="Close chat"
                  aria-label="Close chat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div
          ref={chatContainerRef}
          className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        >
          {isOnboarding
            ? // ✅ Render onboarding messages with widgets
              messages.map((msg: any, idx: number) => (
                <div key={`${msg.id}-${idx}`} className="group">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold",
                          msg.actor === "assistant"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-800 text-white",
                        )}
                      >
                        {msg.actor === "assistant" ? "AI" : "YO"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-700">
                          {msg.actor === "assistant"
                            ? "Onboarding Copilot"
                            : "You"}
                        </p>
                        <p className="text-xs text-slate-400">Just now</p>
                      </div>
                      {msg.message && (
                        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <div className="leading-relaxed">
                            {renderMarkdownLite(msg.message)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {msg.widget && msg.actor === "assistant" && renderWidget && (
                    <div className="ml-9 mt-2 max-w-[calc(100%-2.25rem)] overflow-x-auto">
                      {renderWidget(msg.widget)}
                    </div>
                  )}
                </div>
              ))
            : // Regular dashboard messages
              messages.map((message: any) => (
                <ChatBubble key={message.id} message={message} />
              ))}
          {onboardingProcessing && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl bg-slate-100 px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          {messages.length === 0 && !isOnboarding && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-slate-400 text-center max-w-[200px]">
                Start a conversation
              </p>
            </div>
          )}
          {messages.length === 0 && isOnboarding && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-8">
              <div className="mb-4 rounded-full bg-purple-100 p-4">
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Welcome to your Dashboard
              </h3>
              <p className="text-xs text-slate-500 text-center max-w-[240px]">
                Ask me anything! I can help you add machines, manage users,
                create tickets, and more.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-purple-100 p-4">
          <div className="space-y-3">
            {/* Input Area with Plus and Attach Buttons */}
            <div className="relative flex items-center gap-2">
              {/* Plus Button - Quick Actions & Prompt Library */}
              <div className="relative">
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-200 text-purple-500 hover:bg-purple-50"
                  onClick={() => {
                    setPromptMenuOpen(!promptMenuOpen);
                    setActiveMenuSection("templates");
                  }}
                  title="Quick actions & prompts"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {promptMenuOpen && (
                  <div className="absolute bottom-12 left-0 z-50 w-72 rounded-xl border border-purple-100 bg-white shadow-lg">
                    {/* Tab Headers */}
                    <div className="flex border-b border-purple-100">
                      <button
                        onClick={() => setActiveMenuSection("templates")}
                        className={cn(
                          "flex-1 p-3 text-xs font-semibold transition-colors",
                          activeMenuSection === "templates"
                            ? "text-purple-600 border-b-2 border-purple-600"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Quick Templates
                      </button>
                      <button
                        onClick={() => setActiveMenuSection("library")}
                        className={cn(
                          "flex-1 p-3 text-xs font-semibold transition-colors",
                          activeMenuSection === "library"
                            ? "text-purple-600 border-b-2 border-purple-600"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Prompt Library
                      </button>
                    </div>

                    {/* Quick Templates Section */}
                    {activeMenuSection === "templates" && (
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setCustomInput("Show me my device's health score");
                            setPromptMenuOpen(false);
                          }}
                          className="w-full rounded-lg p-3 text-left hover:bg-purple-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                              <Gauge className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                See My Device Health Score
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                View the operational health score of your
                                machines
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setCustomInput("Show me tickets for my machines");
                            setPromptMenuOpen(false);
                          }}
                          className="w-full rounded-lg p-3 text-left hover:bg-purple-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                See Tickets for My Machines
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Review maintenance tickets and service history
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setCustomInput(
                              "Show me predictive maintenance for my machine",
                            );
                            setPromptMenuOpen(false);
                          }}
                          className="w-full rounded-lg p-3 text-left hover:bg-purple-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                See Predictive Maintenance
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                View upcoming maintenance predictions and alerts
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setCustomInput(
                              "Monitor my machine's real-time telemetry data",
                            );
                            setPromptMenuOpen(false);
                          }}
                          className="w-full rounded-lg p-3 text-left hover:bg-purple-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                Monitor Real-Time Telemetry
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                View live sensor data and telemetry streams
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Prompt Library Section */}
                    {activeMenuSection === "library" && (
                      <>
                        <div className="max-h-80 overflow-y-auto p-2">
                          {savedPrompts.map((prompt) => (
                            <button
                              key={prompt.id}
                              onClick={() => handleUsePrompt(prompt)}
                              className="w-full rounded-lg p-3 text-left hover:bg-purple-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {prompt.name}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {prompt.description}
                                  </p>
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
                                onChange={(e) =>
                                  setNewPromptName(e.target.value)
                                }
                                className="w-full rounded border border-purple-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                              />
                              <textarea
                                placeholder="Prompt content"
                                value={newPromptContent}
                                onChange={(e) =>
                                  setNewPromptContent(e.target.value)
                                }
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
                                    setNewPromptName("");
                                    setNewPromptContent("");
                                  }}
                                  className="flex-1 rounded border border-purple-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
            </div>

            {/* Text input - always shown for onboarding */}
            {isOnboarding && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) {
                      // Check if user typed "video" to trigger video popup
                      if (customInput.trim().toLowerCase() === "video") {
                        setShowVideoPopup(true);
                        setCustomInput("");
                      } else {
                        onSendCustom(customInput);
                        setCustomInput("");
                      }
                    }
                  }}
                  placeholder="Ask AI"
                  className="flex-1 rounded-full border border-purple-200 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={() => {
                    if (customInput.trim()) {
                      // Check if user typed "video" to trigger video popup
                      if (customInput.trim().toLowerCase() === "video") {
                        setShowVideoPopup(true);
                        setCustomInput("");
                      } else {
                        onSendCustom(customInput);
                        setCustomInput("");
                      }
                    }
                  }}
                  disabled={!customInput.trim()}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold",
                    customInput.trim()
                      ? "border-purple-600 bg-purple-600 text-white hover:bg-purple-700"
                      : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed",
                  )}
                >
                  Send
                </button>
              </div>
            )}
            {/* LLM Disclaimer */}
            <p className="text-[11px] text-slate-400 text-center mt-1">
              LLM based systems can hallucinate! Try again if you don&apos;t get the desired response.
            </p>
          </div>
        </div>
        {/* Video Popup */}
        <VideoPopup
          isOpen={showVideoPopup}
          onClose={() => setShowVideoPopup(false)}
          onSubmit={(data) => {
            if (onVideoSubmit) {
              onVideoSubmit(data);
            }
            setShowVideoPopup(false);
          }}
        />
      </aside>
    );
  },
);

ChatSidebar.displayName = 'ChatSidebar';

// Legacy components removed - no longer needed with new onboarding system

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
  onboardingMessages,
  onboardingProcessing,
  onHandleOnboardingInput,
  renderOnboardingWidget,
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
  onboardingMessages: any[];
  onboardingProcessing: boolean;
  onHandleOnboardingInput: (input: string | any) => Promise<void>;
  renderOnboardingWidget?: (widgetDef: any) => React.ReactNode;
}) {
  const selectedMachine = machines.find((m) => m.id === selectedMachineId);

  // Render different views based on activeNav

  // Overview shows list of all machines (and future SM/APM cards)
  if (activeNav === "overview") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-4 md:px-6 py-6 md:py-10">
            <OverviewPage machines={machines} />
          </div>
        </div>
      </div>
    );
  }

  // Onboarding - full-page onboarding experience for logged-in users
  if (activeNav === "onboarding") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 md:px-6 py-6 md:py-10">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                <Sparkles className="h-10 w-10 text-purple-600" />
              </div>
              <h1 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900">
                Add a new device
              </h1>
              <p className="text-lg text-slate-600">
                Get started by adding your machine to the platform
              </p>
            </div>
            <div className="rounded-3xl border border-purple-200 bg-white p-8 shadow-lg">
              <h3 className="mb-6 text-lg font-semibold text-slate-900">
                How it works
              </h3>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                    1
                  </span>
                  <span>
                    Choose between a demo device or configure your own machine
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                    2
                  </span>
                  <span>
                    Configure your machine profile with cycle time and
                    maintenance schedule
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                    3
                  </span>
                  <span>
                    Connect to our broker and start streaming telemetry data
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                    4
                  </span>
                  <span>
                    Train the anomaly detection model and activate monitoring
                  </span>
                </li>
              </ul>
              <div className="mt-8 text-center">
                <p className="mb-4 text-sm text-slate-500">
                  Use the chat on the left to begin the onboarding process
                </p>
              </div>
            </div>
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
          <div className="mx-auto w-full max-w-6xl space-y-8 px-4 md:px-6 py-6 md:py-10">
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
                    Page{" "}
                    <span className="font-semibold text-slate-800">{page}</span>{" "}
                    of
                    <span className="font-semibold text-slate-800">
                      {" "}
                      {Math.max(1, Math.ceil(total / pageSize))}
                    </span>
                  </span>
                  <button
                    onClick={() =>
                      onPageChange(
                        Math.min(
                          Math.max(1, Math.ceil(total / pageSize)),
                          page + 1,
                        ),
                      )
                    }
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
          <div className="mx-auto w-full max-w-6xl space-y-8 px-4 md:px-6 py-6 md:py-10">
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
          <div className="mx-auto w-full max-w-6xl space-y-8 px-4 md:px-6 py-6 md:py-10">
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
  const [isTrainingComplete, setIsTrainingComplete] = useState(false);
  const [showStreamingBanner, setShowStreamingBanner] = useState(false);
  const hasShownBannerRef = useRef(false);
  const channelsPerPage = 6;

  // Check if training is complete
  useEffect(() => {
    const checkTrainingStatus = () => {
      const trainingData = localStorage.getItem("training_complete");
      if (trainingData) {
        try {
          const data = JSON.parse(trainingData);
          setIsTrainingComplete(true);
          console.log("✅ Training is complete, showing live data");
        } catch (error) {
          console.error("Failed to parse training data:", error);
        }
      } else {
        setIsTrainingComplete(false);
        console.log("⏳ Training not complete yet, showing empty state");
      }
    };

    // Check immediately
    checkTrainingStatus();

    // Also listen for training completion via storage event
    const interval = setInterval(checkTrainingStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // Pagination state for Recent Tickets
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsPageSize, setTicketsPageSize] = useState(5);

  // Fetch telemetry data from API (only after training completes)
  useEffect(() => {
    // Don't fetch if training isn't complete
    if (!isTrainingComplete) {
      setIsLoading(true);
      setTelemetryData(null);
      return;
    }

    const fetchTelemetry = async () => {
      try {
        const response = await fetch(
          `/api/telemetry?machineId=${machine.id}&channels=14&points=30`,
        );
        const data = await response.json();

        // Show streaming banner only once when first data arrives
        if (!hasShownBannerRef.current && data) {
          hasShownBannerRef.current = true;
          setShowStreamingBanner(true);
        }

        setTelemetryData(data);
        setIsLoading(false);
        console.log("📈 Telemetry data loaded");
      } catch (error) {
        console.error("Failed to fetch telemetry:", error);
        setIsLoading(false);
      }
    };

    // Small delay to make the data "flow in" effect more visible
    setTimeout(() => {
      fetchTelemetry();
    }, 500);

    const interval = setInterval(fetchTelemetry, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [machine.id, isTrainingComplete]);

  // Pagination logic
  const totalPages = telemetryData
    ? Math.ceil(telemetryData.channels.length / channelsPerPage)
    : 0;
  const paginatedChannels = telemetryData
    ? telemetryData.channels.slice(
        currentPage * channelsPerPage,
        (currentPage + 1) * channelsPerPage,
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
  const displayHealthScore =
    telemetryData?.overallHealthScore ?? machine.healthScore;

  // Paginate tickets
  const totalTickets = tickets.length;
  const totalTicketPages = Math.max(
    1,
    Math.ceil(totalTickets / ticketsPageSize),
  );
  const paginatedTickets = tickets.slice(
    (ticketsPage - 1) * ticketsPageSize,
    ticketsPage * ticketsPageSize,
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

      {/* Streaming Data Banner */}
      {showStreamingBanner && (
        <div className="animate-fade-in-up rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Activity className="h-5 w-5 animate-pulse text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">
                🎉 Data Streaming Started!
              </p>
              <p className="text-xs text-green-700">
                Your machine is now sending live telemetry data. Sensor channels
                will populate below.
              </p>
            </div>
            <button
              onClick={() => setShowStreamingBanner(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-green-600 hover:bg-green-100 transition"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {/* Live health score KPI */}
        <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Health score
          </p>
          <div className="mt-3 flex items-end gap-2">
            {isTrainingComplete ? (
              <>
                <span className="text-2xl font-semibold text-slate-900">
                  {displayHealthScore}
                </span>
                <span className="text-sm text-slate-400">/100</span>
              </>
            ) : (
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
            )}
          </div>
          <DeltaLabel
            tone={
              displayHealthScore > 85
                ? "positive"
                : displayHealthScore > 70
                  ? "warning"
                  : "critical"
            }
          >
            {!isTrainingComplete
              ? "Training..."
              : telemetryData
                ? "Live"
                : "Loading..."}
          </DeltaLabel>
        </div>

        {kpis
          .filter((kpi) => kpi.id !== "health-score")
          .map((kpi) => (
            <div
              key={kpi.id}
              className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {kpi.label}
              </p>
              <div className="mt-3 flex items-end gap-2">
                {isTrainingComplete ? (
                  <>
                    <span className="text-2xl font-semibold text-slate-900">
                      {kpi.value}
                    </span>
                    {kpi.suffix && (
                      <span className="text-sm text-slate-400">
                        {kpi.suffix}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                )}
              </div>
              {isTrainingComplete && kpi.delta ? (
                <DeltaLabel tone={kpi.tone}>{kpi.delta}</DeltaLabel>
              ) : !isTrainingComplete ? (
                <div className="mt-2 h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
              ) : null}
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
                        : "border-purple-200 text-purple-600 hover:bg-purple-50",
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
                        : "border-purple-200 text-purple-600 hover:bg-purple-50",
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Training incomplete state */}
            {!isTrainingComplete && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
                  <p className="text-sm font-semibold text-slate-700">
                    Waiting for training to complete...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Model training must finish before data can stream
                  </p>
                </div>

                {/* Empty chart placeholders */}
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-purple-100 bg-slate-50/50 p-4 animate-pulse"
                    >
                      <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                      <div className="h-32 bg-slate-100 rounded"></div>
                      <div className="mt-2 flex gap-2">
                        <div className="h-3 w-16 bg-slate-200 rounded"></div>
                        <div className="h-3 w-20 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading telemetry data */}
            {isTrainingComplete && isLoading && (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    Loading telemetry data...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Connecting to sensor streams
                  </p>
                </div>
              </div>
            )}

            {!isLoading && telemetryData && (
              <div className="grid gap-4 md:grid-cols-2">
                {paginatedChannels.map((channel: any, index: number) => (
                  <div
                    key={channel.channelId}
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      opacity: 0,
                      animationFillMode: "forwards",
                    }}
                  >
                    <RealTimeChart channel={channel} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Multi-Channel Analysis */}
          {isTrainingComplete && !isLoading && telemetryData && (
            <MultiChannelChart channels={telemetryData.channels} />
          )}

          {/* Recent Tickets for this machine */}
          {isTrainingComplete && (
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
                    Page{" "}
                    <span className="font-semibold text-slate-800">
                      {ticketsPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {totalTicketPages}
                    </span>{" "}
                    ·{" "}
                    <span className="font-semibold text-slate-800">
                      {totalTickets}
                    </span>{" "}
                    total
                  </span>
                  <button
                    onClick={() =>
                      setTicketsPage(
                        Math.min(totalTicketPages, ticketsPage + 1),
                      )
                    }
                    disabled={ticketsPage >= totalTicketPages}
                    className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {isTrainingComplete && (
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
                          notification.tone === "positive" &&
                            "text-emerald-500",
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
        )}
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
  const [severityLevelDraft, setSeverityLevelDraft] = useState<
    TicketRow["severityLevel"]
  >(ticket?.severityLevel ?? "High");
  const [alertCategoryDraft, setAlertCategoryDraft] = useState<
    TicketRow["alertCategory"]
  >(
    ticket?.alertCategory ??
      (ticket?.severity === "Error" ? "Error" : "Warning"),
  );
  const [alertDateTimeDraft, setAlertDateTimeDraft] = useState<string>("");
  const [predictedRootCauseDraft, setPredictedRootCauseDraft] =
    useState<string>("");
  const [confidenceLevelDraft, setConfidenceLevelDraft] = useState<number>(
    ticket?.confidenceLevel ?? 85,
  );
  const [assetMacDraft, setAssetMacDraft] = useState<string>(
    ticket?.assetMacAddress ?? "",
  );
  const [alertDescriptionDraft, setAlertDescriptionDraft] = useState<string>(
    ticket?.alertDescription ?? "",
  );
  const [remediationStepsDraft, setRemediationStepsDraft] = useState<string>(
    ticket?.remediationSteps ?? "",
  );

  useEffect(() => {
    if (ticket) {
      setOwnerDraft(ticket.owner);
      setNoteDraft(ticket.note ?? "");
      setSeverityLevelDraft(ticket.severityLevel ?? "High");
      setAlertCategoryDraft(
        ticket.alertCategory ??
          (ticket.severity === "Error" ? "Error" : "Warning"),
      );
      setAlertDateTimeDraft(
        ticket.alertDateTime ?? new Date().toISOString().slice(0, 16),
      );
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[calc(100vw-32px)] sm:max-w-2xl max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-purple-100 bg-white p-4 sm:p-6 shadow-2xl">
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
                    <option key={c.email} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-4 py-3">
                <span className="font-semibold text-slate-700">
                  Alert Category
                </span>
                <select
                  value={
                    alertCategoryDraft ??
                    (ticket.severity === "Error" ? "Error" : "Warning")
                  }
                  onChange={(e) => {
                    const cat =
                      (e.target.value as TicketRow["alertCategory"]) ??
                      "Warning";
                    setAlertCategoryDraft(cat);
                    // keep legacy severity in sync for chips
                    const sev: TicketRow["severity"] =
                      cat === "Error" ? "Error" : "Warning";
                    onSeverityChange(ticket.related, sev);
                    onUpdateFields(ticket.related, { alertCategory: cat });
                  }}
                  className="min-w-0 max-w-[160px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  {(["Error", "Warning"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
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
                    const lvl = event.target
                      .value as TicketRow["severityLevel"];
                    setSeverityLevelDraft(lvl);
                    onUpdateFields(ticket.related, { severityLevel: lvl });
                  }}
                  className="min-w-0 max-w-[160px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  {(["Low", "Medium", "High", "Very High"] as const).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-3 py-2">
                <span className="font-semibold text-slate-700 shrink-0">
                  Machine
                </span>
                <select
                  value={ticket.machine ?? ""}
                  onChange={(event) =>
                    onUpdateFields(ticket.related, {
                      machine: event.target.value || undefined,
                    })
                  }
                  className="min-w-0 max-w-[160px] rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50/50 px-3 py-2">
                <span className="font-semibold text-slate-700 shrink-0">
                  Alert date/time
                </span>
                <input
                  type="datetime-local"
                  value={alertDateTimeDraft}
                  onChange={(e) => {
                    setAlertDateTimeDraft(e.target.value);
                    onUpdateFields(ticket.related, {
                      alertDateTime: e.target.value,
                    });
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
                  onUpdateFields(ticket.related, {
                    alertDescription: e.target.value,
                  });
                }}
                placeholder="Describe the alert details (separate from context)"
                rows={3}
                className="w-full resize-none rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
              />

              <p className="font-semibold text-slate-700">
                Most recent note (context)
              </p>
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
              <p className="font-semibold text-slate-700">
                Predicted root cause
              </p>
              <input
                value={predictedRootCauseDraft}
                onChange={(e) => {
                  setPredictedRootCauseDraft(e.target.value);
                  onUpdateFields(ticket.related, {
                    predictedRootCause: e.target.value,
                  });
                }}
                placeholder="e.g., Coolant pump wear"
                className="w-full rounded-2xl border border-purple-100 bg-white px-4 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">
                    Confidence level
                  </span>
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
                  <span className="font-semibold text-slate-700">
                    Asset MAC
                  </span>
                  <input
                    value={assetMacDraft}
                    onChange={(e) => {
                      setAssetMacDraft(e.target.value);
                      onUpdateFields(ticket.related, {
                        assetMacAddress: e.target.value,
                      });
                    }}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-600 focus:border-purple-400 focus:outline-none"
                  />
                </label>
              </div>
              <p className="font-semibold text-slate-700">
                Remediation steps taken
              </p>
              <textarea
                value={remediationStepsDraft}
                onChange={(e) => {
                  setRemediationStepsDraft(e.target.value);
                  onUpdateFields(ticket.related, {
                    remediationSteps: e.target.value,
                  });
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
  const [alertCategory, setAlertCategory] =
    useState<TicketRow["alertCategory"]>("Warning");
  const [severityLevel, setSeverityLevel] =
    useState<TicketRow["severityLevel"]>("High");
  const [alertDateTime, setAlertDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
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
    setAlertDateTime(new Date().toISOString().slice(0, 16));
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[calc(100vw-32px)] sm:max-w-lg max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-purple-100 bg-white p-4 sm:p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                New Ticket
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                Create a ticket that will persist in server memory.
              </Dialog.Description>
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
                  onChange={(e) =>
                    setAlertCategory(
                      e.target.value as TicketRow["alertCategory"],
                    )
                  }
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                >
                  {(["Error", "Warning"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">Severity level</span>
                <select
                  value={severityLevel}
                  onChange={(e) =>
                    setSeverityLevel(
                      e.target.value as TicketRow["severityLevel"],
                    )
                  }
                  className="w-full rounded-2xl border border-purple-100 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none"
                >
                  {(["Low", "Medium", "High", "Very High"] as const).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
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
                    <option key={c.email} value={c.name}>
                      {c.name}
                    </option>
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
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
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
          <dd className="flex-1 text-slate-700">
            {data.trainingSeconds} seconds
          </dd>
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
          <div className="overflow-x-auto overflow-hidden rounded-2xl border border-purple-100 min-w-0">
            <table className="min-w-full divide-y divide-purple-100 text-left text-sm">
              <thead className="bg-purple-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {(
                    [
                      { key: "timestamp", label: "Timestamp", hideOnMobile: true },
                      { key: "workorder", label: "Workorder ID", hideOnMobile: true },
                      { key: "summary", label: "Summary", hideOnMobile: false },
                      { key: "related", label: "Ticket", hideOnMobile: false },
                      { key: "status", label: "Status", hideOnMobile: false },
                      { key: "severity", label: "Severity", hideOnMobile: false },
                      { key: "owner", label: "Owner", hideOnMobile: true },
                    ] as { key: keyof TicketRow; label: string; hideOnMobile: boolean }[]
                  ).map((column) => (
                    <th
                      key={column.key}
                      className={cn("cursor-pointer px-4 py-3", column.hideOnMobile && "hidden md:table-cell")}
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
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-500">
                      {ticket.timestamp}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 font-semibold text-slate-800">
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
                    <td className="hidden md:table-cell px-4 py-3 text-slate-600">{ticket.owner}</td>
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
                  <span className="text-slate-400">
                    {selectedTicket.timestamp.split(" ")[0]}
                  </span>
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[calc(100vw-32px)] sm:max-w-2xl max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-purple-100 bg-white/95 p-4 sm:p-6 shadow-2xl">
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

function countRemainingSteps(
  currentIndex: number,
  flowType: "mqtt" | "demo" | null,
): number {
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
