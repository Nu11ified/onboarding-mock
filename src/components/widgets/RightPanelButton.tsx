'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRightSidePanelOptional, type RightSidePanelType } from './RightSidePanelContext';

export function RightPanelButton({
  panelType,
  title,
  buttonText,
  data,
  className,
}: {
  panelType: RightSidePanelType;
  title: string;
  buttonText?: string;
  data?: any;
  className?: string;
}) {
  const rightPanel = useRightSidePanelOptional();

  const defaultButtonTextForType = (t: RightSidePanelType) => {
    if (t === 'machine-config-help') return 'View Parameter Configuration Info';
    if (t === 'channel-config-help') return 'View Channel Configuration Info';
    if (t === 'mqtt-setup') return 'View MQTT Configuration Info';
    if (t === 'health-metrics') return 'What are the metrics?';
    if (t === 'ticket-hierarchy') return 'Ticket Overview';
    return 'View Details';
  };

  const label = buttonText && buttonText !== 'View Details'
    ? buttonText
    : defaultButtonTextForType(panelType);

  return (
    <button
      type="button"
      onClick={() =>
        rightPanel?.openPanel({
          type: panelType,
          title,
          data,
        })
      }
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 hover:border-purple-300',
        className,
      )}
    >
      <Info className="h-4 w-4" />
      {label}
    </button>
  );
}
