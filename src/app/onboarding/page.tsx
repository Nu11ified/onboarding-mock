"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Send,
  Plus,
  Paperclip,
  Gauge,
  Zap,
  Activity,
  FileText,
  Save,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useFlow } from "@/hooks/useFlow";
import { WidgetRenderer } from "@/components/widgets";
import {
  StatusPanel,
  type OnboardingPhase,
  type OnboardingMode,
} from "@/components/widgets/StatusPanel";
import {
  RightSidePanelProvider,
  useRightSidePanel,
} from "@/components/widgets/RightSidePanelContext";
import { RightSidePanel } from "@/components/widgets/RightSidePanel";
import { PasswordPopup } from "@/components/widgets/PasswordPopup";

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
];

// Map machine state IDs to status panel phases
function mapStateToPhase(
  stateId: string | undefined,
  mode: "demo" | "live" | undefined,
): OnboardingPhase {
  if (!stateId) return "welcome";

  // Completion
  if (stateId.includes("complete") || stateId === "session-saved") return "complete";

  // Account creation
  if (stateId === "account-created") return "account-creation";

  // Mode selection
  if (stateId === "mode-select") return "device-selection";

  // User info
  if (stateId.includes("user-info")) return "email";

  // OTP
  if (stateId === "otp") return "otp";

  // Machine details (live)
  if (stateId === "live-machine-details") return "machine-details";

  // Channel config
  if (stateId === "live-data-received" || stateId === "live-channel-config") return "channel-config";

  // MQTT validation
  if (stateId.startsWith("live-mqtt") || stateId.includes("validate")) return "mqtt-validation";

  // Training / spawning
  if (stateId.includes("spawn")) return "training";

  return "welcome";
}

export default function DualPaneOnboardingPage() {
  return (
    <RightSidePanelProvider>
      <DualPaneOnboardingPageInner />
    </RightSidePanelProvider>
  );
}

function DualPaneOnboardingPageInner() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [promptMenuOpen, setPromptMenuOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState<
    "templates" | "library"
  >("templates");
  const [savedPrompts, setSavedPrompts] =
    useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    setIsLoggedIn(!!authToken);
  }, []);

  const { messages, isProcessing, machine, api, addUserMessage, reset } = useFlow();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAutoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled]);

  const { panel: rightPanel, openPanel, closePanel } = useRightSidePanel();

  // Auto-open the right-side help panel as soon as a "View …" info button appears in chat.
  const autoOpenedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
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

    const panelFromWidget = (w: any): { type: string; title: string; data: any } | null => {
      if (!w) return null;
      if (w.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
        for (const child of w.data.widgets) {
          const candidate: { type: string; title: string; data: any } | null = panelFromWidget(child);
          if (candidate) return candidate;
        }
      }
      if (w.type === 'right-panel-button') {
        const p = w?.data || {};
        const panelType = p?.panelType;
        // /onboarding should never auto-open the dashboard metrics panel.
        if (
          panelType !== 'machine-config-help' &&
          panelType !== 'channel-config-help' &&
          panelType !== 'mqtt-setup'
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
          return null;
        };

        const infoType =
          payload?.infoType || inferInfoType(payload?.title, payload?.buttonText);
        if (
          infoType !== 'machine-config-help' &&
          infoType !== 'channel-config-help' &&
          infoType !== 'mqtt-setup'
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

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg: any = messages[i];
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
  }, [messages, openPanel]);

  // Determine phase/mode from machine
  const context = machine.context as any;

  // Auto-open the video panel when first entering mode-select
  const prevStateRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentStateId = machine.state?.id;
    // Only open video panel when we first transition INTO mode-select
    if (currentStateId === 'mode-select' && prevStateRef.current !== 'mode-select') {
      openPanel({
        type: 'training-video',
        title: 'Training Video',
        data: {
          url: 'https://youtu.be/YQj_I-Zpx4Q',
          title: 'What you unlock with onboarding',
          description: 'See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.',
          duration: '5:30',
        },
      });
    }
    prevStateRef.current = currentStateId;
  }, [machine.state?.id, openPanel]);
  const currentMode: OnboardingMode = (context.mode as OnboardingMode) || "demo";
  const currentPhase = mapStateToPhase(machine.state?.id as string, context.mode as "demo" | "live" | undefined);

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
    setCustomInput(prompt.content);
    setPromptMenuOpen(false);
  };

  // Auto-start device spawn steps
  useEffect(() => {
    const stateId = machine.state?.id as string;
    if (stateId === 'demo-spawn') {
      api.startDemoSpawn();
    }
    if (stateId === 'live-spawn') {
      api.startLiveSpawn(context?.profileConfig);
    }
  }, [machine.state?.id]);

  const handleSendMessage = () => {
    const text = customInput.trim();
    if (!text) return;

    // Echo user message
    addUserMessage(text);

    const lower = text.toLowerCase();
    const stateId = machine.state?.id as string;

    // Route based on current state
    if (stateId === 'live-mqtt') {
      if (lower.includes('done') || lower.includes('ready')) {
        api.mqttReady();
      }
    } else if (stateId === 'live-data-received') {
      if (lower.includes('configure')) api.configureChannels();
      else if (lower.includes('skip') || lower.includes('default')) api.skipChannels();
    } else if (stateId === 'demo-complete' || stateId === 'live-complete') {
      if (lower.includes('yes') || lower.includes('create')) api.sayYesCreate();
      else if (lower.includes('no') || lower.includes('later')) api.sayNoSkip();
    }

    setCustomInput("");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-slate-50">
      {/* Header - Full Width */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Image
            src="/microai-logo-dark.svg"
            alt="MicroAI"
            width={100}
            height={28}
            className="h-7 w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to restart the entire onboarding flow? This will clear all progress and data.')) {
                reset();
              }
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            title="Reset entire onboarding flow and clear all cache"
          >
            For Mock Only Ignore: Restart
          </button>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Content Area - Chat + Right Panel */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Pane - Chat Interface */}
        <div className="flex flex-1 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-sm min-h-0">
          {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Let&apos;s get started
                </h2>
                <p className="text-sm text-slate-500">
                  Your conversation will appear here. Start by asking how to add
                  a machine.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message, idx) => (
              <div key={`${message.id}-${idx}`} className="group">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-semibold",
                        message.actor === "assistant"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-800 text-white",
                      )}
                    >
                      {message.actor === "assistant" ? "AI" : "YO"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">
                        {message.actor === "assistant"
                          ? "Onboarding Copilot"
                          : "You"}
                      </p>
                      <p className="text-xs text-slate-400">Just now</p>
                    </div>
                    {message.message && (
                      <div className="rounded-2xl px-4 py-3 text-sm bg-slate-50 text-slate-700 border border-slate-100">
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {message.widget && message.actor === "assistant" && (
                  <div className="ml-11 mt-3">
                    <WidgetRenderer
                      widget={message.widget}
                      onShowPasswordPopup={() => setShowPasswordPopup(true)}
                      onSubmit={async (data) => {
                        const stateId = machine.state?.id as string;
                        const rootType = (message.widget as any)?.type;
                        const widgetDeviceId = (message.widget as any)?.data?.deviceId;

                        // Helper: detect nested widget type inside widget-stack.
                        // This is intentionally data-driven so stacked widgets still submit correctly
                        // even when an info/help widget appears before the form.
                        const resolveTypeFromData = (): string | null => {
                          if (!data || typeof data !== 'object') return null;

                          const stackWidgets = (message.widget as any)?.data?.widgets;
                          const stackTypes: string[] = Array.isArray(stackWidgets)
                            ? stackWidgets.map((w: any) => w?.type).filter(Boolean)
                            : [];
                          const hasType = (t: string) => stackTypes.includes(t);

                          const d: any = data;

                          // User info form
                          if ('firstName' in d || 'lastName' in d || 'phoneNumber' in d) {
                            return 'user-info-form';
                          }

                          // Device option (demo vs live)
                          if ('mode' in d && hasType('device-option-form')) {
                            return 'device-option-form';
                          }

                          // OTP
                          if ('otp' in d) {
                            return hasType('otp-form') ? 'otp-form' : 'sms-otp-form';
                          }

                          // Email form (invite etc.)
                          if ('email' in d && hasType('email-form')) {
                            return 'email-form';
                          }

                          // Machine details
                          if ('machineDetails' in d || hasType('machine-details-form')) {
                            return 'machine-details-form';
                          }

                          // Channel config
                          if ('channelMapping' in d || hasType('channel-configuration-widget')) {
                            return 'channel-configuration-widget';
                          }

                          // Status widgets
                          if (d?.status === 'active' || hasType('device-status-widget')) {
                            return 'device-status-widget';
                          }

                          return null;
                        };

                        const type = rootType === 'widget-stack'
                          ? resolveTypeFromData() || (message.widget as any)?.data?.widgets?.find((w: any) => w?.type && w.type !== 'right-panel-button')?.type
                          : rootType;

                        if (type === 'user-info-form') return api.submitUserInfo(data);
                        if (type === 'otp-form') return api.verifyOtp(data);
                        if (type === 'device-option-form') {
                          const mode = (data as any)?.mode;
                          if (mode === 'demo') return api.selectDemo();
                          if (mode === 'live') return api.selectLive();
                          return;
                        }
                        if (type === 'machine-details-form') {
                          const details = (data as any)?.machineDetails ?? data;
                          return api.machineDetailsSubmit(details);
                        }
                        if (type === 'device-status-widget') {
                          // Match widget's deviceId to expected state
                          if (stateId === 'live-validate-schema' && widgetDeviceId === 'schema_validation') {
                            return api.nextFromSchema();
                          }
                          if (stateId === 'live-validate-agent' && widgetDeviceId === 'agent_validation') {
                            return api.nextFromAgent();
                          }
                          if (stateId === 'demo-spawn') return api.completeDemoSpawn();
                          if (stateId === 'live-spawn') return api.completeLiveSpawn();
                          return;
                        }
                        if (type === 'channel-configuration-widget') {
                          const mapping = (data as any)?.channelMapping ?? data;
                          return api.channelConfigSubmit(mapping);
                        }
                      }}
                      context={context}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl bg-slate-100 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="space-y-3">
            {/* Action buttons */}
            <div className="relative flex items-center gap-2">
              {/* Plus Button - Quick Actions & Prompt Library */}
              <div className="relative">
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-200 text-purple-500 hover:bg-purple-50 transition"
                  onClick={() => {
                    setPromptMenuOpen(!promptMenuOpen);
                    setActiveMenuSection("templates");
                  }}
                  title="Quick actions & prompts"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {promptMenuOpen && (
                  <div className="absolute bottom-12 left-0 z-50 w-72 rounded-xl border border-purple-100 bg-white shadow-xl">
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
                      <div className="p-2 max-h-80 overflow-y-auto">
                        {[
                          {
                            icon: Gauge,
                            title: "See My Device Health Score",
                            desc: "View operational health",
                            prompt: "Show me my device's health score",
                          },
                          {
                            icon: FileText,
                            title: "See Tickets for My Machines",
                            desc: "Review maintenance tickets",
                            prompt: "Show me tickets for my machines",
                          },
                          {
                            icon: Zap,
                            title: "See Predictive Maintenance",
                            desc: "View predictions and alerts",
                            prompt:
                              "Show me predictive maintenance for my machine",
                          },
                          {
                            icon: Activity,
                            title: "Monitor Real-Time Telemetry",
                            desc: "Live sensor data",
                            prompt:
                              "Monitor my machine's real-time telemetry data",
                          },
                        ].map((item) => (
                          <button
                            key={item.title}
                            onClick={() => {
                              setCustomInput(item.prompt);
                              setPromptMenuOpen(false);
                            }}
                            className="w-full rounded-lg p-3 text-left hover:bg-purple-50 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Prompt Library Section */}
                    {activeMenuSection === "library" && (
                      <>
                        <div className="max-h-64 overflow-y-auto p-2">
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
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-purple-200 px-3 text-xs font-medium text-purple-600 hover:bg-purple-50 transition"
                title="Attach files"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach
              </button>
            </div>

            {/* Text input */}
            {machine.state?.waitForUserInput && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full border border-purple-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!customInput.trim() || isProcessing}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full transition",
                    customInput.trim() && !isProcessing
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed",
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* LLM Disclaimer */}
            <p className="text-[11px] text-slate-400 text-center mt-1">
              LLM based systems can hallucinate! Try again if you don&apos;t get the desired response.
            </p>

            {/* Status Indicator */}
            {!machine.state?.waitForUserInput && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isProcessing
                      ? "animate-pulse bg-yellow-500"
                      : "bg-green-500",
                  )}
                />
                <span>{isProcessing ? "Processing..." : "Ready"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane */}
      <div className="w-[440px] flex-shrink-0 overflow-y-auto bg-gradient-to-br from-slate-50 to-purple-50/30 p-6">
        {rightPanel ? (
          <RightSidePanel panel={rightPanel} onClose={closePanel} />
        ) : (
          <StatusPanel
            phase={currentPhase}
            mode={currentMode}
            mqttConfig={{
              brokerEndpoint:
                context.mqttConnection?.brokerEndpoint || "mqtt.industrialiq.ai",
              brokerPort: context.mqttConnection?.brokerPort || 8883,
              topic: context.mqttConnection?.topic || "telemetry",
            }}
            videoConfig={{
              url: "https://youtu.be/YQj_I-Zpx4Q",
              title: "What you unlock with onboarding",
              description:
                "See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.",
              duration: "5:30",
            }}
          />
        )}
      </div>
      </div>

      {/* Password Popup */}
      <PasswordPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
      />
    </div>
  );
}
