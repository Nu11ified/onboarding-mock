'use client';

import { useState } from 'react';
import { Check, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingMode } from '@/lib/onboarding/types';

interface DeviceOptionWidgetProps {
  onSelect: (mode: OnboardingMode) => Promise<void>;
}

export function DeviceOptionWidget({ onSelect }: DeviceOptionWidgetProps) {
  const [selected, setSelected] = useState<OnboardingMode | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (mode: OnboardingMode) => {
    setSelected(mode);
    setLoading(true);
    try {
      await onSelect(mode);
    } catch (err) {
      console.error('Failed to select machine mode:', err);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    {
      mode: 'demo' as OnboardingMode,
      icon: Zap,
      title: 'Demo Machine',
      description: 'Quick start with a pre-configured demo machine',
      features: [
        'Pre-configured settings',
        'Instant setup (< 1 minute)',
        'Sample data streaming',
        'Perfect for exploring features',
      ],
      recommended: true,
    },
    {
      mode: 'live' as OnboardingMode,
      icon: Settings,
      title: 'Live Machine',
      description: 'Configure your own machine with custom settings',
      features: [
        'Custom configuration',
        'MQTT connection compatible with Kepware, Ignition, and other industrial software platforms',
        'Your real sensor data',
        'Production-ready setup',
      ],
      recommended: false,
    },
  ];

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          How would you like to onboard your machine?
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Choose how you want to set up your machine monitoring
        </p>
      </div>

      <div className="grid gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.mode;
          const isDisabled = loading && !isSelected;

          return (
            <button
              key={option.mode}
              onClick={() => handleSelect(option.mode)}
              disabled={loading}
              className={cn(
                'group relative overflow-hidden rounded-xl border p-4 text-left transition-all',
                'hover:border-purple-300 hover:shadow-md',
                isSelected && 'border-purple-500 bg-purple-50',
                isDisabled && 'opacity-50 cursor-not-allowed',
                !isSelected && !isDisabled && 'border-slate-200 bg-white'
              )}
            >
              {option.recommended && (
                <div className="absolute right-3 top-3">
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {option.title}
                    </h4>
                    {isSelected && (
                      <Check className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {option.description}
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {option.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-600"
                      >
                        <div className="h-1 w-1 rounded-full bg-purple-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {isSelected && loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    Setting up...
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs text-slate-600">
          💡 <span className="font-semibold">Note:</span> You can add multiple machines later,
          both demo and live machines can coexist in your dashboard.
        </p>
      </div>
    </div>
  );
}
