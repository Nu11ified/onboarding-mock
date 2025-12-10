"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { useScriptedOnboarding } from "@/hooks/useScriptedOnboarding";
import { WidgetRenderer } from "@/components/widgets";
import {
  StatusPanel,
  type OnboardingPhase,
  type OnboardingMode,
} from "@/components/widgets/StatusPanel";

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

// Map flow step IDs to status panel phases
function mapStepToPhase(
  stepId: string | undefined,
  mode: "demo" | "live" | undefined,
): OnboardingPhase {
  if (!stepId) return "welcome";

  // Completion (check early)
  if (stepId.includes("complete") || stepId.includes("dashboard") || stepId === "session-saved")
    return "complete";

  // Account creation step
  if (stepId === "account-created" || stepId.includes("account-creation"))
    return "account-creation";

  // Password setup - check before 'email' since 'send-reset-email' contains both
  if (
    stepId.includes("password") ||
    stepId.includes("reset") ||
    stepId.includes("login-button")
  )
    return "password-setup";

  // Welcome/mode selection
  if (stepId === "welcome-message" || stepId === "mode-selection")
    return "welcome";

  // User info form steps
  if (stepId.includes("user-info") || stepId === "user-info-prompt" || stepId === "user-info-processing")
    return "email";

  // OTP-related steps
  if (stepId.includes("otp") || stepId === "otp-prompt" || stepId === "otp-processing") return "otp";

  // Machine details (live flow)
  if (stepId.includes("machine-details"))
    return "machine-details";

  // MQTT/Live connection
  if (
    stepId.includes("mqtt") ||
    stepId.includes("live-data") ||
    stepId.includes("schema")
  )
    return "mqtt-validation";

  // Channel configuration
  if (stepId.includes("channel") || stepId === "live-data-received") return "channel-config";

  // Training/device spawn
  if (
    stepId.includes("spawn") ||
    stepId.includes("device-status") ||
    stepId.includes("training") ||
    stepId.includes("device-init") ||
    stepId.includes("slideshow") ||
    stepId.includes("setup-message")
  )
    return "training";

  return "welcome";
}

export default function DualPaneOnboardingPage() {
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

  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    setIsLoggedIn(!!authToken);
  }, []);

  const {
    messages,
    isProcessing,
    handleUserInput,
    getCurrentWidget,
    getContext,
    currentStep,
  } = useScriptedOnboarding(isLoggedIn ? "logged-in" : "non-login");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAutoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled]);

  // Get current context and determine phase/mode
  const context = getContext();
  const currentMode: OnboardingMode =
    (context.mode as OnboardingMode) || "demo";
  const currentPhase = mapStepToPhase(
    currentStep?.id,
    context.mode as "demo" | "live" | undefined,
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
    setCustomInput(prompt.content);
    setPromptMenuOpen(false);
  };

  const handleSendMessage = () => {
    if (customInput.trim()) {
      handleUserInput({ userMessage: customInput });
      setCustomInput("");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-slate-50">
      {/* Left Pane - Chat Interface */}
      <div className="flex flex-1 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-sm min-h-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              width={100}
              height={28}
              className="h-7 w-auto"
            />
            <div className="h-6 w-px bg-slate-200" />
            <span className="text-sm font-medium text-slate-600">
              Onboarding
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              Help
            </button>
          </div>
        </header>

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
            {messages.map((message) => (
              <div key={message.id} className="group">
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
                      onSubmit={async (data) => {
                        await handleUserInput(data);
                      }}
                      context={getContext()}
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
            {currentStep?.waitForUserInput && (
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

            {/* Status Indicator */}
            {!currentStep?.waitForUserInput && (
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

      {/* Right Pane - Status Panel */}
      <div className="w-[440px] flex-shrink-0 overflow-y-auto bg-gradient-to-br from-slate-50 to-purple-50/30 p-6">
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
            title: "Getting Started with Machine Intelligence",
            description:
              "Learn how to configure your machine, understand health scores, and set up predictive maintenance alerts.",
            duration: "5:30",
          }}
        />
      </div>
    </div>
  );
}
