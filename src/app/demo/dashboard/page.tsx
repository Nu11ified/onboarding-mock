'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DemoDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // This page redirects to the regular dashboard but with special flags
    // to auto-select the machine view and continue the onboarding chat
    const onboarded = searchParams.get('onboarded');
    const showDashboard = searchParams.get('showDashboard');
    
    if (onboarded === 'true') {
      // Redirect to main dashboard with flags
      router.replace(`/dashboard?onboarded=${onboarded}&showDashboard=${showDashboard}&autoSelectMachine=true`);
    } else {
      // If accessed directly without onboarding, redirect to demo
      router.replace('/demo');
    }
  }, [router, searchParams]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        </div>
        <p className="text-sm text-slate-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}

export default function DemoDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          </div>
          <p className="text-sm text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    }>
      <DemoDashboardContent />
    </Suspense>
  );
}
