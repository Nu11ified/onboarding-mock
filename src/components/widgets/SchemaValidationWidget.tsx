'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Loader2, Server, FileJson, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ValidationPhase = 'starting' | 'waiting' | 'validating' | 'success';

interface SchemaValidationWidgetProps {
  onComplete?: () => void;
}

export function SchemaValidationWidget({ onComplete }: SchemaValidationWidgetProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<ValidationPhase>('starting');
  const completedRef = useRef(false);
  const [rawData, setRawData] = useState<Array<{ ts: number; temperature: number; pressure: number; vibration: number }>>([]);

  // Simulate live telemetry
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Phase 1: Starting Container (0-20%)
        if (prev < 20) {
          setPhase('starting');
          return prev + 1;
        }
        // Phase 2: Waiting for data (21-50%)
        if (prev < 50) {
          setPhase('waiting');
          return prev + 1;
        }
        // Phase 3: Validating Schema (51-80%)
        if (prev < 80) {
          setPhase('validating');
          return prev + 1;
        }
        // Phase 4: Success (81-100%)
        if (prev < 100) {
          setPhase('success');
          return prev + 1;
        }
        
        // Complete
        clearInterval(interval);
        if (onComplete && !completedRef.current) {
          completedRef.current = true;
          setTimeout(onComplete, 500);
        }
        return 100;
      });
    }, 80); // Adjust speed (total ~8 seconds)

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Container Initialization
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Setting up data ingestion pipeline
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
                {JSON.stringify({ ts: s.ts, temperature: s.temperature, pressure: s.pressure, vibration: s.vibration })}
              </div>
            ))}
            {rawData.length === 0 && (
              <div className="text-slate-400">Waiting for data...</div>
            )}
          </div>
        </div>

        {/* Phase Indicators */}
        <div className="space-y-2">
          {/* Starting */}
          <div className="flex items-center gap-3">
            {progress >= 0 && progress <= 20 ? (
              <div className="relative flex h-6 w-6 items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-blue-100 opacity-75" />
                <div className="relative h-3 w-3 rounded-full bg-blue-600" />
              </div>
            ) : progress > 20 ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            )}
            <span className={cn(
              "transition-all duration-300",
              progress <= 20 ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-500"
            )}>
              Starting Container
            </span>
          </div>

          {/* Waiting */}
          <div className="flex items-center gap-3">
            {progress > 20 && progress <= 50 ? (
              <div className="relative flex h-6 w-6 items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-blue-100 opacity-75" />
                <div className="relative h-3 w-3 rounded-full bg-blue-600" />
              </div>
            ) : progress > 50 ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            )}
            <span className={cn(
              "transition-all duration-300",
              progress > 20 && progress <= 50 ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-500"
            )}>
              Waiting for data
            </span>
          </div>

          {/* Validating */}
          <div className="flex items-center gap-3">
            {progress > 50 && progress <= 80 ? (
              <div className="relative flex h-6 w-6 items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-blue-100 opacity-75" />
                <div className="relative h-3 w-3 rounded-full bg-blue-600" />
              </div>
            ) : progress > 80 ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            )}
            <span className={cn(
              "transition-all duration-300",
              progress > 50 && progress <= 80 ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-500"
            )}>
              Validating Schema
            </span>
          </div>

          {/* Success */}
          <div className="flex items-center gap-3">
            {progress > 80 && progress < 100 ? (
              <div className="relative flex h-6 w-6 items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-blue-100 opacity-75" />
                <div className="relative h-3 w-3 rounded-full bg-blue-600" />
              </div>
            ) : progress === 100 ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            )}
            <span className={cn(
              "transition-all duration-300",
              progress > 80 ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-500"
            )}>
              Validating Schema Success
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-right text-xs font-medium text-slate-600 tabular-nums">
            {progress}%
          </span>
          <span className="text-xs text-slate-500">
            {progress < 100 ? `~${Math.ceil((100 - progress) * 0.08)}s remaining` : 'Complete'}
          </span>
        </div>
      </div>
    </div>
  );
}
