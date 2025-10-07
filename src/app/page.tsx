"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gauge,
  Zap,
  Activity,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Database,
  Plus,
  Send,
  Shield,
  Plug,
  Server,
  Boxes,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

export default function LandingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isRouting, setIsRouting] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<CtaKey | null>(null);

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
    setIsRouting(true);

    // Navigate to dashboard with the scenario
    router.push(`/dashboard?scenario=${selectedScenario}`);
  };

  return (
    <main className="landing-ambient relative flex min-h-screen flex-col overflow-hidden text-slate-900">
      <div className="landing-glow absolute inset-0" aria-hidden />

      {/* Lovable-style Top Bar */}
      <header className="relative z-20 border-b border-purple-100/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <a href="#" className="transition hover:text-slate-900">
                Pricing
              </a>
              <a href="#" className="transition hover:text-slate-900">
                Learn
              </a>
              <a href="#" className="transition hover:text-slate-900">
                Resources
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Log in
            </button>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
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
            <div className="rounded-[22px] bg-white p-6">
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
                  {/* Plus Button with Attach Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-purple-200 text-slate-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-slate-900"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    {showAttachMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl border border-purple-200 bg-white p-2 shadow-xl">
                        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-purple-50">
                          <ImageIcon className="h-4 w-4" />
                          <span>Upload photos</span>
                        </button>
                        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-purple-50">
                          <FileText className="h-4 w-4" />
                          <span>Attach files</span>
                        </button>
                        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-purple-50">
                          <Database className="h-4 w-4" />
                          <span>Connect data source</span>
                        </button>
                        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-purple-50">
                          <Gauge className="h-4 w-4" />
                          <span>Import machine config</span>
                        </button>
                      </div>
                    )}
                  </div>
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
      <section id="features" className="relative z-10 border-t border-purple-100/50 bg-white/80">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Features at a glance</h2>
            <p className="mt-2 text-slate-600">Everything you need to get from raw telemetry to real outcomes</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Gauge className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Health scoring</h3>
              <p className="text-sm text-slate-600">Continuously evaluate machine health with adaptive scoring.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Predictive alerts</h3>
              <p className="text-sm text-slate-600">Get ahead of failures with model-driven maintenance alerts.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Real-time telemetry</h3>
              <p className="text-sm text-slate-600">Low-latency dashboards for metrics, events, and anomalies.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Unified data</h3>
              <p className="text-sm text-slate-600">Ingest from sensors and systems into a clean, unified model.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Secure by design</h3>
              <p className="text-sm text-slate-600">Granular access and best-practice data handling.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Actionable insights</h3>
              <p className="text-sm text-slate-600">Surface trends that drive throughput and uptime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 border-t border-purple-100/50 bg-gradient-to-b from-white to-purple-50/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">How it works</h2>
            <p className="mt-2 text-slate-600">From first connection to insights in minutes</p>
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
                body: "Bring in live telemetry via MQTT, OPC UA, or Modbus with guided templates.",
              },
              {
                step: 3,
                title: "Monitor and act",
                body: "See health scores, anomalies, and alerts—then automate responses.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                  {s.step}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations / Compatibility */}
      <section id="integrations" className="relative z-10 border-t border-purple-100/50 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Integrations & compatibility</h2>
            <p className="mt-2 text-slate-600">Plug into protocols, services, and data sources you already use</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "MQTT", icon: Plug },
              { label: "OPC UA", icon: Server },
              { label: "Modbus", icon: Boxes },
              { label: "REST API", icon: Server },
              { label: "Webhooks", icon: Server },
            ].map((i) => {
              const Icon = i.icon;
              return (
                <span key={i.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                  <Icon className="h-4 w-4 text-purple-600" /> {i.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outcomes / Metrics */}
      <section id="outcomes" className="relative z-10 border-t border-purple-100/50 bg-gradient-to-b from-purple-50/40 to-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Outcomes you can measure</h2>
            <p className="mt-2 text-slate-600">Proven improvements across uptime, maintenance, and throughput</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold text-slate-900">30%</div>
              <div className="mt-1 text-sm text-slate-600">Reduction in unplanned downtime</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold text-slate-900">15 min</div>
              <div className="mt-1 text-sm text-slate-600">From connect to first dashboard</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold text-slate-900">+12%</div>
              <div className="mt-1 text-sm text-slate-600">Throughput uplift with insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="relative z-10 border-t border-purple-100/50 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Image src="/microai-logo-dark.svg" alt="MicroAI" width={120} height={32} className="h-8 w-auto" />
              <p className="mt-3 text-sm text-slate-600">Observability and performance insights for machines, networks, and infrastructure.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">About</a></li>
                <li><a href="#" className="hover:text-slate-900">Careers</a></li>
                <li><a href="#" className="hover:text-slate-900">Blog</a></li>
                <li><a href="#" className="hover:text-slate-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Resources</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Docs</a></li>
                <li><a href="#" className="hover:text-slate-900">Guides</a></li>
                <li><a href="#" className="hover:text-slate-900">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Terms</a></li>
                <li><a href="#" className="hover:text-slate-900">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-slate-900">DPA</a></li>
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
