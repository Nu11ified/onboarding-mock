'use client';

import { useState } from 'react';
import { UserPlus, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountCreationSuggestionWidgetProps {
  onCreateAccount: () => Promise<void>;
  onSkip: () => Promise<void>;
}

export function AccountCreationSuggestionWidget({ 
  onCreateAccount, 
  onSkip 
}: AccountCreationSuggestionWidgetProps) {
  const [loading, setLoading] = useState<'create' | 'skip' | null>(null);

  const handleCreateAccount = async () => {
    setLoading('create');
    try {
      await onCreateAccount();
    } catch (err) {
      console.error('Failed to create account:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleSkip = async () => {
    setLoading('skip');
    try {
      await onSkip();
    } catch (err) {
      console.error('Failed to skip:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
          <CheckCircle2 className="h-6 w-6 text-purple-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Ready to Save Your Progress?
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Would you like to create an account so you can continue interacting with this device and view your dashboards?
        </p>
        <p className="mt-1 text-xs text-slate-500">
          We&apos;ll use the information you provided earlier to set up your account and send you a secure email to create your password.
        </p>
      </div>

      <div className="space-y-3">
        {/* Create Account Button */}
        <button
          onClick={handleCreateAccount}
          disabled={loading !== null}
          className={cn(
            'w-full group flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all',
            'bg-purple-600 border-purple-600 text-white',
            'hover:bg-purple-700 hover:border-purple-700',
            loading !== null && loading !== 'create' && 'opacity-50 cursor-not-allowed',
            loading === 'create' && 'opacity-75'
          )}
        >
          {loading === 'create' ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="font-medium">Creating account...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              <span className="font-medium">Yes, create my account</span>
            </>
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          disabled={loading !== null}
          className={cn(
            'w-full group flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all',
            'bg-white border-slate-200 text-slate-700',
            'hover:bg-slate-50 hover:border-slate-300',
            loading !== null && loading !== 'skip' && 'opacity-50 cursor-not-allowed',
            loading === 'skip' && 'opacity-75'
          )}
        >
          {loading === 'skip' ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
              <span className="font-medium">Saving session...</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5" />
              <span className="font-medium">No, I will come back later</span>
            </>
          )}
        </button>
      </div>

      {/* Info Note */}
      <p className="mt-4 text-center text-xs text-slate-500">
        Your session will be saved either way. Creating an account lets you access your data from any device.
      </p>
    </div>
  );
}
