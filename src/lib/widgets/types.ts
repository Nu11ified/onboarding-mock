/**
 * Widget Types for Dynamic Rendering
 * Matches the JSON structure output by GenAIService backend
 */

export type WidgetType =
  | 'form'
  | 'progress'
  | 'status'
  | 'navigation'
  | 'info-grid'
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
  | 'payment-form';

export interface BaseWidget {
  type: WidgetType;
  id?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface FormWidget extends BaseWidget {
  type: 'form';
  title?: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit?: string; // Action name or callback identifier
}

export interface ProgressWidget extends BaseWidget {
  type: 'progress';
  label?: string;
  value: number; // 0-100
  status?: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export interface StatusWidget extends BaseWidget {
  type: 'status';
  status: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  icon?: string;
}

export interface NavigationWidget extends BaseWidget {
  type: 'navigation';
  destination: string; // URL or route
  delay?: number; // Delay before navigation in ms
  message?: string;
}

export interface InfoField {
  label: string;
  value: string;
  icon?: string;
  copyable?: boolean;
  sensitive?: boolean;
}

export interface InfoGridWidget extends BaseWidget {
  type: 'info-grid';
  title?: string;
  description?: string;
  fields: InfoField[];
}

// Specific widget data structures for existing widgets

export interface EmailFormData {
  initialEmail?: string;
}

export interface OtpFormData {
  email?: string;
  allowResend?: boolean;
}

export interface PasswordCreationData {
  requirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  };
}

export interface DeviceOptionData {
  mode?: 'demo' | 'live';
}

export interface DeviceStatusData {
  deviceId: string;
  status: 'spawning' | 'active' | 'error';
  showTraining?: boolean;
}

export interface MqttConnectionData {
  brokerEndpoint: string;
  brokerPort: number;
  topic: string;
  username: string;
  password: string;
  sampleSchema?: Record<string, unknown>;
}

// Union type for all widget data
export type WidgetData =
  | EmailFormData
  | OtpFormData
  | PasswordCreationData
  | DeviceOptionData
  | DeviceStatusData
  | MqttConnectionData
  | Record<string, unknown>;

export interface Widget extends BaseWidget {
  data?: WidgetData;
}

// Message structure from backend
export interface MessageWidget {
  type: WidgetType;
  data?: WidgetData;
}

export interface BackendMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  widgets?: MessageWidget[];
  timestamp?: string;
}
