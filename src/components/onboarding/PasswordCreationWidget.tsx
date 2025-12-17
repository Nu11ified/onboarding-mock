'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, Check, X, Mail, Smartphone, RefreshCw } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { isValidOtp } from '@/lib/onboarding/utils';

export type PasswordCreationStep = 'select-method' | 'verify-otp' | 'create-password';
type OtpMethod = 'email' | 'phone';

export interface StepInfo {
  step: PasswordCreationStep;
  selectedMethod: OtpMethod | null;
  maskedEmail: string;
  maskedPhone: string;
}

interface PasswordCreationWidgetProps {
  onSubmit: (password: string) => Promise<void>;
  hideHeader?: boolean;
  embedded?: boolean;
  email?: string;
  phoneNumber?: string;
  onStepChange?: (info: StepInfo) => void;
}

// Helper to mask email: abs***@gmail.com
function maskEmail(email: string): string {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  const visibleChars = Math.min(3, localPart.length);
  const masked = localPart.slice(0, visibleChars) + '***';
  return `${masked}@${domain}`;
}

// Helper to mask phone: ***-***-**23
function maskPhone(phone: string): string {
  if (!phone) return '';
  // Extract just digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const lastFour = digits.slice(-4);
  const lastTwo = lastFour.slice(-2);
  return `***-***-**${lastTwo}`;
}

export function PasswordCreationWidget({
  onSubmit,
  hideHeader = false,
  embedded = false,
  email = '',
  phoneNumber = '',
  onStepChange
}: PasswordCreationWidgetProps) {
  const [step, setStep] = useState<PasswordCreationStep>('select-method');
  const [selectedMethod, setSelectedMethod] = useState<OtpMethod | null>(null);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const maskedEmail = maskEmail(email);
  const maskedPhone = maskPhone(phoneNumber);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.({
      step,
      selectedMethod,
      maskedEmail,
      maskedPhone
    });
  }, [step, selectedMethod, maskedEmail, maskedPhone, onStepChange]);

  // Step 1: Select OTP method
  const handleMethodSelect = (method: OtpMethod) => {
    setSelectedMethod(method);
  };

  const handleContinueToOtp = () => {
    if (selectedMethod) {
      setStep('verify-otp');
      setResendCooldown(60);
    }
  };

  // Step 2: OTP verification
  const handleOtpChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    setOtp(value);
    setOtpError(null);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otp.trim()) {
      setOtpError('Please enter the verification code');
      return;
    }

    if (!isValidOtp(otp)) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }

    setOtpLoading(true);
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('create-password');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to validate code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setOtpError(null);
    setResending(true);
    try {
      // Simulate resend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResendCooldown(60);
      setOtp('');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Password creation
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setError('Failed to create password. Please try again.');
      console.error('Password creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get header content based on step
  const getHeaderContent = () => {
    switch (step) {
      case 'select-method':
        return {
          title: 'Verify Your Identity',
          subtitle: 'Choose how you\'d like to receive your verification code'
        };
      case 'verify-otp':
        return {
          title: 'Verify OTP',
          subtitle: selectedMethod === 'email'
            ? `OTP sent to ${maskedEmail}`
            : `OTP sent to ${maskedPhone}`
        };
      case 'create-password':
        return {
          title: 'Create Your Password',
          subtitle: 'Secure your account with a strong password'
        };
    }
  };

  const header = getHeaderContent();

  return (
    <div className={embedded ? "space-y-4" : "space-y-4 rounded-xl border border-purple-200 bg-white p-4 shadow-sm"}>
      {!hideHeader && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {header.title}
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            {header.subtitle}
          </p>
        </div>
      )}

      {/* Step 1: Select OTP Method */}
      {step === 'select-method' && (
        <div className="space-y-3">
          {/* Email Option */}
          {email && (
            <button
              type="button"
              onClick={() => handleMethodSelect('email')}
              className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                selectedMethod === 'email'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20'
                  : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                selectedMethod === 'email' ? 'bg-purple-200' : 'bg-purple-100'
              }`}>
                <Mail className={`h-5 w-5 ${
                  selectedMethod === 'email' ? 'text-purple-700' : 'text-purple-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Send by email</p>
                <p className="text-xs text-slate-600">{maskedEmail}</p>
              </div>
              {selectedMethod === 'email' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          )}

          {/* Phone Option */}
          {phoneNumber && (
            <button
              type="button"
              onClick={() => handleMethodSelect('phone')}
              className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                selectedMethod === 'phone'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20'
                  : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                selectedMethod === 'phone' ? 'bg-purple-200' : 'bg-purple-100'
              }`}>
                <Smartphone className={`h-5 w-5 ${
                  selectedMethod === 'phone' ? 'text-purple-700' : 'text-purple-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Send by mobile text</p>
                <p className="text-xs text-slate-600">{maskedPhone}</p>
              </div>
              {selectedMethod === 'phone' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          )}

          <Button
            type="button"
            onClick={handleContinueToOtp}
            disabled={!selectedMethod}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'verify-otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Verification Code
            </label>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                disabled={otpLoading}
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

            {otpError && (
              <p className="mt-2 text-center text-xs text-red-600">{otpError}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={otpLoading || otp.length !== 6}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {otpLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

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

          <div className="rounded-lg bg-purple-50 p-3">
            <p className="text-xs text-slate-600">
              {selectedMethod === 'email'
                ? "Check your spam folder if you don't see the email"
                : "Standard SMS rates may apply. Check your messages for the verification code."
              }
            </p>
          </div>
        </form>
      )}

      {/* Step 3: Password Creation */}
      {step === 'create-password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-purple-200 px-3 py-2 pr-10 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {password.length > 0 && (
              <div className="space-y-1.5 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">Password Requirements:</p>
                {passwordRequirements.map((req, idx) => {
                  const passed = req.test(password);
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {passed ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-slate-400" />
                      )}
                      <span className={passed ? 'text-green-700' : 'text-slate-600'}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-lg border border-purple-200 px-3 py-2 pr-10 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  {passwordsMatch ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="text-green-700">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 text-red-600" />
                      <span className="text-red-700">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account & Continue'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
