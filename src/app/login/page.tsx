'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token/session
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_email', email);
        
        // Check if there's a pending session from non-login flow
        const pendingSession = localStorage.getItem('pending_session');
        
        if (pendingSession) {
          // Continue onboarding flow with session transfer
          localStorage.removeItem('pending_session');
          // Redirect to demo page to continue with post-login flow
          router.push('/demo?continue-onboarding=true');
        } else {
          // Regular login - redirect to dashboard
          router.push('/dashboard?logged-in=true');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              Welcome back
            </h1>
            <p className="text-slate-600">
              Sign in to access your MicroAI dashboard
            </p>
          </div>

          {/* Login Form */}
          <div className="rounded-2xl border border-purple-200 bg-white p-8 shadow-lg">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Don&apos;t have an account? Get started
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            MicroAI LaunchPad • Powered by GenAI
          </p>
        </div>
      </div>
    </div>
  );
}
