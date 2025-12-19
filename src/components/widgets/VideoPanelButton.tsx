'use client';

import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRightSidePanelOptional } from './RightSidePanelContext';

export interface VideoPanelButtonProps {
  videoUrl?: string;
  title?: string;
  description?: string;
  duration?: string;
  buttonText?: string;
  className?: string;
}

export function VideoPanelButton({
  videoUrl = 'https://youtu.be/YQj_I-Zpx4Q',
  title = 'What you unlock with onboarding',
  description = 'See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.',
  duration = '5:30',
  buttonText = 'Onboarding Info',
  className,
}: VideoPanelButtonProps) {
  const rightPanel = useRightSidePanelOptional();

  const isVideoOpen = rightPanel?.panel?.type === 'training-video';

  const handleClick = () => {
    if (isVideoOpen) {
      rightPanel?.closePanel();
    } else {
      rightPanel?.openPanel({
        type: 'training-video',
        title: 'Training Video',
        data: {
          url: videoUrl,
          title,
          description,
          duration,
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
        isVideoOpen
          ? 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
          : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300',
        className,
      )}
    >
      {isVideoOpen ? (
        <>
          <X className="h-4 w-4" />
          Close Info
        </>
      ) : (
        <>
          <Info className="h-4 w-4" />
          {buttonText}
        </>
      )}
    </button>
  );
}
