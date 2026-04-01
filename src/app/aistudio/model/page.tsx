"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  User,
  Tag,
  SlidersHorizontal,
  Activity,
  List,
  ListChecks,
  Send,
  HelpCircle,
  ChevronDown,
  CloudDownload,
  Settings,
  Brain,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* ─── Types ─── */
type ModelSource = "train" | "upload" | "cloud";

type NavItem = {
  key: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  active?: boolean;
};

/* ─── AIStudio Sidebar Nav Items ─── */
const AI_NAV_ITEMS: NavItem[] = [
  { key: "import", label: "Import Data", icon: Upload, href: "/aistudio/model" },
  { key: "profiles", label: "Profiles", icon: User },
  { key: "labels", label: "Labels", icon: Tag },
  { key: "parameters", label: "Parameters", icon: SlidersHorizontal },
  { key: "model", label: "Run AtomML+", icon: Brain, active: true },
  { key: "results", label: "Results", icon: Activity },
  { key: "history", label: "History", icon: List },
  { key: "validation", label: "Validation", icon: ListChecks },
  { key: "deploy", label: "Deploy", icon: Send },
];

/* ─── Slider Parameter Config ─── */
type SliderParam = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  tooltip: string;
  unit?: string;
};

const SLIDER_PARAMS: SliderParam[] = [
  {
    key: "splitCounter",
    label: "Split Counter",
    min: 1,
    max: 1000,
    step: 1,
    defaultValue: 30,
    tooltip: "The period of the device's behavior in seconds. Training time should be 10x this value for ideal results.",
    unit: "s",
  },
  {
    key: "smallThreshold",
    label: "Small Threshold",
    min: 0.001,
    max: 1.0,
    step: 0.001,
    defaultValue: 0.01,
    tooltip: "Determines the minimum distance between the upper and lower bounds that they can converge to.",
  },
  {
    key: "initialPeriodSecs",
    label: "Initial Period Secs",
    min: 1,
    max: 300,
    step: 1,
    defaultValue: 15,
    tooltip: "How long AtomML+ delays sending data to the AI to begin training or executing.",
    unit: "s",
  },
  {
    key: "healthScoreDelay",
    label: "Health Score Delay",
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 10,
    tooltip: "The delay in loops between the AI starting and the health score calculation beginning.",
  },
  {
    key: "aiFeedRate",
    label: "AI Feed Rate",
    min: 100,
    max: 60000,
    step: 100,
    defaultValue: 1000,
    tooltip: "Rate at which data is fed to the AI engine in milliseconds. 1000ms recommended.",
    unit: "ms",
  },
];

/* ─── Mock Cloud Models ─── */
const CLOUD_MODELS = [
  { id: "model-1", name: "Vibration_Anomaly_v2.3", profile: "IntegrationData", date: "Mar 12, 2026" },
  { id: "model-2", name: "TemperaturePredict_v1.0", profile: "ThermalProfile", date: "Feb 28, 2026" },
  { id: "model-3", name: "PressureFault_v3.1", profile: "PressureMonitor", date: "Jan 15, 2026" },
  { id: "model-4", name: "MotorHealth_v2.0", profile: "MotorAnalysis", date: "Dec 3, 2025" },
];

/* ─── Source options config ─── */
const SOURCE_OPTIONS: {
  key: ModelSource;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: "train",
    label: "Train a new model",
    description: "Train a model using the parameters below (default option)",
    icon: Settings,
  },
  {
    key: "upload",
    label: "Upload model from local computer",
    description: "Use a pre-trained model from your computer",
    icon: Upload,
  },
  {
    key: "cloud",
    label: "Download model from cloud",
    description: "Download a pre-trained model from cloud storage",
    icon: CloudDownload,
  },
];

/* ═══════════════════════════════════════════════════
   AIStudio Sidebar
   ═══════════════════════════════════════════════════ */
function AISidebar() {
  return (
    <nav className="flex w-16 flex-col items-center border-r border-slate-800 bg-[#1a1f2e] py-4">
      {/* Logo */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center">
        <Image
          src="/microai-logo-dark.svg"
          alt="MicroAI"
          width={32}
          height={32}
          className="h-8 w-8 brightness-200 invert"
        />
      </div>

      {/* Nav Items */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {AI_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href || "#"}
              title={item.label}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                item.active
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom indicator */}
      <div className="mt-auto">
        <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════
   Parameter Slider — improved with inline input + reset
   ═══════════════════════════════════════════════════ */
function ParamSlider({
  param,
  value,
  onChange,
}: {
  param: SliderParam;
  value: number;
  onChange: (v: number) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const pct = ((value - param.min) / (param.max - param.min)) * 100;
  const isDefault = value === param.defaultValue;

  const formatValue = (v: number) => {
    if (param.step < 1) return v.toFixed(3);
    return v.toString();
  };

  const clamp = (v: number) => Math.min(param.max, Math.max(param.min, v));

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200">
      {/* Header: label + tooltip + value input */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {param.label}
          </span>
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-slate-800 px-3 py-2 text-xs leading-relaxed text-white shadow-xl z-30">
                {param.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Editable number input */}
          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
            <input
              type="number"
              value={value}
              min={param.min}
              max={param.max}
              step={param.step}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange(clamp(v));
              }}
              className="w-16 text-right text-sm font-medium text-slate-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {param.unit && (
              <span className="text-xs text-slate-400">{param.unit}</span>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={() => onChange(param.defaultValue)}
            disabled={isDefault}
            title="Reset to default"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded transition-colors",
              isDefault
                ? "text-slate-300 cursor-default"
                : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-500"
            )}
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Slider — native input styled via CSS for smooth dragging */}
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="param-slider w-full"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />

      {/* Min / Max labels */}
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <span>{formatValue(param.min)}</span>
        <span>{formatValue(param.max)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   File Upload Component
   ═══════════════════════════════════════════════════ */
function FileUploadArea() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setUploadedFile(e.dataTransfer.files[0].name);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadedFile(e.target.files[0].name);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors cursor-pointer",
          dragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-3 h-8 w-8 text-indigo-500" />
        <p className="text-sm text-slate-600">
          Drag & Drop or{" "}
          <span className="font-semibold text-indigo-600">Choose file</span>{" "}
          to upload
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Supported: .zip, .atomml, .bin model files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.atomml,.bin"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {uploadedFile && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700">
            <span className="font-medium">{uploadedFile}</span> ready for upload.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Cloud Model Selector
   ═══════════════════════════════════════════════════ */
function CloudModelSelector({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedModel = CLOUD_MODELS.find((m) => m.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm transition-colors",
          open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-300 hover:border-slate-400"
        )}
      >
        <span className={selectedModel ? "text-slate-800" : "text-slate-400"}>
          {selectedModel ? selectedModel.name : "Select a cloud model"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {CLOUD_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onChange(model.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-indigo-50",
                selected === model.id && "bg-indigo-50"
              )}
            >
              <div>
                <span className="text-sm font-medium text-slate-800">
                  {model.name}
                </span>
                <p className="text-xs text-slate-400">
                  Profile: {model.profile}
                </p>
              </div>
              <span className="text-xs text-slate-400">{model.date}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Train Parameters Panel
   ═══════════════════════════════════════════════════ */
function TrainParametersPanel({
  params,
  updateParam,
  autotuneOn,
  setAutotuneOn,
}: {
  params: Record<string, number>;
  updateParam: (key: string, value: number) => void;
  autotuneOn: boolean;
  setAutotuneOn: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Parameter Sliders */}
      <div>
        <h3 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
          AI General Parameters
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SLIDER_PARAMS.map((param) => (
            <ParamSlider
              key={param.key}
              param={param}
              value={params[param.key]}
              onChange={(v) => updateParam(param.key, v)}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Autotune */}
      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-slate-700">Autotune</p>
            <p className="text-xs text-slate-400">
              Automatically optimize parameters during training
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={autotuneOn} onCheckedChange={setAutotuneOn} />
          <span className="w-6 text-xs text-slate-500">
            {autotuneOn ? "On" : "Off"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */
export default function AIStudioModelPage() {
  const [modelSource, setModelSource] = useState<ModelSource>("train");
  const [autotuneOn, setAutotuneOn] = useState(false);
  const [cloudModel, setCloudModel] = useState("");
  const [params, setParams] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SLIDER_PARAMS.forEach((p) => (initial[p.key] = p.defaultValue));
    return initial;
  });

  const updateParam = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <AISidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* ── Top Header (AIStudio style) ── */}
        <div className="shrink-0 bg-white px-8 pt-4 pb-6">
          {/* Profile line */}
          <div className="mb-3 flex justify-end">
            <span className="text-sm text-indigo-600">
              Profile: <span className="font-semibold">IntegrationData</span>
            </span>
          </div>

          <div className="border-t border-slate-200 pt-5">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold tracking-wide text-slate-800 uppercase">
                  Run AtomML+
                </h1>
                <Image src="/book.svg" alt="Book" width={28} height={28} className="h-7 w-7" />
              </div>
              <button className="rounded bg-indigo-700 px-8 py-2.5 text-sm font-bold tracking-wide text-white uppercase transition-all hover:bg-indigo-800 active:scale-[0.98]">
                Proceed
              </button>
            </div>

            {/* Description */}
            <p className="mt-5 text-sm text-slate-600">
              Once you have all the parameters and abnormal points labeled you can run MicroAI&apos;s AIEngine.
              <br />
              This will emulate your device and train a model based on the parameters you have set in AIStudio.
            </p>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto w-full max-w-4xl space-y-6">
            {/* ── Model Source Selector (compact tabs with descriptions) ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-bold tracking-widest text-slate-500 uppercase">
                Model Source
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {SOURCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = modelSource === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setModelSource(opt.key)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-left transition-all",
                        active
                          ? "border-indigo-400 bg-indigo-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          active ? "bg-indigo-100" : "bg-slate-100"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-indigo-600" : "text-slate-400"
                          )}
                        />
                      </div>
                      <div>
                        <span
                          className={cn(
                            "text-sm font-medium leading-tight",
                            active ? "text-indigo-700" : "text-slate-600"
                          )}
                        >
                          {opt.label}
                        </span>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Configuration Card (dynamic content) ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xs font-bold tracking-widest text-slate-500 uppercase">
                {modelSource === "train" && "Training Configuration"}
                {modelSource === "upload" && "Upload Model"}
                {modelSource === "cloud" && "Cloud Model"}
              </h2>

              {modelSource === "train" && (
                <TrainParametersPanel
                  params={params}
                  updateParam={updateParam}
                  autotuneOn={autotuneOn}
                  setAutotuneOn={setAutotuneOn}
                />
              )}

              {modelSource === "upload" && <FileUploadArea />}

              {modelSource === "cloud" && (
                <CloudModelSelector
                  selected={cloudModel}
                  onChange={setCloudModel}
                />
              )}
            </div>

          </div>
        </div>

        {/* ── Sticky bottom bar ── */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-8 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-end">
            <button className="rounded-lg bg-indigo-600 px-10 py-3 text-sm font-bold tracking-wide text-white uppercase shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]">
              Start AtomML+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
