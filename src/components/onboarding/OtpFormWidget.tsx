'use client';

import { useState, useEffect } from 'react';
import { isValidOtp } from '@/lib/onboarding/utils';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface OtpFormWidgetProps {
  email?: string;
  onSubmit: (otp: string) => Promise<void>;
  onResend?: () => Promise<void>;
}

export function OtpFormWidget({ email, onSubmit, onResend }: OtpFormWidgetProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (!isValidOtp(otp)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!onResend || resendCooldown > 0) return;

    setError(null);
    setResending(true);
    try {
      await onResend();
      setResendCooldown(60); // 60 second cooldown
      setOtp(''); // Clear OTP field
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    // Enforce numeric input
    if (!/^\d*$/.test(value)) return;
    
    setOtp(value);
    setError(null);
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6 && isValidOtp(value)) {
      handleSubmit(new Event('submit') as any);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-700">
            Verification Code
          </label>
          {email && (
            <p className="mb-3 text-xs text-slate-600">
              Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
            </p>
          )}
          
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="border-purple-200" />
                <InputOTPSlot index={1} className="border-purple-200" />
                <InputOTPSlot index={2} className="border-purple-200" />
                <InputOTPSlot index={3} className="border-purple-200" />
                <InputOTPSlot index={4} className="border-purple-200" />
                <InputOTPSlot index={5} className="border-purple-200" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p className="mt-2 text-center text-xs text-red-600">{error}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={loading || otp.length !== 6} 
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>

        {onResend && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Resending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Resend code
                </>
              )}
            </button>
          </div>
        )}
      </form>
      
      <div className="mt-4 rounded-lg bg-purple-50 p-3">
        <p className="text-xs text-slate-600">
          💡 <span className="font-semibold">Tip:</span> Check your spam folder if you don&apos;t see the email
        </p>
      </div>
    </div>
  );
}
