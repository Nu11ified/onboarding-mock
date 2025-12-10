'use client';

import { useState } from 'react';
import { Zap, Settings, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeviceMode = 'demo' | 'live';

interface WelcomeButtonsWidgetProps {
  onSelect: (mode: DeviceMode) => Promise<void>;
}

export function WelcomeButtonsWidget({ onSelect }: WelcomeButtonsWidgetProps) {
  const [loading, setLoading] = useState<DeviceMode | null>(null);

  const handleSelect = async (mode: DeviceMode) => {
    setLoading(mode);
    try {
      await onSelect(mode);
    } catch (err) {
      console.error('Failed to select mode:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {/* Onboard Your Device Button */}
        <button
          onClick={() => handleSelect('live')}
          disabled={loading !== null}
          className={cn(
            'flex-1 group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all',
            'hover:border-purple-400 hover:shadow-md',
            loading === 'live' && 'border-purple-500 bg-purple-50',
            loading !== null && loading !== 'live' && 'opacity-50 cursor-not-allowed',
            loading === null && 'border-purple-200 bg-white hover:bg-purple-50/50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
              loading === 'live'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
            )}>
              <Settings className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 truncate">
                  Onboard your device
                </h4>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 truncate">
                Connect your real machine
              </p>
            </div>
            <ArrowRight className={cn(
              'h-4 w-4 text-slate-300 transition-all',
              'group-hover:text-purple-500 group-hover:translate-x-0.5'
            )} />
          </div>

          {loading === 'live' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                Starting...
              </div>
            </div>
          )}
        </button>

        {/* Try Demo Device Button */}
        <button
          onClick={() => handleSelect('demo')}
          disabled={loading !== null}
          className={cn(
            'flex-1 group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all',
            'hover:border-purple-400 hover:shadow-md',
            loading === 'demo' && 'border-purple-500 bg-purple-50',
            loading !== null && loading !== 'demo' && 'opacity-50 cursor-not-allowed',
            loading === null && 'border-purple-200 bg-white hover:bg-purple-50/50'
          )}
        >
          {/* Recommended Badge */}
          <div className="absolute right-2 top-2">
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
              QUICK START
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
              loading === 'demo'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
            )}>
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 truncate">
                  Try demo device
                </h4>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 truncate">
                Explore with sample data
              </p>
            </div>
            <ArrowRight className={cn(
              'h-4 w-4 text-slate-300 transition-all',
              'group-hover:text-purple-500 group-hover:translate-x-0.5'
            )} />
          </div>

          {loading === 'demo' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                Starting...
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
