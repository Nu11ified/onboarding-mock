/**
 * Onboarding Flow Utilities
 * Handles URL state management, session storage, and flow logic
 */

import type { 
  OnboardingUrlState, 
  OnboardingFlowState, 
  AnonymousSession,
  OnboardingAction,
  OnboardingStep,
  FlowType
} from './types';

const SESSION_STORAGE_KEY = 'microai_anon_session';
const SESSION_EXPIRY_HOURS = 24;

/**
 * URL State Management
 */
export function serializeUrlState(state: Partial<OnboardingUrlState>): string {
  const params = new URLSearchParams();
  
  if (state.flow) params.set('flow', state.flow);
  if (state.step) params.set('step', state.step);
  if (state.mode) params.set('mode', state.mode);
  if (state.connection) params.set('connection', state.connection);
  if (state.profileId) params.set('profileId', state.profileId);
  if (state.deviceId) params.set('deviceId', state.deviceId);
  if (state.sessionId) params.set('sessionId', state.sessionId);
  
  return params.toString();
}

export function deserializeUrlState(searchParams: URLSearchParams): Partial<OnboardingUrlState> {
  return {
    flow: searchParams.get('flow') as FlowType | undefined,
    step: searchParams.get('step') as OnboardingStep | undefined,
    mode: searchParams.get('mode') as 'demo' | 'live' | undefined,
    connection: searchParams.get('connection') as 'mqtt' | 'opc-ua' | undefined,
    profileId: searchParams.get('profileId') || undefined,
    deviceId: searchParams.get('deviceId') || undefined,
    sessionId: searchParams.get('sessionId') || undefined,
  };
}

export function buildUrlWithState(baseUrl: string, state: Partial<OnboardingUrlState>): string {
  const queryString = serializeUrlState(state);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Anonymous Session Management
 */
export function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateChatId(sessionId: string): string {
  return `chat_${sessionId}_${Date.now()}`;
}

export function createAnonymousSession(): AnonymousSession {
  const now = Date.now();
  const expiresAt = now + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  const sessionId = generateSessionId();
  
  const session: AnonymousSession = {
    sessionId,
    chatId: generateChatId(sessionId),
    createdAt: now,
    expiresAt,
  };
  
  saveAnonymousSession(session);
  return session;
}

export function getAnonymousSession(): AnonymousSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const session: AnonymousSession = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() > session.expiresAt) {
      clearAnonymousSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to retrieve anonymous session:', error);
    return null;
  }
}

export function saveAnonymousSession(session: AnonymousSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save anonymous session:', error);
  }
}

export function clearAnonymousSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear anonymous session:', error);
  }
}

export function getOrCreateAnonymousSession(): AnonymousSession {
  const existing = getAnonymousSession();
  if (existing) return existing;
  return createAnonymousSession();
}

/**
 * Flow State Reducer
 */
export function onboardingFlowReducer(
  state: OnboardingFlowState,
  action: OnboardingAction
): OnboardingFlowState {
  switch (action.type) {
    case 'SET_FLOW':
      return { ...state, flowType: action.flowType };
      
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
      
    case 'SET_MODE':
      return { ...state, mode: action.mode };
      
    case 'SET_CONNECTION':
      return { ...state, connection: action.connection };
      
    case 'SET_SESSION':
      return { 
        ...state, 
        sessionId: action.sessionId, 
        chatId: action.chatId 
      };
      
    case 'SET_USER':
      return { 
        ...state, 
        userId: action.userId, 
        isAuthenticated: action.isAuthenticated 
      };
      
    case 'UPDATE_REGISTRATION':
      return { 
        ...state, 
        registration: { ...state.registration, ...action.registration } 
      };
      
    case 'SET_PROFILE_CONFIG':
      return { ...state, profileConfig: action.config };
      
    case 'SELECT_PROFILE':
      return { ...state, selectedProfileId: action.profileId };
      
    case 'SET_DEVICE':
      return { 
        ...state, 
        deviceId: action.deviceId, 
        deviceStatus: action.status 
      };
      
    case 'COMPLETE_STEP':
      return { 
        ...state, 
        completedSteps: [...state.completedSteps, action.step] 
      };
      
    case 'RESET_FLOW':
      return getInitialFlowState();
      
    case 'RESTORE_FROM_URL':
      return { ...state, ...action.state };
      
    default:
      return state;
  }
}

export function getInitialFlowState(): OnboardingFlowState {
  return {
    flowType: 'non-login',
    currentStep: 'welcome',
    isAuthenticated: false,
    completedSteps: [],
  };
}

/**
 * Flow Navigation Logic
 */
export function getNextStep(
  currentStep: OnboardingStep,
  flowState: OnboardingFlowState
): OnboardingStep | null {
  const { flowType, mode, isAuthenticated } = flowState;
  
  // Non-login flow
  if (flowType === 'non-login') {
    switch (currentStep) {
      case 'welcome':
        return 'email-entry';
      case 'email-entry':
        return 'otp-validation';
      case 'otp-validation':
        return 'device-option-selection';
      case 'device-option-selection':
        return mode === 'live' ? 'profile-configuration' : 'device-spawning';
      case 'profile-configuration':
        return 'device-spawning';
      case 'device-spawning':
        return mode === 'live' ? 'mqtt-setup' : 'login-redirect';
      case 'mqtt-setup':
        return 'login-redirect';
      case 'login-redirect':
        return 'dashboard-view';
      default:
        return null;
    }
  }
  
  // Logged-in flow
  if (flowType === 'logged-in') {
    switch (currentStep) {
      case 'welcome':
        return 'profile-selection';
      case 'profile-selection':
        return flowState.selectedProfileId ? 'device-onboarding' : 'new-profile-creation';
      case 'new-profile-creation':
        return 'device-onboarding';
      case 'device-onboarding':
        return 'dashboard-view';
      default:
        return null;
    }
  }
  
  // Post-onboarding common flow
  switch (currentStep) {
    case 'dashboard-view':
      return 'user-invitation';
    case 'user-invitation':
      return 'notification-setup';
    case 'notification-setup':
      return 'test-ticket-creation';
    default:
      return null;
  }
}

export function canAccessStep(
  targetStep: OnboardingStep,
  flowState: OnboardingFlowState
): boolean {
  const { completedSteps, isAuthenticated, flowType } = flowState;
  
  // Always allow access to welcome
  if (targetStep === 'welcome') return true;
  
  // Check authentication requirements
  const authRequiredSteps: OnboardingStep[] = [
    'profile-selection',
    'new-profile-creation',
    'device-onboarding',
  ];
  
  if (authRequiredSteps.includes(targetStep) && !isAuthenticated) {
    return false;
  }
  
  // Check if prerequisites are completed
  const stepOrder: Record<FlowType, OnboardingStep[]> = {
    'non-login': [
      'welcome',
      'email-entry',
      'otp-validation',
      'device-option-selection',
      'profile-configuration',
      'device-spawning',
      'mqtt-setup',
      'login-redirect',
      'dashboard-view',
    ],
    'logged-in': [
      'welcome',
      'profile-selection',
      'new-profile-creation',
      'device-onboarding',
      'dashboard-view',
    ],
  };
  
  const currentFlow = stepOrder[flowType] || stepOrder['non-login'];
  const targetIndex = currentFlow.indexOf(targetStep);
  
  if (targetIndex === -1) return true; // Step not in flow, allow access
  
  // Check if all previous steps are completed
  for (let i = 0; i < targetIndex; i++) {
    if (!completedSteps.includes(currentFlow[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validation Helpers
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

export function validateProfileConfig(config: Partial<any>): string[] {
  const errors: string[] = [];
  
  if (!config.profileName || config.profileName.trim().length === 0) {
    errors.push('Profile name is required');
  }
  
  if (config.trainingSeconds === undefined || config.trainingSeconds < 10) {
    errors.push('Training seconds must be at least 10');
  }
  
  if (config.daysToMaintenance === undefined || config.daysToMaintenance < 1) {
    errors.push('Days to maintenance must be at least 1');
  }
  
  if (config.cycleDuration === undefined || config.cycleDuration < 1) {
    errors.push('Cycle duration must be at least 1');
  }
  
  return errors;
}
