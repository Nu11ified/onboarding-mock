'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordCreationWidgetProps {
  onSubmit: (password: string) => Promise<void>;
  hideHeader?: boolean;
}

export function PasswordCreationWidget({ onSubmit, hideHeader = false }: PasswordCreationWidgetProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-purple-200 bg-white p-4 shadow-sm"
    >
      {!hideHeader && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Create Your Password
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Secure your account with a strong password
          </p>
        </div>
      )}

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
  );
}
