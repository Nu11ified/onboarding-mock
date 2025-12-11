'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestartOnboardingWidgetProps {
  message?: string;
  onRestart?: () => void;
}

export function RestartOnboardingWidget({
  message = "Want to onboard another machine or start fresh?",
  onRestart,
}: RestartOnboardingWidgetProps) {
  const router = useRouter();

  const handleRestart = () => {
    // Clear onboarding state
    localStorage.removeItem('onboarding_state');
    localStorage.removeItem('onboarding_complete');
    
    if (onRestart) {
      onRestart();
    }
    
    // Redirect to onboarding page
    router.push('/onboarding');
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
          <RefreshCw className="h-5 w-5 text-purple-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Start New Onboarding
          </h3>
          <p className="mt-1 text-sm text-slate-600">{message}</p>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleRestart}
              className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Restart Onboarding
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-purple-50 border border-purple-100 p-3">
        <p className="text-xs text-slate-600">
          💡 <span className="font-semibold">Note:</span> This will take you back to the beginning 
          where you can onboard a new demo or live machine. Your current dashboard data will remain accessible.
        </p>
      </div>
    </div>
  );
}
