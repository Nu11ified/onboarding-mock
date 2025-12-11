import type { ActionsRegistry, FlowEvent } from './types';

const withLS = (fn: () => void) => { try { fn(); } catch {} };

export const actions: ActionsRegistry = {
  'register-user-info': async (ctx, event: FlowEvent) => {
    const data = event.data || {};
    Object.assign(ctx, data);
    withLS(() => {
      localStorage.setItem('pending_user_info', JSON.stringify({
        email: ctx.email,
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        phoneNumber: ctx.phoneNumber,
      }));
      // Also store email for reset page
      if (ctx.email) {
        localStorage.setItem('pending_reset_email', ctx.email);
      }
    });
  },
  'validate-sms-otp': async (ctx, event: FlowEvent) => {
    const smsOtp = (event.data as any)?.otp || ctx.smsOtp;
    ctx.smsOtp = smsOtp;
    ctx.phoneVerified = true;
    // Mock SMS OTP validation - in production, verify via backend
    console.log('SMS OTP validated:', smsOtp);
  },
  'validate-otp': async (ctx) => {
    const mockProfileKey = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    ctx.profileKey = mockProfileKey;
  },
  'select-demo-mode': async (ctx) => {
    ctx.mode = 'demo';
  },
  'select-live-mode': async (ctx) => {
    ctx.mode = 'live';
  },
  'spawn-demo-device': async (ctx) => {
    const mockDeviceId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    ctx.deviceId = mockDeviceId;
    ctx.mode = 'demo';
    withLS(() => localStorage.setItem('onboarding_state', JSON.stringify({
      email: ctx.email,
      deviceId: mockDeviceId,
      profileKey: ctx.profileKey,
      mode: 'demo',
      shouldContinue: false,
    })));
  },
  'spawn-live-device': async (ctx, event) => {
    const config = (event.data as any)?.config || ctx.profileConfig;
    const mockDeviceId = `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    Object.assign(ctx, {
      deviceId: mockDeviceId,
      mode: 'live',
      mqttConnection: {
        brokerEndpoint: 'mqtt.industrialiq.ai',
        brokerPort: 8883,
        topic: `device/${mockDeviceId}/telemetry`,
        username: mockDeviceId,
        password: 'generated_password_123',
        sampleSchema: {},
      },
      profileConfig: config,
    });
    withLS(() => localStorage.setItem('onboarding_state', JSON.stringify({
      email: ctx.email,
      deviceId: mockDeviceId,
      profileKey: ctx.profileKey,
      mode: 'live',
      shouldContinue: false,
    })));
  },
  'create-account': async (ctx) => {
    withLS(() => localStorage.setItem('onboarding_state', JSON.stringify({
      email: ctx.email,
      deviceId: ctx.deviceId,
      profileKey: ctx.profileKey,
      mode: ctx.mode,
      accountCreated: true,
    })));
  },
  'skip-account': async (ctx) => {
    withLS(() => localStorage.setItem('onboarding_state', JSON.stringify({
      email: ctx.email,
      deviceId: ctx.deviceId,
      profileKey: ctx.profileKey,
      mode: ctx.mode,
      sessionSaved: true,
    })));
  },
};
