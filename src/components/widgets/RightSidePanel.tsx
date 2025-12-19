'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RightSidePanelState } from './RightSidePanelContext';
import { MQTTInstructionsPanel } from './MQTTInstructionsPanel';
import { ChannelConfigHelpPanel, MachineConfigHelpPanel } from './StatusPanel';
import { HealthMetricsHelpPanel } from './HealthMetricsHelpPanel';
import { AgenticWorkflowHelpPanel } from './AgenticWorkflowHelpPanel';
import { WhatCanIDoNextPanel } from './WhatCanIDoNextPanel';
import { TrainingVideoPanel } from './TrainingVideoPanel';

export function RightSidePanel({
  panel,
  onClose,
  className,
  showHeader = false,
}: {
  panel: RightSidePanelState;
  onClose?: () => void;
  className?: string;
  showHeader?: boolean;
}) {
  const title =
    panel.title ||
    (panel.type === 'machine-config-help'
      ? 'Parameter configuration'
      : panel.type === 'channel-config-help'
        ? 'Channel configuration'
        : panel.type === 'health-metrics'
          ? 'Dashboard metrics explained'
          : panel.type === 'agentic-workflow'
            ? 'Agentic Workflow Capabilities'
            : panel.type === 'what-can-i-do-next'
              ? 'What can I do next?'
              : panel.type === 'training-video'
                ? 'Training Video'
                : 'MQTT configuration');

  return (
    <div
      className={cn(
        'h-full w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative',
        className,
      )}
      aria-label={title}
    >
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Close button in top-right corner inside the panel when header is hidden */}
      {!showHeader && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex-1 overflow-auto p-4 pt-4">
        {panel.type === 'machine-config-help' && <MachineConfigHelpPanel />}
        {panel.type === 'channel-config-help' && <ChannelConfigHelpPanel />}
        {panel.type === 'health-metrics' && <HealthMetricsHelpPanel />}
        {panel.type === 'agentic-workflow' && <AgenticWorkflowHelpPanel />}
        {panel.type === 'what-can-i-do-next' && <WhatCanIDoNextPanel />}
        {panel.type === 'mqtt-setup' && (
          <MQTTInstructionsPanel
            brokerEndpoint={panel.data?.brokerEndpoint}
            brokerPort={panel.data?.brokerPort}
            topic={panel.data?.topic}
          />
        )}
        {panel.type === 'training-video' && (
          <TrainingVideoPanel
            videoUrl={panel.data?.url}
            title={panel.data?.title || 'What you unlock with onboarding'}
            description={
              panel.data?.description ??
              'See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.'
            }
            duration={panel.data?.duration}
            headingTitle={'Understanding activation of a machine'}
            headingDescription={''}
          />
        )}
      </div>
    </div>
  );
}
