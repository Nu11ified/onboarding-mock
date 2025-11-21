/**
 * Enhanced Onboarding Flow Types
 * Supports non-login, logged-in, and post-onboarding flows
 */

// Flow types
export type FlowType = 'non-login' | 'logged-in';
export type OnboardingMode = 'demo' | 'live';
export type ConnectionType = 'mqtt' | 'opc-ua';

// Step identifiers for URL routing
export type OnboardingStep = 
  // Non-login flow
  | 'welcome'
  | 'email-entry'
  | 'otp-validation'
  | 'device-option-selection'  // Demo vs Live
  | 'profile-configuration'    // For live device
  | 'device-spawning'
  | 'mqtt-setup'              // For live device
  | 'login-redirect'
  // Logged-in flow
  | 'profile-selection'       // Choose existing or create new
  | 'new-profile-creation'
  | 'device-onboarding'
  // Post-onboarding (common)
  | 'dashboard-view'
  | 'user-invitation'
  | 'notification-setup'
  | 'test-ticket-creation';

// State that can be serialized to/from URL
export interface OnboardingUrlState {
  flow: FlowType;
  step: OnboardingStep;
  mode?: OnboardingMode;
  connection?: ConnectionType;
  profileId?: string;
  deviceId?: string;
  sessionId?: string;
}

// Anonymous user session
export interface AnonymousSession {
  sessionId: string;
  chatId: string;
  createdAt: number;
  expiresAt: number;
}

// User registration state
export interface RegistrationState {
  email?: string;
  otpSent?: boolean;
  otpValidated?: boolean;
  accountExists?: boolean;
  isPremature?: boolean;  // Account created but not verified
}

// Profile configuration
export interface ProfileConfig {
  profileName: string;
  trainingSeconds: number;
  daysToMaintenance: number;
  cycleDuration: number;  // split counter
  channels?: string[];    // sensor channel names
}

// Device spawn request
export interface DeviceSpawnRequest {
  profileKey: string;
  mode: OnboardingMode;
  deviceId?: string;
  topic?: string;
  sessionId: string;
  sessionExpiry: number;
  config?: ProfileConfig;
}

// Device spawn response
export interface DeviceSpawnResponse {
  deviceId: string;
  topic: string;
  brokerEndpoint: string;
  brokerPort: number;
  username: string;
  password: string;
  sampleSchema?: Record<string, unknown>;
  status: 'active' | 'spawning' | 'error';
}

// Session transfer (from anon to authenticated)
export interface SessionTransferRequest {
  anonSessionId: string;
  anonUserId: string;
  authenticatedUserId: string;
  chatId: string;
}

// User invitation
export interface UserInvitation {
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Technician' | 'Operator';
  companyEmail?: string;
}

// Notification subscription
export interface NotificationSubscription {
  userId: string;
  deviceId: string;
  email: string;
  ticketCreation: boolean;
  ticketUpdate: boolean;
}

// Chat form widget types
export type WidgetType =
  | 'email-form'
  | 'otp-form'
  | 'password-creation-form'
  | 'device-option-form'
  | 'profile-config-form'
  | 'device-status-widget'
  | 'mqtt-connection-info'
  | 'user-invitation-form'
  | 'notification-preferences-form'
  | 'profile-selection-form'
  | 'payment-form'
  | 'login-button-widget'
  | 'schema-validation-widget'
  | 'channel-configuration-widget';

export interface ChatWidget {
  type: WidgetType;
  data?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
}

// Flow state management
export interface OnboardingFlowState {
  flowType: FlowType;
  currentStep: OnboardingStep;
  mode?: OnboardingMode;
  connection?: ConnectionType;
  sessionId?: string;
  chatId?: string;
  userId?: string;
  isAuthenticated: boolean;
  registration?: RegistrationState;
  profileConfig?: ProfileConfig;
  selectedProfileId?: string;
  deviceId?: string;
  deviceStatus?: 'spawning' | 'active' | 'error';
  completedSteps: OnboardingStep[];
}

// Action types for flow state reducer
export type OnboardingAction = 
  | { type: 'SET_FLOW'; flowType: FlowType }
  | { type: 'SET_STEP'; step: OnboardingStep }
  | { type: 'SET_MODE'; mode: OnboardingMode }
  | { type: 'SET_CONNECTION'; connection: ConnectionType }
  | { type: 'SET_SESSION'; sessionId: string; chatId: string }
  | { type: 'SET_USER'; userId: string; isAuthenticated: boolean }
  | { type: 'UPDATE_REGISTRATION'; registration: Partial<RegistrationState> }
  | { type: 'SET_PROFILE_CONFIG'; config: ProfileConfig }
  | { type: 'SELECT_PROFILE'; profileId: string }
  | { type: 'SET_DEVICE'; deviceId: string; status?: 'spawning' | 'active' | 'error' }
  | { type: 'COMPLETE_STEP'; step: OnboardingStep }
  | { type: 'RESET_FLOW' }
  | { type: 'RESTORE_FROM_URL'; state: Partial<OnboardingFlowState> };
