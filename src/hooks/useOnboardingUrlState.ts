import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { buildUrlWithState, deserializeUrlState } from '@/lib/onboarding/utils';
import type { OnboardingUrlState } from '@/lib/onboarding/types';

export function useOnboardingUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const urlState = deserializeUrlState(searchParams);
  
  const updateUrlState = useCallback((updates: Partial<OnboardingUrlState>) => {
    const current = deserializeUrlState(searchParams);
    const newUrl = buildUrlWithState('/dashboard', { ...current, ...updates });
    router.push(newUrl);
  }, [router, searchParams]);
  
  const replaceUrlState = useCallback((updates: Partial<OnboardingUrlState>) => {
    const current = deserializeUrlState(searchParams);
    const newUrl = buildUrlWithState('/dashboard', { ...current, ...updates });
    router.replace(newUrl);
  }, [router, searchParams]);
  
  return { 
    urlState, 
    updateUrlState,
    replaceUrlState
  };
}
