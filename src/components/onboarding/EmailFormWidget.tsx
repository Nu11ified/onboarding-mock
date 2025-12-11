'use client';

import { useState } from 'react';
import { isValidEmail } from '@/lib/onboarding/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EmailFormWidgetProps {
  onSubmit: (email: string) => Promise<void>;
  initialEmail?: string;
  label?: string;
  helperText?: string;
  submitLabel?: string;
}

export function EmailFormWidget({
  onSubmit,
  initialEmail = '',
  label = 'Email Address',
  helperText = "We'll send you a verification code to confirm your email",
  submitLabel = 'Continue',
}: EmailFormWidgetProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
            {label}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-purple-200 px-4 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          {error && (
            <p className="mt-1.5 text-xs text-red-600">{error}</p>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
      {helperText ? (
        <p className="mt-3 text-xs text-slate-500 text-center">{helperText}</p>
      ) : null}
    </div>
  );
}
