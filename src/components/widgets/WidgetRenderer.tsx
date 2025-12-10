'use client';

import type { Widget } from '@/lib/widgets/types';
import { NavigationWidget } from './NavigationWidget';
import { StatusWidget } from './StatusWidget';
import { ProgressWidget } from './ProgressWidget';
import { FormWidget } from './FormWidget';
import { InfoGridWidget } from './InfoGridWidget';
import { LoginButtonWidget } from './LoginButtonWidget';
import { SchemaValidationWidget } from './SchemaValidationWidget';
import { ChannelConfigurationWidget } from './ChannelConfigurationWidget';
import { VideoWidget } from './VideoWidget';

// Import existing onboarding widgets
import {
  EmailFormWidget,
  OtpFormWidget,
  DeviceOptionWidget,
  ProfileConfigFormWidget,
  DeviceStatusWidget,
  MqttConnectionInfoWidget,
  UserInvitationWidget,
  NotificationPreferencesWidget,
  PasswordCreationWidget,
  PaymentWidget,
  ProfileSelectionWidget,
  UserInfoFormWidget,
  WelcomeButtonsWidget,
  MachineDetailsFormWidget,
  MqttBrokerValidationWidget,
  DemoSlideshowWidget,
  AccountCreationSuggestionWidget,
} from '@/components/onboarding';

interface WidgetRendererProps {
  widget: Widget | any; // Accept both new and legacy widget formats
  onSubmit?: (data: any) => Promise<void>;
  context?: Record<string, any>; // Context for legacy widgets
}

export function WidgetRenderer({ widget, onSubmit, context = {} }: WidgetRendererProps) {
  if (!widget || !widget.type) {
    console.warn('Widget missing type:', widget);
    return null;
  }

  try {
    const { type, data = {} } = widget;

    switch (type) {
      // Generic widgets
      case 'navigation':
        return (
          <NavigationWidget
            destination={data.destination || '/'}
            delay={data.delay}
            message={data.message}
          />
        );

      case 'status':
        return (
          <StatusWidget
            status={data.status || 'info'}
            title={data.title}
            message={data.message || ''}
          />
        );

      case 'progress':
        return (
          <ProgressWidget
            label={data.label}
            value={data.value || 0}
            status={data.status}
            message={data.message}
            estimatedTimeRemaining={data.estimatedTimeRemaining}
          />
        );

      case 'form':
        if (!data.fields || !Array.isArray(data.fields)) {
          console.error('Form widget missing fields array');
          return null;
        }
        return (
          <FormWidget
            title={data.title}
            description={data.description}
            fields={data.fields}
            submitLabel={data.submitLabel}
            onSubmit={onSubmit || (async () => {})}
          />
        );

      case 'info-grid':
        if (!data.fields || !Array.isArray(data.fields)) {
          console.error('Info grid widget missing fields array');
          return null;
        }
        return (
          <InfoGridWidget
            title={data.title}
            description={data.description}
            fields={data.fields}
          />
        );

      // Onboarding-specific widgets
      case 'email-form':
        return (
          <EmailFormWidget
            onSubmit={async (email: string) => {
              // Store email in localStorage as backup for password reset
              localStorage.setItem('pending_reset_email', email);
              // Don't print the email in chat history
              if (onSubmit) await onSubmit({ email });
            }}
            initialEmail={data.initialEmail}
          />
        );

      case 'otp-form':
        return (
          <OtpFormWidget
            email={data.email || context.email}
            onSubmit={async (otp: string) => {
              // Don't print the OTP code in chat history, just validate
              if (onSubmit) await onSubmit({ otp });
            }}
            onResend={data.allowResend ? async () => {
              console.log('Resend OTP requested');
            } : undefined}
          />
        );

      case 'password-creation-form':
        return (
          <PasswordCreationWidget
            onSubmit={async (password: string) => {
              if (onSubmit) await onSubmit({ password, userMessage: 'Password set' });
            }}
          />
        );

      case 'device-option-form':
        return (
          <DeviceOptionWidget
            onSelect={async (mode) => {
              // Don't print selection in chat, just update state
              if (onSubmit) await onSubmit({ mode });
            }}
          />
        );

      case 'profile-config-form':
        return (
          <ProfileConfigFormWidget
            onSubmit={async (config) => {
              if (onSubmit) await onSubmit({ profileConfig: config, userMessage: 'Submitted configuration' });
            }}
          />
        );

      case 'device-status-widget':
        {
          const deviceId = data.deviceId || (context as any).deviceId;
          if (!deviceId) {
            console.error('Device status widget missing deviceId (checked data and context)');
            return null;
          }
          return (
            <DeviceStatusWidget
              deviceId={deviceId}
              status={data.status || 'spawning'}
              showTraining={data.showTraining !== false}
              labels={data.labels}
              onComplete={() => {
                if (data.onComplete) data.onComplete();
                if (onSubmit) onSubmit({ status: 'active' });
              }}
            />
          );
        }

      case 'mqtt-connection-info':
        {
          const conn = data.brokerEndpoint
            ? {
                brokerEndpoint: data.brokerEndpoint,
                brokerPort: data.brokerPort || 1883,
                topic: data.topic || '',
                username: data.username || '',
                password: data.password || '',
                sampleSchema: data.sampleSchema,
              }
            : (context?.mqttConnection as any);
          if (!conn?.brokerEndpoint) {
            console.error('MQTT connection widget missing broker endpoint (checked data and context)');
            return null;
          }
          return (
            <MqttConnectionInfoWidget
              connection={conn}
            />
          );
        }

      case 'user-invitation-form':
        return (
          <UserInvitationWidget
            onSubmit={async (users) => {
              if (onSubmit) await onSubmit({ users, invitedUsers: users, userMessage: `Invite ${users.length} user(s)` });
            }}
          />
        );

      case 'notification-preferences-form':
        return (
          <NotificationPreferencesWidget
            onConfirm={async (enabled: boolean) => {
              if (onSubmit) await onSubmit({ notificationsEnabled: enabled, userMessage: enabled ? 'Enable notifications' : 'Skip notifications' });
            }}
          />
        );

      case 'profile-selection-form':
        return (
          <ProfileSelectionWidget
            onSelectExisting={async (profileKey, profileName) => {
              if (onSubmit) {
                await onSubmit({ profileKey, profileName });
              }
            }}
            onCreateNew={async () => {
              if (onSubmit) {
                await onSubmit({ profileKey: null });
              }
            }}
          />
        );

      case 'payment-form':
        return (
          <PaymentWidget
            onSubmit={onSubmit || (async () => {})}
          />
        );

      case 'login-button-widget':
        return (
          <LoginButtonWidget
            url={data.url || '/login'}
            buttonText={data.buttonText}
            message={data.message}
            onSubmit={async () => {
              if (onSubmit) await onSubmit({ userMessage: 'Navigating to login...' });
            }}
          />
        );

      case 'schema-validation-widget':
        return (
          <SchemaValidationWidget
            onComplete={() => {
              if (onSubmit) onSubmit({ status: 'schema-validated' });
            }}
          />
        );

      case 'channel-configuration-widget':
        return (
          <ChannelConfigurationWidget
            onSubmit={(mapping) => {
              if (onSubmit) onSubmit({ channelMapping: mapping });
            }}
          />
        );

      case 'video-widget':
        return (
          <VideoWidget
            url={data.url || ''}
            title={data.title || 'Video'}
            description={data.description}
          />
        );

      // New widgets for the updated onboarding flow
      case 'welcome-buttons':
        return (
          <WelcomeButtonsWidget
            onSelect={async (mode) => {
              if (onSubmit) await onSubmit({ mode });
            }}
          />
        );

      case 'user-info-form':
        return (
          <UserInfoFormWidget
            mode={data.mode || 'demo'}
            onSubmit={async (userInfo) => {
              if (onSubmit) {
                await onSubmit({
                  email: userInfo.email,
                  firstName: userInfo.firstName,
                  lastName: userInfo.lastName,
                  phoneNumber: userInfo.phoneNumber,
                });
              }
            }}
          />
        );

      case 'machine-details-form':
        return (
          <MachineDetailsFormWidget
            onSubmit={async (details) => {
              if (onSubmit) {
                await onSubmit({
                  machineDetails: details,
                });
              }
            }}
          />
        );

      case 'mqtt-broker-validation':
        return (
          <MqttBrokerValidationWidget
            brokerDetails={{
              endpoint: data.endpoint || 'mqtt.industrialiq.ai',
              port: data.port || 8883,
              topic: data.topic || 'telemetry',
              username: data.username,
              password: data.password,
            }}
            onValidated={async () => {
              if (onSubmit) await onSubmit({ mqttValidated: true });
            }}
          />
        );

      case 'demo-slideshow':
        return <DemoSlideshowWidget />;

      case 'account-creation-suggestion':
        return (
          <AccountCreationSuggestionWidget
            onCreateAccount={async () => {
              if (onSubmit) await onSubmit({ createAccount: true });
            }}
            onSkip={async () => {
              if (onSubmit) await onSubmit({ createAccount: false });
            }}
          />
        );

      default:
        console.warn('Unknown widget type:', type);
        return (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
            <p className="text-sm text-yellow-800">
              Unsupported widget type: <strong>{type}</strong>
            </p>
          </div>
        );
    }
  } catch (error) {
    console.error('Error rendering widget:', error, widget);
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
        <p className="text-sm text-red-800">
          Failed to render widget. Please contact support if this persists.
        </p>
      </div>
    );
  }
}
