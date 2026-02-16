'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_email', email);
        
        const pendingSession = localStorage.getItem('pending_session');
        
        if (pendingSession) {
          localStorage.removeItem('pending_session');
          router.push('/demo?continue-onboarding=true');
        } else {
          router.push('/dashboard?logged-in=true&onboarded=true');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Dark Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              width={140}
              height={40}
              className="h-10 w-auto brightness-0 invert"
            />
          </div>
          
          {/* Center Content */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Dashboard Preview */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg text-sm font-medium">
                  OEE 32%
                </div>
                <div className="flex gap-2">
                  <div className="bg-slate-700/50 px-3 py-1 rounded text-xs text-slate-300">
                    <span className="text-green-400">Active</span> 3000
                  </div>
                  <div className="bg-slate-700/50 px-3 py-1 rounded text-xs text-slate-300">
                    <span className="text-slate-500">Inactive</span> 1499
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Site Location</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['Lines', 'Zones', 'Stations', 'Assets'].map((label, i) => (
                    <div key={label} className="bg-slate-700/30 rounded p-2 text-center">
                      <div className="text-lg font-semibold text-white">{[2080, 2500, 1802, 102][i]}</div>
                      <div className="text-[10px] text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm italic mb-2">Intelligent Industrial Infrastructure:</p>
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Predictive Insights
              </span>
              <span className="text-white"> with 5G & IoT Connectivity</span>
            </h2>
          </div>
          
          {/* Feature Pills */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Advanced Data Modeling', color: 'bg-purple-500' },
              { label: 'Optimize OEE', color: 'bg-cyan-500' },
              { label: 'Edge-Native Security', color: 'bg-amber-500' },
              { label: 'Predictive Analytics', color: 'bg-blue-500' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`h-1 w-12 ${feature.color} rounded-full`} />
                <span className="text-slate-300 text-xs">{feature.label}</span>
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-700/50">
            <p className="text-slate-500 text-xs">
              © 2025 Copyright. All rights reserved | Privacy Policy | Terms & Conditions
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              width={120}
              height={32}
              className="h-8 w-auto mx-auto"
            />
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL*"
                required
                disabled={isLoading}
                className="w-full h-14 px-4 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD*"
                required
                disabled={isLoading}
                className="w-full h-14 px-4 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-purple-400 hover:bg-purple-500 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {isLoading ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/reset"
              className="text-purple-500 hover:text-purple-600 font-medium transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/signup"
              className="text-purple-500 hover:text-purple-600 font-medium transition-colors"
            >
              Click here to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
