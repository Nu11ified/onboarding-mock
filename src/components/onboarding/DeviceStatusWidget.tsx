'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Server, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

/** Formats seconds into a human-readable string */
function formatTimeRemaining(seconds: number): string {
  if (seconds < 1) return 'almost done';
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s remaining`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return remainingSeconds > 0 
    ? `${minutes}m ${remainingSeconds}s remaining`
    : `${minutes}m remaining`;
}

type DevicePhase = 'starting' | 'training' | 'complete' | 'error';

interface PersistedDeviceStatus {
  deviceId: string;
  status: 'spawning' | 'active' | 'error';
  phase: DevicePhase;
  progress: number;
  updatedAt: number;
}

function loadPersistedStatus(deviceId: string): PersistedDeviceStatus | null {
  try {
    const raw = localStorage.getItem(`device_status_${deviceId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.deviceId === deviceId) return parsed as PersistedDeviceStatus;
  } catch {}
  return null;
}

function savePersistedStatus(s: PersistedDeviceStatus) {
  try {
    localStorage.setItem(`device_status_${s.deviceId}`, JSON.stringify(s));
  } catch {}
}

interface DeviceStatusWidgetProps {
  deviceId: string;
  status: 'spawning' | 'active' | 'error';
  onComplete?: () => void;
  onRetry?: () => void;
  showTraining?: boolean;
  persist?: boolean; // whether to persist status/progress in localStorage
  labels?: {
    starting?: string;
    training?: string;
    complete?: string;
  };
}

export function DeviceStatusWidget({ 
  deviceId, 
  status: initialStatus, 
  onComplete,
  onRetry,
  showTraining = true,
  persist = true,
  labels = {}
}: DeviceStatusWidgetProps) {
  const [status, setStatus] = useState(initialStatus);
  const [phase, setPhase] = useState<DevicePhase>('starting');
  const [progress, setProgress] = useState(0);
  const [rawData, setRawData] = useState<Array<{ ts: number; temperature: number; pressure: number; vibration: number }>>([]);
  const deviceIdRef = useRef<string | null>(null);

  // Reset state when deviceId changes (important for new spawns)
  useEffect(() => {
    // If deviceId changed, reset everything
    if (deviceIdRef.current !== null && deviceIdRef.current !== deviceId) {
      setStatus(initialStatus);
      setPhase('starting');
      setProgress(0);
      setRawData([]);
      // Clear old persisted state for the old deviceId
      if (deviceIdRef.current && persist) {
        try {
          localStorage.removeItem(`device_status_${deviceIdRef.current}`);
        } catch {}
      }
    }
    deviceIdRef.current = deviceId;

    // Load persisted state only on initial mount or if deviceId matches persisted data
    if (persist) {
      const persisted = loadPersistedStatus(deviceId);
      if (persisted && persisted.deviceId === deviceId) {
        // Only load if it's for the current deviceId
        setStatus(persisted.status);
        setPhase(persisted.phase);
        setProgress(persisted.progress || 0);
      } else {
        // No persisted state or different deviceId - start fresh
        setStatus(initialStatus);
        setPhase('starting');
        setProgress(0);
      }
    } else {
      // Not persisting - always start fresh
      setStatus(initialStatus);
      setPhase('starting');
      setProgress(0);
    }
  }, [deviceId, initialStatus, persist]);

  // Persist on any change (optional)
  useEffect(() => {
    if (!persist) return;
    savePersistedStatus({
      deviceId,
      status,
      phase,
      progress,
      updatedAt: Date.now(),
    });
  }, [persist, deviceId, status, phase, progress]);

  // Fallback: if progress is still 0 after a short delay, kick off training
  useEffect(() => {
    const fallback = setTimeout(() => {
      setProgress((p) => {
        if (p === 0 && phase === 'starting') {
          setPhase('training');
          return 1;
        }
        return p;
      });
    }, 1200);
    return () => clearTimeout(fallback);
  }, [deviceId, phase]);

  // Simulate raw telemetry (persistent)
  useEffect(() => {
    if (status === 'error') return;
    
    const rawInterval = setInterval(() => {
      setRawData(prev => {
        const sample = {
          ts: Date.now(),
          temperature: +(20 + Math.random() * 10).toFixed(2),
          pressure: +(100 + Math.random() * 20).toFixed(2),
          vibration: +(0.1 + Math.random() * 1.5).toFixed(3),
        };
        const next = [...prev, sample].slice(-30);
        return next;
      });
    }, 800);
    
    return () => clearInterval(rawInterval);
  }, [status]);

  // Track if onComplete has been called to prevent duplicates
  const onCompleteCalledRef = useRef(false);

  // Phase transitions
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (phase === 'starting') {
      setProgress(0);
      const to = setTimeout(() => setPhase('training'), 800);
      cleanup = () => clearTimeout(to);
    } else if (phase === 'complete' && progress >= 100 && !onCompleteCalledRef.current) {
      // Only call onComplete once, after progress hits 100%
      onCompleteCalledRef.current = true;
      const to = setTimeout(() => {
        setStatus('active');
        try {
          localStorage.setItem('training_complete', JSON.stringify({ deviceId, completedAt: Date.now() }));
        } catch {}
        onComplete?.();
      }, 600); // Slightly longer delay to let user see 100%
      cleanup = () => clearTimeout(to);
    }

    return () => {
      cleanup?.();
    };
  }, [phase, progress, deviceId, onComplete]);

  // Robust progress incrementer (runs regardless of status)
  const progressIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'training' || progress >= 100) return;
    if (progressIntervalRef.current) return;

    const id = window.setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 1, 100);
        if (next >= 100) {
          window.clearInterval(id);
          progressIntervalRef.current = null;
          setPhase('complete');
        }
        return next;
      });
    }, 80);

    progressIntervalRef.current = id;
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [phase, progress]);

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Machine Setup Status
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Machine ID: <span className="font-mono">{deviceId}</span>
        </p>
      </div>

      <div className="space-y-4">
        {/* Live Raw Telemetry (simulated) */}
        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Server className="h-3.5 w-3.5" />
            Live telemetry (last {rawData.length} samples)
          </div>
          <div className="h-24 overflow-auto rounded bg-white p-2 text-[11px] font-mono text-slate-700 border border-slate-200">
            {rawData.map((s) => (
              <div key={s.ts} className="whitespace-pre">
                {JSON.stringify({ ts: s.ts, deviceId, temperature: s.temperature, pressure: s.pressure, vibration: s.vibration })}
              </div>
            ))}
            {rawData.length === 0 && (
              <div className="text-slate-400">Waiting for data...</div>
            )}
          </div>
        </div>
        {/* Phase Progress Indicators */}
        <div className="space-y-2">
          {/* Starting */}
          <div className="flex items-center gap-3">
            {(phase === 'starting' || phase === 'training' || phase === 'complete') ? (
              phase === 'starting' ? (
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <div className="absolute h-full w-full animate-ping rounded-full bg-blue-100 opacity-75" />
                  <div className="relative h-3 w-3 rounded-full bg-blue-600" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              )
            ) : null}
            <span className={cn(
              "transition-all duration-300",
              phase === 'starting' ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-500"
            )}>
              {labels.starting || 'Starting Container'}
            </span>
          </div>
          
          {/* Training */}
          {(phase === 'training' || phase === 'complete') && (
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {phase === 'training' ? (
                  <div className="relative flex h-6 w-6 items-center justify-center">
                    <div className="absolute h-full w-full animate-ping rounded-full bg-blue-100 opacity-75" />
                    <div className="relative h-3 w-3 rounded-full bg-blue-600" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <span className={cn(
                  "transition-all duration-300",
                  phase === 'training' ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-500"
                )}>
                  {labels.training || 'Training the Model'}
                </span>
              </div>
            </div>
          )}

          {/* Complete */}
          {phase === 'complete' && (
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <span className={cn(
                "transition-all duration-300",
                phase === 'complete' ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-500"
              )}>
                {labels.complete || 'Training Complete'}
              </span>
            </div>
          )}
        </div>
        
        {/* Progress Bar - Always show unless error */}
        {status !== 'error' && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="w-10 text-right text-xs font-medium text-slate-600 tabular-nums">
                {progress}%
              </span>
            </div>
            {phase === 'training' && progress < 100 && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{formatTimeRemaining(((100 - progress) * 0.08))}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
