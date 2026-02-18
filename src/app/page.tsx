"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Gauge,
  Zap,
  Activity,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Database,
  Plus,
  Save,
  Send,
  Shield,
  Plug,
  Server,
  Boxes,
  TrendingUp,
  Key,
  X,
  Phone,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { isValidEmail } from '@/lib/onboarding/utils';

const CTA_OPTIONS = [
  {
    key: "visualize" as const,
    icon: Gauge,
    title: "Track my machine’s operational health score",
    blurb: "Get a score that reflects the overall health of your machine",
    prompt: "Set up monitoring for my machine",
  },
  {
    key: "protect" as const,
    icon: Zap,
    title: "Know my machine needs maintenance ahead of time",
    blurb: "Deploy predictive maintenance algorithm for your machine",
    prompt: "Configure predictive maintenance alerts",
  },
  {
    key: "monitor" as const,
    icon: Activity,
    title: "Monitor my machine's telemetry data in real time.",
    blurb: "Spin up dashboards that show real-time telemetry for your machine",
    prompt: "Monitor my real time data",
  },
];

type CtaKey = (typeof CTA_OPTIONS)[number]["key"];

type ChatMessage = {
  id: string;
  author: "assistant" | "user";
  text: string;
  variant?: "code";
};

const INITIAL_MESSAGES: ChatMessage[] = [];

const VISUALIZE_TEMPLATE = `Create a configuration for monitoring a machine with the following details:
Email: [Your email address]
Connection Type: [Choose MQTT or OPC UA]
Asset Name: [Your machine's name]
Split Counter: [Seconds per machine cycle]
Channel Name(s): [Comma-separated list of sensor tag names]
Days to Maintenance: [Number of days between scheduled maintenance]
Please generate a structured configuration and visualization based on these inputs.`;

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

export default function LandingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isRouting, setIsRouting] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState<
    "templates" | "library"
  >("templates");
  const [inputText, setInputText] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<CtaKey | null>(null);
  const [savedPrompts, setSavedPrompts] =
    useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [inviteStep, setInviteStep] = useState<"form" | "request">("form");
  const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [codeSentBanner, setCodeSentBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (scenario: CtaKey) => {
    if (isRouting || selectedScenario) return;

    setSelectedScenario(scenario);
    setInputText(VISUALIZE_TEMPLATE);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputText(newValue);

    // If user clears the text, reset the scenario
    if (newValue.trim() === "") {
      setSelectedScenario(null);
    }
  };

  const handleSend = () => {
    if (!selectedScenario || isRouting) return;
    // Show invite code popup instead of navigating directly
    setShowInvitePopup(true);
  };

  const validateInviteForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!inviteCode.trim()) errors.inviteCode = "Invite code is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInviteSubmit = () => {
    if (!validateInviteForm()) return;
    setIsSubmitting(true);
    localStorage.setItem("invite_user_info", JSON.stringify({
      inviteCode: inviteCode.trim(),
    }));
    setShowInvitePopup(false);
    setIsRouting(true);
    router.push("/onboarding");
  };

  const handleGoToRequest = () => {
    setSlideDirection("forward");
    setInviteStep("request");
  };

  const handleBackToForm = () => {
    setSlideDirection("back");
    setInviteStep("form");
  };

  const handleSendCode = () => {
    if (!phoneNumber.trim()) return;
    setSlideDirection("back");
    setInviteStep("form");
    setCodeSentBanner(true);
    setTimeout(() => setCodeSentBanner(false), 5000);
  };

  const clearField = (field: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

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

  const setInput = (text: string) => {
    setInputText(text);
    const visualizeOption = CTA_OPTIONS.find((opt) => opt.key === "visualize");
    if (visualizeOption) {
      setSelectedScenario("visualize");
    }
  };

  const handleUsePrompt = (prompt: PromptTemplate) => {
    setInputText(prompt.content);
    setShowAttachMenu(false);
  };

  useEffect(() => {
    if (showAttachMenu && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAttachMenu &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        const dropdown = document.querySelector(
          '[data-dropdown="prompt-library"]',
        );
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setShowAttachMenu(false);
        }
      }
    };

    const handleScroll = () => {
      if (showAttachMenu && buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    };

    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showAttachMenu]);

  return (
    <main className="landing-ambient relative flex min-h-screen flex-col overflow-hidden text-slate-900">
      <div className="landing-glow absolute inset-0" aria-hidden />

      {/* Invite Code Popup */}
      {showInvitePopup &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => {
                setShowInvitePopup(false);
                setInviteStep("form");
                setSlideDirection("forward");
                setFormErrors({});
                setCodeSentBanner(false);
              }}
            />
            {/* Modal */}
            <div className="relative w-[min(90vw,24rem)] max-h-[90dvh] mx-4 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-0.5 shadow-2xl animate-fade-in-up">
              <div className="rounded-[14px] bg-white overflow-y-auto max-h-[calc(90dvh-4px)]">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowInvitePopup(false);
                    setInviteStep("form");
                    setSlideDirection("forward");
                    setFormErrors({});
                    setCodeSentBanner(false);
                  }}
                  className="absolute top-4 right-4 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Step 1: Invite Form */}
                {inviteStep === "form" && (
                  <div
                    key="form-step"
                    className={cn(
                      "px-5 py-5",
                      slideDirection === "back" ? "animate-slide-in-left" : ""
                    )}
                  >
                    {/* Success Banner */}
                    {codeSentBanner && (
                      <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>Code sent! Check your phone.</span>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="mb-4 flex justify-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                        <Key className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="mb-5 text-center text-xl font-semibold tracking-tight text-slate-900">
                      Enter Your Invite Code
                    </h2>

                    {/* Invite Code Field */}
                    <div className="mb-3">
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => { setInviteCode(e.target.value); clearField("inviteCode"); }}
                        placeholder="Enter code..."
                        className={cn(
                          "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-purple-400/20",
                          formErrors.inviteCode ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-purple-400"
                        )}
                      />
                      {formErrors.inviteCode && (
                        <p className="mt-1 text-xs text-rose-500">{formErrors.inviteCode}</p>
                      )}
                    </div>

                    {/* Helper text */}
                    <p className="mb-4 text-sm text-slate-500">
                      Use the invite code we provided to access the onboarding experience.
                    </p>

                    {/* Terms checkbox */}
                    <label className="mb-4 flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-600">
                        I agree to the{" "}
                        <a href="#" className="font-medium text-slate-900 underline">Terms of Use</a>
                        {" "}and{" "}
                        <a href="#" className="font-medium text-slate-900 underline">Privacy Policy</a>
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button
                      onClick={handleInviteSubmit}
                      disabled={isSubmitting || !termsAccepted}
                      className={cn(
                        "w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-purple-400/50",
                        !isSubmitting && termsAccepted
                          ? "bg-purple-600 hover:bg-purple-700 hover:shadow-md"
                          : "bg-slate-300 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Getting started...
                        </span>
                      ) : (
                        "Continue"
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-slate-400">or</span>
                      </div>
                    </div>

                    {/* Request Code Button */}
                    <button
                      type="button"
                      onClick={handleGoToRequest}
                      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-purple-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                    >
                      Request Code
                    </button>

                  </div>
                )}

                {/* Step 2: Request Code */}
                {inviteStep === "request" && (
                  <div
                    key="request-step"
                    className={cn(
                      "px-5 py-5",
                      slideDirection === "forward" ? "animate-slide-in-right" : ""
                    )}
                  >
                    {/* Back Button */}
                    <button
                      onClick={handleBackToForm}
                      className="absolute top-4 left-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    {/* Icon */}
                    <div className="mb-3 flex justify-center">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200/60 text-purple-600">
                        <Phone className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="mb-0.5 text-center text-lg font-semibold tracking-tight text-slate-900">
                      Request an Invite Code
                    </h2>
                    <p className="mb-3 text-center text-sm text-slate-500">
                      Enter your phone number and we&apos;ll text you a code
                    </p>

                    {/* Phone Input */}
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        Standard messaging rates may apply
                      </p>
                    </div>

                    {/* Send Code Button */}
                    <button
                      onClick={handleSendCode}
                      disabled={!phoneNumber.trim()}
                      className={cn(
                        "w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-purple-400/50",
                        phoneNumber.trim()
                          ? "bg-purple-600 hover:bg-purple-700 hover:shadow-md"
                          : "bg-slate-300 cursor-not-allowed"
                      )}
                    >
                      Send Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Lovable-style Top Bar */}
      <header className="relative z-20 border-b border-purple-100/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-8">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 md:px-6 py-12">
        {/* Main Chat Container */}
        <div className="mx-auto w-full max-w-3xl">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              360° intelligence with a single prompt
            </h1>
            <p className="text-lg text-slate-600">
              Unlock complete observability and performance insights for your
              machines, networks, and infrastructure
            </p>
          </div>

          {/* Chat Box */}
          <div className="relative mb-8 rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-1 shadow-2xl">
            <div className="rounded-[22px] bg-white p-4 md:p-6">
              {/* Chat Messages */}
              {messages.length > 0 && (
                <div className="mb-4 max-h-[300px] space-y-4 overflow-y-auto">
                  {messages.map((message) => (
                    <LandingMessage key={message.id} message={message} />
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="relative">
                <textarea
                  placeholder="Describe what you'd like to set up..."
                  value={inputText}
                  onChange={handleInputChange}
                  rows={selectedScenario && inputText.trim() !== "" ? 8 : 1}
                  className="w-full resize-none bg-transparent pr-16 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <div className="absolute bottom-0 right-0 flex items-center gap-2">
                  <button
                    onClick={handleSend}
                    disabled={!selectedScenario || isRouting}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition",
                      selectedScenario && !isRouting
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-slate-300 cursor-not-allowed",
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Plus Button with Templates & Prompt Library */}
                  <div className="relative">
                    <button
                      ref={buttonRef}
                      onClick={() => {
                        setShowAttachMenu(!showAttachMenu);
                        setActiveMenuSection("templates");
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-purple-200 text-slate-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-slate-900"
                      title="Quick actions & prompts"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    {showAttachMenu &&
                      buttonRect &&
                      createPortal(
                        <div
                          data-dropdown="prompt-library"
                          className="fixed w-72 rounded-xl border border-purple-100 bg-white shadow-xl"
                          style={{
                            top: buttonRect.bottom + 8,
                            left: buttonRect.left,
                            zIndex: 9999,
                          }}
                        >
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
                                  setInput("Show me my device's health score");
                                  setShowAttachMenu(false);
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
                                  setInput("Show me tickets for my machines");
                                  setShowAttachMenu(false);
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
                                      Review maintenance tickets and service
                                      history
                                    </p>
                                  </div>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  setInput(
                                    "Show me predictive maintenance for my machine",
                                  );
                                  setShowAttachMenu(false);
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
                                      View upcoming maintenance predictions and
                                      alerts
                                    </p>
                                  </div>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  setInput(
                                    "Monitor my machine's real-time telemetry data",
                                  );
                                  setShowAttachMenu(false);
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
                                      View live sensor data and telemetry
                                      streams
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
                        </div>,
                        document.body,
                      )}
                  </div>
                  {/* Attach Button */}
                  <button className="inline-flex h-8 items-center gap-1.5 rounded-full border border-purple-200 px-3 text-xs font-medium text-slate-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-slate-900">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attach
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons - Now Below Chat */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                Quick start options
              </p>
              <p className="text-xs text-slate-400">Click to begin →</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {CTA_OPTIONS.map((cta) => {
                const Icon = cta.icon;
                return (
                  <button
                    key={cta.key}
                    onClick={() => handleSelect(cta.key)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all",
                      "hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50",
                      "active:translate-y-0 active:shadow-md",
                      "cursor-pointer",
                      isRouting && "pointer-events-none opacity-60",
                    )}
                  >
                    <div className="relative z-10">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-all group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mb-1 text-sm font-semibold text-slate-900">
                        {cta.title}
                      </p>
                      <p className="text-xs text-slate-500">{cta.blurb}</p>
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Feature Summary */}
      <section
        id="features"
        className="relative z-10 border-t border-purple-100/50 bg-white/80"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Features at a glance
            </h2>
            <p className="mt-2 text-slate-600">
              Everything you need to get from raw telemetry to real outcomes
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Gauge className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Health scoring
              </h3>
              <p className="text-sm text-slate-600">
                Continuously evaluate machine health with adaptive scoring.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Predictive alerts
              </h3>
              <p className="text-sm text-slate-600">
                Get ahead of failures with model-driven maintenance alerts.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Real-time telemetry
              </h3>
              <p className="text-sm text-slate-600">
                Low-latency dashboards for metrics, events, and anomalies.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Unified data
              </h3>
              <p className="text-sm text-slate-600">
                Ingest from sensors and systems into a clean, unified model.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Secure by design
              </h3>
              <p className="text-sm text-slate-600">
                Granular access and best-practice data handling.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Actionable insights
              </h3>
              <p className="text-sm text-slate-600">
                Surface trends that drive throughput and uptime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-purple-100/50 bg-gradient-to-b from-white to-purple-50/40"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-slate-600">
              From first connection to insights in minutes
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: 1,
                title: "Describe your setup",
                body: "Use the prompt or quick-start options to define your machine and goals.",
              },
              {
                step: 2,
                title: "Connect your data",
                body: "Stream live telemetry via MQTT—works with any MQTT-compatible software like Kepware or Ignition.",
              },
              {
                step: 3,
                title: "Monitor and act",
                body: "See health scores, anomalies, and alerts—then automate responses.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                  {s.step}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations / Compatibility */}
      <section
        id="integrations"
        className="relative z-10 border-t border-purple-100/50 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Integrations & compatibility
            </h2>
            <p className="mt-2 text-slate-600">
              Plug into protocols, services, and data sources you already use
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "MQTT", icon: Plug },
              { label: "Kepware", icon: Server },
              { label: "Ignition", icon: Server },
            ].map((i) => {
              const Icon = i.icon;
              return (
                <span
                  key={i.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                >
                  <Icon className="h-4 w-4 text-purple-600" /> {i.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outcomes / Metrics */}
      <section
        id="outcomes"
        className="relative z-10 border-t border-purple-100/50 bg-gradient-to-b from-purple-50/40 to-white"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Outcomes you can measure
            </h2>
            <p className="mt-2 text-slate-600">
              Proven improvements across uptime, maintenance, and throughput
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold text-slate-900">30%</div>
              <div className="mt-1 text-sm text-slate-600">
                Reduction in unplanned downtime
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold text-slate-900">
                15 min
              </div>
              <div className="mt-1 text-sm text-slate-600">
                From connect to first dashboard
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold text-slate-900">+12%</div>
              <div className="mt-1 text-sm text-slate-600">
                Throughput uplift with insights
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="footer"
        className="relative z-10 border-t border-purple-100/50 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Image
                src="/microai-logo-dark.svg"
                alt="MicroAI"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
              <p className="mt-3 text-sm text-slate-600">
                Observability and performance insights for machines, networks,
                and infrastructure.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Resources
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    DPA
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
            © {new Date().getFullYear()} MicroAI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function LandingMessage({ message }: { message: ChatMessage }) {
  const isAssistant = message.author === "assistant";
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback
          className={cn(
            isAssistant
              ? "bg-purple-100 text-purple-700"
              : "bg-slate-900 text-white",
          )}
        >
          IQ
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "w-full rounded-2xl border px-4 py-3 text-sm shadow-sm",
          isAssistant
            ? "border-purple-100 bg-white text-slate-700"
            : "border-slate-900 bg-slate-900 text-white",
        )}
      >
        {message.variant === "code" ? (
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-900/90 p-3 text-xs text-purple-100">
            {message.text}
          </pre>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        )}
      </div>
    </div>
  );
}
