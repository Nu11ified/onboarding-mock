'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, BellOff } from 'lucide-react';

interface NotificationPreferencesWidgetProps {
  onConfirm: (enabled: boolean) => Promise<void>;
}

export function NotificationPreferencesWidget({
  onConfirm,
}: NotificationPreferencesWidgetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChoice = async (enabled: boolean) => {
    setIsSubmitting(true);
    try {
      await onConfirm(enabled);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[320px] space-y-4 rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Email Notifications
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Get notified when tickets are automatically generated for your device
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleChoice(true)}
          disabled={isSubmitting}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Enable Notifications
            </>
          )}
        </Button>

        <Button
          onClick={() => handleChoice(false)}
          disabled={isSubmitting}
          variant="outline"
          className="flex-1 border-purple-300 text-slate-700 hover:bg-slate-50"
        >
          <BellOff className="mr-2 h-4 w-4" />
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
