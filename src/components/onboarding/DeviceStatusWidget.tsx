'use client';

import { useEffect, useState } from 'react';
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
  labels = {}
}: DeviceStatusWidgetProps) {
  const [status, setStatus] = useState(initialStatus);
  const [phase, setPhase] = useState<DevicePhase>('starting');
  const [progress, setProgress] = useState(0);
  const [rawData, setRawData] = useState<Array<{ ts: number; temperature: number; pressure: number; vibration: number }>>([]);

  // Load persisted state on mount
  useEffect(() => {
    const persisted = loadPersistedStatus(deviceId);
    if (persisted) {
      setStatus(persisted.status);
      setPhase(persisted.phase);
      setProgress(persisted.progress || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on any change
  useEffect(() => {
    savePersistedStatus({
      deviceId,
      status,
      phase,
      progress,
      updatedAt: Date.now(),
    });
  }, [deviceId, status, phase, progress]);

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

  useEffect(() => {
    if (status === 'spawning') {
      let cleanupFns: (() => void)[] = [];

      // Phase 1: Starting Container (0%)
      if (phase === 'starting') {
        setProgress(0);
        
        const startTimeout = setTimeout(() => {
          setPhase('training');
        }, 2000);
        cleanupFns.push(() => clearTimeout(startTimeout));
        
      } else if (phase === 'training') {
        // Phase 2: Training the Model (0-100%)
        const trainingInterval = setInterval(() => {
          setProgress((prev) => {
            const next = Math.min(prev + 1, 100);
            if (next >= 100) {
              clearInterval(trainingInterval);
              setPhase('complete');
            }
            return next;
          });
        }, 80); // Adjust speed here
        cleanupFns.push(() => clearInterval(trainingInterval));
        
      } else if (phase === 'complete') {
        // When training reaches 100%, mark as active and fire onComplete immediately
        const completeTimeout = setTimeout(() => {
          setStatus('active');
          localStorage.setItem('training_complete', JSON.stringify({ deviceId, completedAt: Date.now() }));
          if (onComplete) onComplete();
        }, 500);
        cleanupFns.push(() => clearTimeout(completeTimeout));
      }

      return () => {
        cleanupFns.forEach(fn => fn());
      };
    }
  }, [status, phase, deviceId, onComplete, showTraining]); // Removed progress dependency to avoid loop issues with interval

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
