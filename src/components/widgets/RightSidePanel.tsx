'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RightSidePanelState } from './RightSidePanelContext';
import { MQTTInstructionsPanel } from './MQTTInstructionsPanel';
import { ChannelConfigHelpPanel, MachineConfigHelpPanel } from './StatusPanel';
import { HealthMetricsHelpPanel } from './HealthMetricsHelpPanel';

export function RightSidePanel({
  panel,
  onClose,
  className,
  showHeader = true,
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
          : 'MQTT configuration');

  return (
    <div
      className={cn(
        'h-full w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col',
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

      <div className="flex-1 overflow-auto p-4">
        {panel.type === 'machine-config-help' && <MachineConfigHelpPanel />}
        {panel.type === 'channel-config-help' && <ChannelConfigHelpPanel />}
        {panel.type === 'health-metrics' && <HealthMetricsHelpPanel />}
        {panel.type === 'mqtt-setup' && (
          <MQTTInstructionsPanel
            brokerEndpoint={panel.data?.brokerEndpoint}
            brokerPort={panel.data?.brokerPort}
            topic={panel.data?.topic}
          />
        )}
      </div>
    </div>
  );
}
