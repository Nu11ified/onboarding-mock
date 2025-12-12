'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MQTTInstructionsPanel } from './MQTTInstructionsPanel';
import { ChannelConfigHelpPanel, MachineConfigHelpPanel } from './StatusPanel';
import { useRightSidePanelOptional } from './RightSidePanelContext';
import { HealthMetricsHelpPanel } from './HealthMetricsHelpPanel';

export type InfoType =
  | 'health-metrics'
  | 'mqtt-connection'
  | 'mqtt-setup'
  | 'machine-config-help'
  | 'channel-config-help'
  | 'machine-details'
  | 'custom';

interface InfoPopupButtonProps {
  type: InfoType;
  title: string;
  buttonText?: string;
  children?: React.ReactNode;
  data?: any;
  className?: string;
}

export function InfoPopupButton({
  type,
  title,
  buttonText = 'View Details',
  children,
  data,
  className,
}: InfoPopupButtonProps) {
  // Some callers historically pass a nested payload under `data` (e.g. data.infoType/data.buttonText).
  // Normalize that here so the button label + panel routing always work.
  const normalized = useMemo(() => {
    const maybe: any = data;
    const hasNestedPayload =
      !children &&
      type === 'custom' &&
      maybe &&
      typeof maybe === 'object' &&
      (maybe.infoType || maybe.title || maybe.buttonText || maybe.content);

    const normalizedType: InfoType = (hasNestedPayload ? maybe.infoType : type) || type;
    const normalizedTitle = (hasNestedPayload ? maybe.title : title) || title;

    const defaultButtonTextForType = (t: InfoType) => {
      if (t === 'machine-config-help') return 'View Parameter Configuration Info';
      if (t === 'channel-config-help') return 'View Channel Configuration Info';
      if (t === 'mqtt-setup') return 'View MQTT Configuration Info';
      if (t === 'health-metrics') return 'View Metrics Explanation';
      return 'View Details';
    };

    const normalizedButtonTextRaw =
      (hasNestedPayload ? maybe.buttonText : buttonText) || buttonText;
    const normalizedButtonText =
      normalizedButtonTextRaw === 'View Details'
        ? defaultButtonTextForType(normalizedType)
        : normalizedButtonTextRaw;

    const normalizedData = hasNestedPayload
      ? (maybe.content ?? maybe.data ?? maybe)
      : data;

    return {
      type: normalizedType,
      title: normalizedTitle,
      buttonText: normalizedButtonText,
      data: normalizedData,
    };
  }, [children, type, title, buttonText, data]);

  const rightPanel = useRightSidePanelOptional();
  const useSidePanel =
    !!rightPanel &&
    (normalized.type === 'machine-config-help' ||
      normalized.type === 'channel-config-help' ||
      normalized.type === 'mqtt-setup' ||
      normalized.type === 'health-metrics');

  const [open, setOpen] = useState(false);

  const mqtt = useMemo(() => {
    return {
      brokerEndpoint: (normalized.data as any)?.brokerEndpoint,
      brokerPort: (normalized.data as any)?.brokerPort,
      topic: (normalized.data as any)?.topic,
    };
  }, [normalized.data]);

  const renderContent = () => {
    if (children) return children;

    switch (normalized.type) {
      case 'health-metrics':
        return <HealthMetricsHelpPanel />;

      case 'mqtt-connection':
        return (
          <div className="space-y-3">
            {(normalized.data as any)?.brokerEndpoint && (
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Broker Endpoint</div>
                <div className="font-mono text-sm text-slate-900">{(normalized.data as any).brokerEndpoint}</div>
              </div>
            )}
            {(normalized.data as any)?.brokerPort && (
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Port</div>
                <div className="font-mono text-sm text-slate-900">{(normalized.data as any).brokerPort}</div>
              </div>
            )}
            {(normalized.data as any)?.topic && (
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Topic</div>
                <div className="font-mono text-sm text-slate-900">{(normalized.data as any).topic}</div>
              </div>
            )}
          </div>
        );

      case 'mqtt-setup':
        return (
          <MQTTInstructionsPanel
            brokerEndpoint={mqtt.brokerEndpoint}
            brokerPort={mqtt.brokerPort}
            topic={mqtt.topic}
          />
        );

      case 'machine-config-help':
        return <MachineConfigHelpPanel />;

      case 'channel-config-help':
        return <ChannelConfigHelpPanel />;

      case 'machine-details':
        return (
          <div className="space-y-3">
            {normalized.data &&
              Object.entries(normalized.data).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-slate-900">{String(value)}</div>
                </div>
              ))}
          </div>
        );

      default:
        return <p className="text-sm text-slate-600">Information not available.</p>;
    }
  };

  if (useSidePanel) {
    const panelType =
      normalized.type === 'machine-config-help'
        ? 'machine-config-help'
        : normalized.type === 'channel-config-help'
          ? 'channel-config-help'
          : normalized.type === 'health-metrics'
            ? 'health-metrics'
            : 'mqtt-setup';

    return (
      <button
        type="button"
        onClick={() =>
          rightPanel?.openPanel({
            type: panelType,
            title: normalized.title,
            data: panelType === 'mqtt-setup' ? mqtt : normalized.data,
          })
        }
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 hover:border-purple-300',
          className,
        )}
      >
        <Info className="h-4 w-4" />
        {normalized.buttonText}
      </button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 hover:border-purple-300",
            className
          )}
        >
          <Info className="h-4 w-4" />
          {normalized.buttonText}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-purple-200 bg-white p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-slate-900">
              {normalized.title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4">
            {renderContent()}
          </div>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
