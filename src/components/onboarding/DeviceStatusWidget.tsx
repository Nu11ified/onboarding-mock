'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type DevicePhase = 'starting' | 'schema-validation' | 'training' | 'complete' | 'error';

interface PersistedDeviceStatus {
  deviceId: string;
  status: 'spawning' | 'active' | 'error';
  phase: DevicePhase;
  progress: number;
  trainingProgress: number;
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
  showTraining?: boolean; // Show training phase for demo devices
}

export function DeviceStatusWidget({ 
  deviceId, 
  status: initialStatus, 
  onComplete,
  onRetry,
  showTraining = true
}: DeviceStatusWidgetProps) {
  const [status, setStatus] = useState(initialStatus);
  const [phase, setPhase] = useState<DevicePhase>('starting');
  const [progress, setProgress] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [rawData, setRawData] = useState<Array<{ ts: number; temperature: number; pressure: number; vibration: number }>>([]);

  // Load persisted state on mount
  useEffect(() => {
    const persisted = loadPersistedStatus(deviceId);
    if (persisted) {
      setStatus(persisted.status);
      setPhase(persisted.phase);
      setProgress(persisted.progress || 0);
      setTrainingProgress(persisted.trainingProgress || 0);
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
      trainingProgress,
      updatedAt: Date.now(),
    });
  }, [deviceId, status, phase, progress, trainingProgress]);

  useEffect(() => {
    if (status === 'spawning') {
      let cleanupFns: (() => void)[] = [];

      // Determine which phase to continue from
      if (phase === 'starting') {
        const startingInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 25) {
              clearInterval(startingInterval);
              return 25;
            }
            return prev + 5;
          });
        }, 300);
        cleanupFns.push(() => clearInterval(startingInterval));

        const schemaTimeout = setTimeout(() => {
          setPhase('schema-validation');
          setMessage('Validating data schema...');
          const schemaInterval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 50) {
                clearInterval(schemaInterval);
                return 50;
              }
              return prev + 5;
            });
          }, 400);
          cleanupFns.push(() => clearInterval(schemaInterval));
        }, Math.max(0, 3000));
        cleanupFns.push(() => clearTimeout(schemaTimeout));
      } else if (phase === 'schema-validation') {
        setMessage('Validating data schema...');
        const schemaInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 50) {
              clearInterval(schemaInterval);
              return 50;
            }
            return prev + 5;
          });
        }, 400);
        cleanupFns.push(() => clearInterval(schemaInterval));

        const trainingTimeout = setTimeout(() => {
          if (showTraining) {
            setPhase('training');
            setMessage('Training anomaly detection model...');
            setProgress(50);
          } else {
            setPhase('complete');
            setStatus('active');
            setProgress(100);
            if (onComplete) setTimeout(onComplete, 1000);
          }
        }, Math.max(0, 3000));
        cleanupFns.push(() => clearTimeout(trainingTimeout));
      } else if (phase === 'training') {
        setMessage(`Training anomaly detection model... (${Math.round(trainingProgress)}%)`);
        const trainingInterval = setInterval(() => {
          setTrainingProgress((prev) => {
            const newProgress = prev + 2;
            if (newProgress >= 100) {
              clearInterval(trainingInterval);
              setPhase('complete');
              setStatus('active');
              setProgress(100);
              localStorage.setItem('training_complete', JSON.stringify({ deviceId, completedAt: Date.now() }));
              if (onComplete) setTimeout(onComplete, 1000);
              return 100;
            }
            setProgress(50 + (newProgress / 2));
            return newProgress;
          });
        }, 400);
        cleanupFns.push(() => clearInterval(trainingInterval));
      }

      // Simulate raw telemetry during setup
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
      cleanupFns.push(() => clearInterval(rawInterval));

      return () => {
        cleanupFns.forEach(fn => fn());
      };
    }
  }, [status, phase, deviceId, onComplete, showTraining, trainingProgress]);

  useEffect(() => {
    // Update message based on phase
    if (status === 'spawning') {
      switch (phase) {
        case 'starting':
          setMessage('Initializing MI container...');
          break;
        case 'schema-validation':
          setMessage('Validating data schema format...');
          break;
        case 'training':
          setMessage(`Training anomaly detection model... (${Math.round(trainingProgress)}%)`);
          break;
        case 'complete':
          setMessage('Setup complete!');
          break;
      }
    } else if (status === 'active') {
      setMessage('Device is live and streaming data!');
    } else if (status === 'error') {
      setMessage('Failed to spawn device. Please try again.');
    }
  }, [status, phase, trainingProgress]);

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Device Setup Status
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Device ID: <span className="font-mono">{deviceId}</span>
        </p>
      </div>

      <div className="space-y-4">
        {/* Live Raw Telemetry (simulated) */}
        {status === 'spawning' && (
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
        )}
        {/* Phase Progress Indicators */}
        {status === 'spawning' && (
          <div className="space-y-2">
            {/* Starting */}
            <div className="flex items-center gap-2">
              {phase === 'starting' ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              <span className={cn(
                "text-xs font-medium",
                phase === 'starting' ? "text-purple-600" : "text-green-600"
              )}>
                Starting container
              </span>
            </div>
            
            {/* Schema Validation */}
            {(phase === 'schema-validation' || phase === 'training' || phase === 'complete') && (
              <div className="flex items-center gap-2">
                {phase === 'schema-validation' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  phase === 'schema-validation' ? "text-purple-600" : "text-green-600"
                )}>
                  Schema validation
                </span>
              </div>
            )}
            
            {/* Training */}
            {showTraining && (phase === 'training' || phase === 'complete') && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {phase === 'training' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    phase === 'training' ? "text-purple-600" : "text-green-600"
                  )}>
                    Training model
                  </span>
                </div>
                {phase === 'training' && (
                  <div className="ml-6">
                    <Progress value={trainingProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Status Icon & Message */}
        <div className="flex items-start gap-3">
          {status === 'spawning' && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}
          {status === 'active' && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          )}

          <div className="flex-1">
            <p className={cn(
              "text-sm font-semibold",
              status === 'spawning' && "text-purple-600",
              status === 'active' && "text-green-600",
              status === 'error' && "text-red-600"
            )}>
              {status === 'spawning' && (
                phase === 'starting' ? 'Starting Device...' :
                phase === 'schema-validation' ? 'Validating Schema...' :
                phase === 'training' ? 'Training Model...' :
                'Finalizing Setup...'
              )}
              {status === 'active' && 'Device Active'}
              {status === 'error' && 'Setup Failed'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {message}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {status === 'spawning' && (
          <div>
            <Progress value={progress} className="h-2" />
            <p className="mt-1 text-right text-xs text-slate-500">
              {progress}%
            </p>
          </div>
        )}

        {/* Success Message */}
        {status === 'active' && (
          <div className="rounded-lg bg-green-50 p-3">
            <div className="flex items-start gap-2">
              <Server className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-900">
                  Your device is ready!
                </p>
                <p className="mt-1 text-xs text-green-700">
                  The MI container is running and ready to process telemetry data. 
                  You can now configure your data source or proceed to the dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message with Retry */}
        {status === 'error' && onRetry && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs text-red-700">
                The device spawning process encountered an error. This could be due to:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-red-600">
                <li>• Network connectivity issues</li>
                <li>• Resource allocation constraints</li>
                <li>• Invalid configuration parameters</li>
              </ul>
            </div>
            <button
              onClick={onRetry}
              className="w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Retry Setup
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      {status === 'spawning' && (
        <div className="mt-4 rounded-lg bg-purple-50 p-3">
          <p className="text-xs text-slate-600">
            {showTraining 
              ? '⏱️ Training typically takes 40-50 seconds. Your model will be ready shortly.'
              : '⏱️ This process typically takes 10-30 seconds depending on your configuration'
            }
          </p>
        </div>
      )}
    </div>
  );
}
