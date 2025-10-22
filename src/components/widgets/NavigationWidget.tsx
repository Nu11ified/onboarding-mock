'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

interface NavigationWidgetProps {
  destination: string;
  delay?: number;
  message?: string;
}

export function NavigationWidget({ 
  destination, 
  delay = 2000, 
  message 
}: NavigationWidgetProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(Math.ceil(delay / 1000));
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigating(true);
      router.push(destination);
    }, delay);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [destination, delay, router]);

  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
          {isNavigating ? (
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          ) : (
            <ArrowRight className="h-6 w-6 text-purple-600" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">
            {isNavigating ? 'Navigating...' : 'Redirecting'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {message || `Taking you to ${destination}...`}
          </p>
          
          {!isNavigating && countdown > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-purple-200">
                <div
                  className="h-full bg-purple-600 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${((delay / 1000 - countdown) / (delay / 1000)) * 100}%`
                  }}
                />
              </div>
              <span className="text-xs font-medium text-purple-600">
                {countdown}s
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 rounded-lg bg-purple-50 p-3">
        <p className="text-xs text-slate-600">
          💡 <span className="font-semibold">Tip:</span> If you’re not redirected automatically,
          check that popups are not blocked.
        </p>
      </div>
    </div>
  );
}
