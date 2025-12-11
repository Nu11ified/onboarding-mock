'use client';

import { 
  Sparkles, 
  Gauge,
  Settings,
  Bell,
  Clock,
  RefreshCw,
  Wrench,
  Lightbulb,
  Layers,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MQTTInstructionsPanel } from './MQTTInstructionsPanel';
import { TrainingVideoPanel } from './TrainingVideoPanel';

export type OnboardingPhase = 
  | 'welcome'
  | 'email'
  | 'otp'
  | 'device-selection'
  | 'machine-details'
  | 'mqtt-validation'
  | 'channel-config'
  | 'training'
  | 'password-setup'
  | 'account-creation'
  | 'complete';

export type OnboardingMode = 'demo' | 'live';

interface StatusPanelProps {
  /** Current phase of onboarding */
  phase: OnboardingPhase;
  /** Demo or live mode */
  mode: OnboardingMode;
  /** MQTT broker details for live mode */
  mqttConfig?: {
    brokerEndpoint?: string;
    brokerPort?: number;
    topic?: string;
  };
  /** Video config for demo mode */
  videoConfig?: {
    url?: string;
    title?: string;
    description?: string;
    duration?: string;
  };
  className?: string;
}

function WelcomePanel() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Welcome to Machine Intelligence
      </h2>
      <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
        Let&apos;s get your machine connected and start monitoring its health. 
        This guide will walk you through each step of the setup process.
      </p>
      
      {/* Feature highlights */}
      <div className="mt-8 grid gap-4 w-full max-w-sm">
        {[
          { icon: Gauge, label: 'Health Monitoring', desc: 'Real-time health scores' },
          { icon: Settings, label: 'Easy Setup', desc: 'Connect in minutes' },
          { icon: Bell, label: 'Smart Alerts', desc: 'Predictive maintenance' },
        ].map((feature) => (
          <div key={feature.label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <feature.icon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900">{feature.label}</p>
              <p className="text-xs text-slate-500">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MachineConfigHelpPanel() {
  return (
    <div className="flex flex-col px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Machine Configuration</h2>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        These settings help our AI understand your machine&apos;s behavior and predict maintenance needs accurately.
      </p>

      {/* Field explanations */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Training Time</h3>
          </div>
          <p className="text-sm text-slate-600">
            The duration (in seconds) that our AI model will spend learning your machine&apos;s normal operating patterns. 
            A longer training time allows for more accurate analytics, insights and root cause detection.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Split Counter</h3>
          </div>
          <p className="text-sm text-slate-600">
            The time (in seconds) for one complete cycle of your machine. For example, if your machine updates every second 
            but completes a full operational cycle in 20 seconds, enter 20.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Days to Maintenance</h3>
          </div>
          <p className="text-sm text-slate-600">
            The typical interval (in days) between scheduled maintenance for your machine. This helps our AI predict 
            when the next maintenance should occur based on the health score trends.
          </p>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Tip</p>
            <p className="text-sm text-amber-700 mt-1">
              For ideal AI training, the training time should be about 10× your split counter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChannelConfigHelpPanel() {
  return (
    <div className="flex flex-col px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Channel Configuration</h2>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        Organize your sensor data into meaningful groups for more precise health monitoring and analytics.
      </p>

      {/* Explanations */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">What are Channels?</h3>
          </div>
          <p className="text-sm text-slate-600">
            Channels are the individual data tags from your machine&apos;s sensors. Each channel represents a specific 
            measurement like temperature, pressure, vibration, speed, or any other sensor reading your machine reports.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">What are Groups?</h3>
          </div>
          <p className="text-sm text-slate-600">
            Groups are collections of related channels. Each group gets its own isolated health score calculated 
            from only the sensor data within that group. This allows you to monitor different aspects of your 
            machine independently.
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Example</p>
          <p className="text-sm text-blue-700">
            You might create a &quot;Motor&quot; group with temperature and vibration channels, and a &quot;Hydraulics&quot; group
            with pressure and flow rate channels. Each group will have its own health score, making it easier
            to pinpoint issues.
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatusPanel({
  phase,
  mode,
  mqttConfig,
  videoConfig,
  className,
}: StatusPanelProps) {
  // Render content based on phase and mode
  // Show contextual help panels based on the current phase
  const renderContent = () => {
    // Machine details phase - show configuration help
    if (phase === 'machine-details') {
      return <MachineConfigHelpPanel />;
    }

    // Channel configuration phase - show channel/group help
    if (phase === 'channel-config') {
      return <ChannelConfigHelpPanel />;
    }

    // MQTT validation phase (live mode only) - show MQTT instructions
    if (phase === 'mqtt-validation' && mode === 'live') {
      return (
        <MQTTInstructionsPanel
          brokerEndpoint={mqttConfig?.brokerEndpoint}
          brokerPort={mqttConfig?.brokerPort}
          topic={mqttConfig?.topic}
        />
      );
    }

    // Demo mode - show video during training and keep it visible after completion
    if (mode === 'demo' && (phase === 'training' || phase === 'complete' || phase === 'account-creation')) {
      return (
        <TrainingVideoPanel
          videoUrl={videoConfig?.url}
          title={videoConfig?.title || 'What you unlock with onboarding'}
          description={
            videoConfig?.description ??
            'See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.'
          }
          duration={videoConfig?.duration}
          headingTitle={'Understanding activation of a machine'}
          headingDescription={''}
        />
      );
    }

    // Device selection phase - show demo video to help decision
    if (phase === 'device-selection') {
      return (
        <TrainingVideoPanel
          videoUrl={videoConfig?.url}
          title={videoConfig?.title || 'What you unlock with onboarding'}
          description={
            videoConfig?.description ??
            'See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.'
          }
          duration={videoConfig?.duration}
          headingTitle={'Understanding activation of a machine'}
          headingDescription={''}
        />
      );
    }

    // Default: show welcome placeholder for all other phases
    return <WelcomePanel />;
  };

  return (
    <div className={cn(
      'flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6',
      className
    )}>
      {renderContent()}
    </div>
  );
}
