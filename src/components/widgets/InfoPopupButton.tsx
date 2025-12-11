'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState } from 'react';
import { Info, X, Gauge, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MQTTInstructionsPanel } from './MQTTInstructionsPanel';
import { ChannelConfigHelpPanel, MachineConfigHelpPanel } from './StatusPanel';

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
  const [open, setOpen] = useState(false);

  const mqtt = useMemo(() => {
    return {
      brokerEndpoint: data?.brokerEndpoint,
      brokerPort: data?.brokerPort,
      topic: data?.topic,
    };
  }, [data?.brokerEndpoint, data?.brokerPort, data?.topic]);

  const renderContent = () => {
    if (children) return children;

    switch (type) {
      case 'health-metrics':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Gauge className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Health Score</h4>
                  <p className="text-sm text-slate-600">
                    A real-time indicator of your machine&apos;s operational health, calculated from sensor behavior,
                    historical patterns, and AI-driven anomaly detection. Use this as a high-level signal for when
                    attention is needed, rather than a precise engineering value.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Duty Rate</h4>
                  <p className="text-sm text-slate-600">
                    Describes how heavily the machine is being used over time (run time versus idle time). It helps you
                    contextualize health and maintenance recommendations against real utilization, without needing to
                    track percentages manually.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Days to Maintenance</h4>
                  <p className="text-sm text-slate-600">
                    An AI-derived estimate of how long you have before maintenance is likely required, based on current
                    health trends and usage. It is designed to support planning—not to replace your existing
                    maintenance policies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'mqtt-connection':
        return (
          <div className="space-y-3">
            {data?.brokerEndpoint && (
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Broker Endpoint</div>
                <div className="font-mono text-sm text-slate-900">{data.brokerEndpoint}</div>
              </div>
            )}
            {data?.brokerPort && (
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Port</div>
                <div className="font-mono text-sm text-slate-900">{data.brokerPort}</div>
              </div>
            )}
            {data?.topic && (
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Topic</div>
                <div className="font-mono text-sm text-slate-900">{data.topic}</div>
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
            {data && Object.entries(data).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-sm text-slate-900">{String(value)}</div>
              </div>
            ))}
          </div>
        );

      default:
        return <p className="text-sm text-slate-600">Information not available.</p>;
    }
  };

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
          {buttonText}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl border border-purple-200 bg-white p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-slate-900">
              {title}
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
