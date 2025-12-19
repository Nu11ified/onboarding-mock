import type { FlowDefinition } from '../types';

// Mirrors NON_LOGIN_FLOW messages and branching
export const ONBOARDING_FLOW: FlowDefinition = {
  initial: 'user-info',
  states: {
    'user-info': {
      id: 'user-info',
      message: `You're about to set up a new machine, where you can explore it's real-time telemetry, AI insights, with interactive dashboards.`,
      widget: { type: 'user-info-form' },
      waitForUserInput: true,
      on: {
        SUBMIT: { target: 'otp', action: 'register-user-info' },
      },
    },
    otp: {
      id: 'otp',
      message: `Great!
We've sent a 6-digit verification code (OTP) to the email you provided.
Please check your inbox and enter the code below to verify your email and continue with the setup.

Didn't get the code? You can resend it after a few seconds, or check your spam/junk folder.`,
      widget: { type: 'otp-form', data: { allowResend: true } },
      waitForUserInput: true,
      on: {
        VERIFY: { target: 'mode-select', action: 'validate-otp' },
      },
    },
    'mode-select': {
      id: 'mode-select',
      message: (ctx: any) => `Here is your profile key: ${ctx.profileKey || '123445678888'} to activate the machine. How would you like to onboard the machine? Below are 2 options.`,
      widget: {
        type: 'widget-stack',
        data: {
          widgets: [
            {
              type: 'video-panel-button',
              data: {
                videoUrl: 'https://youtu.be/YQj_I-Zpx4Q',
                title: 'What you unlock with onboarding',
                description: 'See what a fully activated machine looks like in the product—live telemetry views, model insights, health scores, alerts, and ticket workflows.',
                duration: '5:30',
                buttonText: 'What is machine activation?',
              },
            },
            { type: 'device-option-form' },
          ],
        },
      },
      waitForUserInput: true,
      on: {
        SELECT_DEMO: { target: 'demo-spawn', action: 'select-demo-mode' },
        SELECT_LIVE: { target: 'live-machine-details', action: 'select-live-mode' },
      },
    },

    // ===== Demo path =====
'demo-spawn': {
      id: 'demo-spawn',
      message: `Now we're setting up your Demo Machine.
You'll start seeing real-time data very soon.

I'll show you a live progress view of the setup, so you know exactly what's happening and how far along we are.
Sit tight — this usually takes less than 1 minute.`,
      widget: { type: 'device-status-widget' },
      waitForUserInput: true,
      on: {
        START: { target: 'demo-spawn', action: 'spawn-demo-device' },
        COMPLETE: { target: 'demo-complete' },
      },
    },
    'demo-complete': {
      id: 'demo-complete',
      message: `Your Demo Machine is now fully configured and live!

You can now explore real-time telemetry, AI insights, and interactive dashboards for your demo device.

Would you like to create an account so you can continue interacting with this device and view your dashboards?
We'll use the information you provided earlier to set up your account and then send you a secure email to create your password.`,
      waitForUserInput: true,
      on: {
        YES: { target: 'account-created', action: 'create-account' },
        NO: { target: 'session-saved', action: 'skip-account' },
      },
    },

    // ===== Live path =====
    'live-machine-details': {
      id: 'live-machine-details',
      message: `Now we'll start understanding your live machine so we can configure AI insights and predictive analytics.

To get started, I need a few details about your device:`,
      widget: {
        type: 'widget-stack',
        data: {
          widgets: [
            {
              type: 'right-panel-button',
              data: {
                panelType: 'machine-config-help',
                title: 'Machine Parameter Configuration',
                buttonText: 'View Parameter Configuration Info',
                content: {},
              },
            },
            { type: 'machine-details-form' },
          ],
        },
      },
      waitForUserInput: true,
      on: {
        SUBMIT: { target: 'live-mqtt' },
      },
    },
    'live-mqtt': {
      id: 'live-mqtt',
      message: `Thanks for submitting your machine details!
Now we need to connect your device to our system so we can receive and validate its data.

We'll provide you with MQTT broker details. You can configure your machine, or use Kepware or Ignition, to send your device data to this broker.

Endpoint: mqtt.industrialiq.ai\nPort: 8883\nTopic: telemetry

Don't worry about the format — you can send data in your existing format. We'll validate it on our side and make sure it's acceptable.

When you have your device sending data, type "done" here and I'll validate it automatically.`,
      widget: {
        type: 'right-panel-button',
        data: {
          panelType: 'mqtt-setup',
          title: 'MQTT Configuration',
          buttonText: 'View MQTT Configuration Info',
          content: {
            brokerEndpoint: 'mqtt.industrialiq.ai',
            brokerPort: 8883,
            topic: 'telemetry',
          },
        },
      },
      waitForUserInput: true,
      on: {
        DONE: { target: 'live-validate-schema' },
      },
    },
    'live-validate-schema': {
      id: 'live-validate-schema',
      message: 'Validating your data schema...',
      widget: { type: 'device-status-widget', data: { deviceId: 'schema_validation', persist: false, labels: { starting: 'Waiting for Data', training: 'Validating Schema', complete: 'Schema Validated' } } },
      waitForUserInput: true,
      on: {
        NEXT: { target: 'live-validate-agent' },
      },
    },
    'live-validate-agent': {
      id: 'live-validate-agent',
      message: 'Starting your agent and validating incoming data...',
      widget: { type: 'device-status-widget', data: { deviceId: 'agent_validation', persist: false, labels: { starting: 'Starting Container', training: 'Validating Data', complete: 'Data Validated' } } },
      waitForUserInput: true,
      on: {
        NEXT: { target: 'live-data-received' },
      },
    },
    'live-data-received': {
      id: 'live-data-received',
      message: `We're receiving your device data successfully!
We've identified the different tags/channels being sent — these are essentially key-value pairs representing your sensor readings.

Would you like to configure how your tags are grouped, or use the default configuration?`,
      waitForUserInput: true,
      on: {
        CONFIGURE: { target: 'live-channel-config' },
        SKIP: { target: 'live-spawn' },
      },
    },
    'live-channel-config': {
      id: 'live-channel-config',
      message: "Great! Let's configure your channels. You can organize your tags into groups below:",
      widget: {
        type: 'widget-stack',
        data: {
          widgets: [
            {
              type: 'right-panel-button',
              data: {
                panelType: 'channel-config-help',
                title: 'Channel Configuration',
                buttonText: 'View Channel Configuration Info',
                content: {},
              },
            },
            { type: 'channel-configuration-widget' },
          ],
        },
      },
      waitForUserInput: true,
      on: {
        SUBMIT: { target: 'live-spawn' },
      },
    },
'live-spawn': {
      id: 'live-spawn',
      message: 'Training your machine model...',
      widget: { type: 'device-status-widget' },
      waitForUserInput: true,
      on: {
        START: { action: 'spawn-live-device' },
        COMPLETE: { target: 'live-complete' },
      },
    },
    'live-complete': {
      id: 'live-complete',
      message: `Your Machine is now fully configured and live!

You can now explore real-time telemetry, AI insights, and interactive dashboards for your machine.

Would you like to create an account so you can continue interacting with this device and view your dashboards?
We'll use the information you provided earlier to set up your account and then send you a secure email to create your password.`,
      waitForUserInput: true,
      on: {
        YES: { target: 'account-created', action: 'create-account' },
        NO: { target: 'session-saved', action: 'skip-account' },
      },
    },

    // ===== Common end states =====
    'account-created': {
      id: 'account-created',
      message: `Your account has been created! Set your password below to access your dashboard and all features.`,
      widget: { type: 'login-button-widget', data: { url: '/reset', buttonText: 'Set Password', message: 'Create your password to secure your account and continue.' } },
      waitForUserInput: true,
      on: {
        RESTART: { target: 'restart-confirmation' },
      },
    },
    'session-saved': {
      id: 'session-saved',
      message: 'No problem! Your session has been saved. You can come back anytime using the same email address to continue where you left off. Your demo machine will remain active.',
      widget: { type: 'restart-onboarding-widget', data: { message: 'Want to onboard another machine? You can start a new onboarding flow anytime.' } },
      waitForUserInput: true,
    },
    'restart-confirmation': {
      id: 'restart-confirmation',
      message: 'Ready to onboard another machine?',
      widget: { type: 'restart-onboarding-widget', data: { message: 'Click below to start a fresh onboarding flow for a new machine.' } },
      waitForUserInput: true,
    },
  },
};
