"use client";

import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useScriptedOnboarding } from "@/hooks/useScriptedOnboarding";
import { WidgetRenderer } from "@/components/widgets";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  ChevronDown,
  Paperclip,
  Search,
  Check,
  Gauge,
  Zap,
  Activity,
  FileText,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function DemoPage() {
  const isMobile = useIsMobile();
  // Check if user is logged in
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAutoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled]);

  // Flow auto-starts from the hook, no need to start it here

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 text-slate-900">
      {/* Minimal Sidebar (Ask AI only) */}
      <nav className="hidden md:flex w-60 flex-col border-r border-purple-100 bg-white/70 backdrop-blur">
        <div className="flex items-center px-3 py-4 border-b border-purple-100">
          <span className="text-sm font-semibold text-slate-900">LaunchPad</span>
        </div>
        <div className="p-2">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-purple-600 text-white shadow-sm">
            <MessageSquare className="h-5 w-5" />
            Ask AI
          </button>
        </div>
        <div className="mt-auto p-3 text-xs text-slate-400">Onboarding</div>
      </nav>

      {/* Right: Top bar (empty) + Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!isMobile && <div className="h-16 border-b border-purple-100 bg-white/70" />}
        {/* Chat Container */}
        <aside className="flex flex-1 flex-col border-l border-purple-100 bg-white/80 backdrop-blur min-w-0">
        {/* Thread Header */}
        <div className="border-b border-purple-100 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Thread Dropdown (disabled for non-logged-in users) */}
            <div className="relative flex-1">
              <button
                className="w-full flex items-center justify-between rounded-lg border border-purple-200 bg-white px-2 py-1.5 text-left text-xs opacity-50 cursor-not-allowed"
                disabled={!isLoggedIn}
                title={isLoggedIn ? "Select thread" : "Login to access threads"}
              >
                <span className="font-medium text-slate-700 truncate">
                  MI Onboarding
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              </button>
            </div>
            <button
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 text-purple-600 flex-shrink-0",
                isLoggedIn
                  ? "hover:bg-purple-50"
                  : "opacity-50 cursor-not-allowed",
              )}
              disabled={!isLoggedIn}
              onClick={() => {
                if (isLoggedIn) {
                  alert("Create new thread functionality");
                }
              }}
              title={
                isLoggedIn ? "Create new thread" : "Login to create threads"
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
          style={{ maxHeight: isMobile ? "calc(100dvh - 120px)" : "calc(100dvh - 180px)" }}
        >
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="max-w-[200px] text-center text-xs text-slate-400">
                Start a conversation to begin onboarding
              </p>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <div className="flex items-start gap-2">
                  <Avatar className="h-7 w-7 shrink-0">
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
                      <p className="text-xs font-semibold text-slate-700">
                        {message.actor === "assistant"
                          ? "Onboarding Copilot"
                          : "You"}
                      </p>
                      <p className="text-xs text-slate-400">Just now</p>
                    </div>
                    {message.message && (
                      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {message.widget && message.actor === "assistant" && (
                  <div className="ml-9 mt-2 max-w-[calc(100%-2.25rem)] overflow-x-auto">
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

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Footer - Input Area with Plus and Attach */}
        <div className="border-t border-purple-100 p-4">
          <div className="space-y-3">
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

            {/* Free-form text input */}
            {currentStep?.waitForUserInput && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) {
                      handleUserInput({ userMessage: customInput });
                      setCustomInput("");
                    }
                  }}
                  placeholder="Ask AI"
                  className="flex-1 rounded-full border border-purple-200 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                  disabled={isProcessing}
                />
                <button
                  onClick={() => {
                    if (customInput.trim()) {
                      handleUserInput({ userMessage: customInput });
                      setCustomInput("");
                    }
                  }}
                  disabled={!customInput.trim() || isProcessing}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold",
                    customInput.trim() && !isProcessing
                      ? "border-purple-600 bg-purple-600 text-white hover:bg-purple-700"
                      : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed",
                  )}
                >
                  Send
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
        </aside>
      </div>
    </div>
  );
}
