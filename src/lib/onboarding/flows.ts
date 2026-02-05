/**
 * Scripted Onboarding Flows
 * Defines the exact conversation flow as specified in the requirements
 */

import type { ChatWidget } from "./types";

export type FlowStepAction =
  | "register-email"
  | "register-user-info"
  | "validate-otp"
  | "validate-schema"
  | "send-password-reset"
  | "show-profile-key"
  | "show-device-options"
  | "spawn-demo-device"
  | "show-profile-config-form"
  | "spawn-live-device"
  | "show-mqtt-details"
  | "auto-login"
  | "transfer-session"
  | "show-dashboard"
  | "show-user-invitation-form"
  | "add-users"
  | "show-notification-preferences"
  | "subscribe-notifications"
  | "create-test-ticket"
  | "show-completion"
  | "show-profile-selection"
  | "create-new-profile"
  | "show-payment-widget"
  | "show-connection-details"
  | "show-nudges"
  | "switch-graph-channel"
  | "query-metrics"
  | "compute-correlation"
  | "forecast-maintenance"
  | "explain-health-drivers"
  | "compare-lines"
  | "create-account"
  | "skip-account";

export interface FlowStep {
  id: string;
  actor: "user" | "assistant";
  message: string | ((context: FlowContext) => string);
  widget?: ChatWidget;
  action?: FlowStepAction;
  waitForUserInput?: boolean;
  nextStepId?: string | ((context: FlowContext) => string);
}

export interface FlowContext {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  otp?: string;
  password?: string;
  profileKey?: string;
  deviceId?: string;
  mode?: "demo" | "live";
  profileConfig?: {
    profileName: string;
    trainingSeconds: number;
    daysToMaintenance: number;
    cycleDuration: number;
  };
  machineDetails?: {
    trainingTimeSeconds: number;
    splitCounterSeconds: number;
    daysToMaintenance: number;
  };
  mqttConnection?: {
    brokerEndpoint: string;
    brokerPort: number;
    topic: string;
    username: string;
    password: string;
    sampleSchema?: any;
  };
  invitedUsers?: Array<{ name: string; email: string; role: string }>;
  notificationsEnabled?: boolean;
  testTicketId?: string;
  sessionId?: string;
  chatId?: string;
  createAccount?: boolean;
  configureChannels?: boolean;
}

/**
 * NON-LOGIN ONBOARDING FLOW
 * Flow: Welcome → User Info → OTP → Mode Selection (Demo/Live) → Device Setup → Account Creation
 */
export const NON_LOGIN_FLOW: FlowStep[] = [
  // Step 1: User info prompt (collect info before mode selection)
  {
    id: "user-info-prompt",
    actor: "assistant",
    message: `You're about to set up a new machine, where you can explore it's real-time telemetry, AI insights, with interactive dashboards.`,
    widget: {
      type: "user-info-form",
    },
    waitForUserInput: true,
    nextStepId: "user-info-processing",
  },

  // Step 2: Process user info
  {
    id: "user-info-processing",
    actor: "assistant",
    message: "",
    action: "register-user-info",
    nextStepId: "otp-prompt",
  },

  // Step 3: OTP prompt
  {
    id: "otp-prompt",
    actor: "assistant",
    message: (context: FlowContext) => {
      const userEmail = context.email || 'your email';
      const name = context.firstName ? `${context.firstName}` : '';
      return `${name ? `Welcome, ${name}! ` : ''}We've sent a 6-digit verification code to ${userEmail}.
Please check your inbox and enter the code below to verify your email and continue with the setup.

Didn't get the code? You can resend it after a few seconds, or check your spam/junk folder.`;
    },
    widget: {
      type: "otp-form",
      data: { allowResend: true },
    },
    waitForUserInput: true,
    nextStepId: "otp-processing",
  },

  // Step 5: Process OTP
  {
    id: "otp-processing",
    actor: "assistant",
    message: "",
    action: "validate-otp",
    nextStepId: "mode-selection",
  },

  // Step 6: Mode selection (Demo vs Live) - using old DeviceOptionWidget
  {
    id: "mode-selection",
    actor: "assistant",
    message: (context: FlowContext) =>
      `Here is your profile key: ${context.profileKey || "123445678888"} to activate the machine. How would you like to onboard the machine? Below are 2 options.`,
    widget: {
      type: "device-option-form",
    },
    waitForUserInput: true,
    nextStepId: (context: FlowContext) =>
      context.mode === "demo"
        ? "demo-setup-message"
        : "live-machine-details-prompt",
  },

  // ========== DEMO DEVICE FLOW ==========

  // Demo: Setup message (moved content to device-spawn step)
  {
    id: "demo-setup-message",
    actor: "assistant",
    message: "",
    nextStepId: "demo-device-init",
  },

  // Demo: Initialize device
  {
    id: "demo-device-init",
    actor: "assistant",
    message: "",
    action: "spawn-demo-device",
    nextStepId: "demo-device-spawn",
  },

  // Demo: Show device status
  {
    id: "demo-device-spawn",
    actor: "assistant",
    message: `Now we're setting up your Demo Machine.
You'll start seeing real-time data very soon.

I'll show you a live progress view of the setup, so you know exactly what's happening and how far along we are.
Sit tight — this usually takes less than 1 minute.`,
    widget: {
      type: "device-status-widget",
    },
    waitForUserInput: true,
    nextStepId: "demo-complete-message",
  },

  // Demo: Complete message
  {
    id: "demo-complete-message",
    actor: "assistant",
    message: `Your Demo Machine is now fully configured and live!

You can now explore real-time telemetry, AI insights, and interactive dashboards for your demo device.

Would you like to create an account so you can continue interacting with this device and view your dashboards?
We'll use the information you provided earlier to set up your account and then send you a secure email to create your password.

Just say "yes" or "no".`,
    waitForUserInput: true,
    nextStepId: (context: FlowContext) =>
      context.createAccount === true
        ? "account-created"
        : context.createAccount === false
        ? "session-saved"
        : "demo-complete-message",
  },

  // ========== LIVE DEVICE FLOW ==========

  // Live: Machine details prompt
  {
    id: "live-machine-details-prompt",
    actor: "assistant",
    message: `Now we'll start understanding your live machine so we can configure AI insights and predictive analytics.

To get started, I need a few details about your device:`,
    widget: {
      type: "machine-details-form",
    },
    waitForUserInput: true,
    nextStepId: "live-machine-details-processing",
  },

  // Live: Process machine details
  {
    id: "live-machine-details-processing",
    actor: "assistant",
    message: "",
    nextStepId: "live-mqtt-prompt",
  },

  // Live: MQTT broker prompt
  {
    id: "live-mqtt-prompt",
    actor: "assistant",
    message: `Thanks for submitting your machine details!
Now we need to connect your device to our system so we can receive and validate its data.

We'll provide you with MQTT broker details. You can configure your machine, or use Kepware or Ignition, to send your device data to this broker.

Endpoint: mqtt.industrialiq.ai\nPort: 8883\nTopic: telemetry

Don't worry about the format — you can send data in your existing format. We'll validate it on our side and make sure it's acceptable.

When you have your device sending data, type "done" here and I'll validate it automatically.`,
    waitForUserInput: true,
    nextStepId: "live-data-received",
  },

  // Live: Schema validation status (triggered when user types "done" at MQTT prompt)
  {
    id: "live-mqtt-schema-status",
    actor: "assistant",
    message: "Validating your data schema...",
    widget: {
      type: "device-status-widget",
      data: {
        deviceId: "schema_validation",
        persist: false,
        labels: {
          starting: "Waiting for Data",
          training: "Validating Schema",
          complete: "Schema Validated",
        },
      },
    },
    waitForUserInput: true,
    nextStepId: "live-agent-data-validate",
  },

  // Live: Agent start + data validation status
  {
    id: "live-agent-data-validate",
    actor: "assistant",
    message: "Starting your agent and validating incoming data...",
    widget: {
      type: "device-status-widget",
      data: {
        deviceId: "agent_validation",
        persist: false,
        labels: {
          starting: "Starting Container",
          training: "Validating Data",
          complete: "Data Validated",
        },
      },
    },
    waitForUserInput: true,
    nextStepId: "live-data-received",
  },

  // Live: Data received - ask user to configure or skip
  {
    id: "live-data-received",
    actor: "assistant",
    message: `We're receiving your device data successfully!
We've identified the different tags/channels being sent — these are essentially key-value pairs representing your sensor readings.

Would you like to configure how your tags are grouped, or use the default configuration?`,
    waitForUserInput: true,
    nextStepId: (context: FlowContext) =>
      context.configureChannels === true
        ? "live-channel-config"
        : context.configureChannels === false
        ? "live-device-init"
        : "live-data-received",
  },

  // Live: Channel configuration (only if user chose to configure)
  {
    id: "live-channel-config",
    actor: "assistant",
    message:
      "Great! Let's configure your channels. You can organize your tags into groups below:",
    widget: {
      type: "channel-configuration-widget",
    },
    waitForUserInput: true,
    nextStepId: "live-device-init",
  },

  // Live: Initialize device
  {
    id: "live-device-init",
    actor: "assistant",
    message: "",
    action: "spawn-live-device",
    nextStepId: "live-device-spawn",
  },

  // Live: Show device status
  {
    id: "live-device-spawn",
    actor: "assistant",
    message: "Training your machine model...",
    widget: {
      type: "device-status-widget",
    },
    waitForUserInput: true,
    nextStepId: "live-complete-message",
  },

  // Live: Complete message
  {
    id: "live-complete-message",
    actor: "assistant",
    message: `Your Machine is now fully configured and live!

You can now explore real-time telemetry, AI insights, and interactive dashboards for your machine.

Would you like to create an account so you can continue interacting with this device and view your dashboards?
We'll use the information you provided earlier to set up your account and then send you a secure email to create your password.

Just say "yes" or "no".`,
    waitForUserInput: true,
    nextStepId: (context: FlowContext) =>
      context.createAccount === true
        ? "account-created"
        : context.createAccount === false
        ? "session-saved"
        : "live-complete-message",
  },

  // ========== COMMON END STEPS ==========

  // Account created
  {
    id: "account-created",
    actor: "assistant",
    message:
      "Your account has been created! We've sent you an email with instructions to set your password. Once you log in, you'll have full access to your dashboard and all features.",
    action: "create-account",
    widget: {
      type: "login-button-widget",
      data: {
        url: "/reset",
        buttonText: "Resend Email",
        message: "Check your email to complete account setup.",
      },
    },
    waitForUserInput: true,
  },

  // Session saved (skipped account creation)
  {
    id: "session-saved",
    actor: "assistant",
    message:
      "No problem! Your session has been saved. You can come back anytime using the same email address to continue where you left off. Your demo machine will remain active.",
    action: "skip-account",
  },
];

/**
 * POST-LOGIN FLOW
 * Occurs after user logs in (either fresh login or after non-login onboarding)
 * Per spec: dashboard shown → add users → email notifications → test ticket
 */
export const POST_LOGIN_FLOW: FlowStep[] = [
  // Step 1: Session transfer (for non-login flow users)
  {
    id: "session-transfer",
    actor: "assistant",
    message: "Transferring your session to logged-in mode...",
    action: "transfer-session",
    nextStepId: "dashboard-shown",
  },

  // Step 2: Dashboard shown
  {
    id: "dashboard-shown",
    actor: "assistant",
    message:
      "Now that you have a dashboard displaying live data, would you like to add additional users to view it alongside you?",
    action: "show-dashboard",
    waitForUserInput: true,
    nextStepId: "user-invitation-prompt",
  },

  // Step 3: Ask for emails directly in chat (comma-separated)
  {
    id: "user-invitation-prompt",
    actor: "assistant",
    message:
      "Please provide email address(es), comma-separated, to invite users (e.g., user1@company.com, user2@company.com).",
    action: "add-users",
    waitForUserInput: true,
    nextStepId: "users-submitted",
  },

  // Step 4: Users submitted
  {
    id: "users-submitted",
    actor: "user",
    message: (context: FlowContext) => {
      const users = context.invitedUsers || [];
      if (users.length === 0) return "User information submitted";
      return users.map((u) => `${u.name} (${u.email}) - ${u.role}`).join("\n");
    },
    action: "add-users",
    nextStepId: "users-added",
  },

  // Step 5: Confirm users added
  {
    id: "users-added",
    actor: "assistant",
    message: (context: FlowContext) => {
      const users = context.invitedUsers || [];
      if (users.length === 0) return "Users have been added.";
      const names = users.map((u) => u.name).join(", ");
      return `Great, the following users: ${names} has been added. An email has been sent to their inbox to activate their account.`;
    },
    nextStepId: "notification-prompt",
  },

  // Step 6: Ask about notifications
  {
    id: "notification-prompt",
    actor: "assistant",
    message:
      "Do you want to get email notifications when a ticket is auto generated/created?",
    widget: {
      type: "notification-preferences-form",
    },
    waitForUserInput: true,
    nextStepId: "notification-confirm",
  },

  // Step 7: Confirm notifications setup
  {
    id: "notification-confirm",
    actor: "assistant",
    message:
      "I have set your email up to receive notifications when your machine has a new ticket.",
    action: "subscribe-notifications",
    nextStepId: "test-ticket-prompt",
  },

  // Step 8: Ask about test ticket
  {
    id: "test-ticket-prompt",
    actor: "assistant",
    message:
      "Would you like to create a test ticket to confirm that notifications are working as expected?",
    waitForUserInput: true,
    nextStepId: "test-ticket-created",
  },

  // Step 9: Confirm ticket created
  {
    id: "test-ticket-created",
    actor: "assistant",
    message: (context: FlowContext) =>
      `I have generated ticket number ${context.testTicketId || "#3456"}; here is the link. Please check your email as we have sent the ticket creation notification to you.`,
    action: "create-test-ticket",
    nextStepId: "completion",
  },

  // Step 10: Completion
  {
    id: "completion",
    actor: "assistant",
    message:
      "Your machine is fully setup, you may switch the channel graphs, add more machines, create tickets, manage users, and more through this chat interface.",
    action: "show-completion",
    nextStepId: "nudges",
  },

  // Step 11: Nudges to explore value
  {
    id: "nudges",
    actor: "assistant",
    message:
      "You can ask: \n• Predict next maintenance date for the next 30 days.\n• Explain the top drivers of my health score today.\n• Compare line A vs line B vibration since Monday.\n• Switch dashboard graphs to a different sensor (e.g., Speed instead of Gyro).\n• Show vibration trend and temperature stability for the last 7 days.",
    action: "show-nudges",
    nextStepId: "guided-graph-switch-question",
  },

  // Guided graph switching
  {
    id: "guided-graph-switch-question",
    actor: "user",
    message:
      "Can I switch the channel graphs being shown to display the Speed Sensor instead of the Gyro Sensor?",
    nextStepId: "guided-graph-switch-answer",
  },
  {
    id: "guided-graph-switch-answer",
    actor: "assistant",
    message: "Of course, I am switching the graphs now.",
    action: "switch-graph-channel",
    nextStepId: "guided-metrics-trend-question",
  },

  // Guided metric deep-dive
  {
    id: "guided-metrics-trend-question",
    actor: "user",
    message:
      "Show vibration trend and temperature stability for the last 7 days.",
    nextStepId: "guided-metrics-trend-answer",
  },
  {
    id: "guided-metrics-trend-answer",
    actor: "assistant",
    message:
      "Here are the vibration and temperature line graphs for the last 7 days.",
    action: "query-metrics",
    nextStepId: "guided-correlation-question",
  },
  {
    id: "guided-correlation-question",
    actor: "user",
    message: "Is vibration correlated with cycle duration?",
    nextStepId: "guided-correlation-answer",
  },
  {
    id: "guided-correlation-answer",
    actor: "assistant",
    message: (context) =>
      `Correlation is ${typeof (context as any).correlation === "number" ? (context as any).correlation : 0.58}. Would you like a scatter plot?`,
    action: "compute-correlation",
    nextStepId: "guided-forecast-question",
  },

  // Guided use-case activations
  {
    id: "guided-forecast-question",
    actor: "user",
    message: "Predict next maintenance date for the next 30 days.",
    nextStepId: "guided-forecast-answer",
  },
  {
    id: "guided-forecast-answer",
    actor: "assistant",
    message: (context) => {
      const days = (context as any).predictedMaintenanceInDays ?? 9;
      return `The predicted maintenance date is in ${days} days.`;
    },
    action: "forecast-maintenance",
    nextStepId: "guided-explain-health-question",
  },
  {
    id: "guided-explain-health-question",
    actor: "user",
    message: "Explain today’s health score.",
    nextStepId: "guided-explain-health-answer",
  },
  {
    id: "guided-explain-health-answer",
    actor: "assistant",
    message:
      "The top factors are elevated vibration and longer cycle duration during shifts 2–3.",
    action: "explain-health-drivers",
    nextStepId: "guided-compare-question",
  },
  {
    id: "guided-compare-question",
    actor: "user",
    message: "Compare line A vs line B since Monday.",
    nextStepId: "guided-compare-answer",
  },
  {
    id: "guided-compare-answer",
    actor: "assistant",
    message: (context) =>
      (context as any).comparisonSummary ||
      "Line B shows 12% higher vibration variance; would you like a side-by-side chart?",
    action: "compare-lines",
  },
];

// Append POST_LOGIN_FLOW steps to NON_LOGIN_FLOW after login
NON_LOGIN_FLOW.push(...POST_LOGIN_FLOW);

/**
 * LOGGED-IN ONBOARDING FLOW
 * Per spec: Ask question → profile selection (existing/new) → [if new: payment] → spawn device → connection details → post-login flow
 */
export const LOGGED_IN_FLOW: FlowStep[] = [
  // Step 1: User asks question
  {
    id: "user-question-logged-in",
    actor: "user",
    message: "Add a machine to see its health score",
    nextStepId: "profile-selection-prompt",
  },

  // Step 2: Profile selection prompt
  {
    id: "profile-selection-prompt",
    actor: "assistant",
    message:
      "Got it. Do you want to use an existing asset profile or create a new one?",
    widget: {
      type: "profile-selection-form",
    },
    action: "show-profile-selection",
    waitForUserInput: true,
    nextStepId: (context: FlowContext) =>
      context.profileKey && context.profileConfig?.profileName
        ? "existing-profile-selected"
        : "new-profile-form",
  },

  // Existing profile path
  {
    id: "existing-profile-selected",
    actor: "user",
    message: (context: FlowContext) =>
      `Use existing profile: ${context.profileConfig?.profileName || "Selected Profile"}`,
    nextStepId: "existing-profile-confirmed",
  },

  {
    id: "existing-profile-confirmed",
    actor: "assistant",
    message: (context: FlowContext) =>
      `Great, let's go with ${context.profileConfig?.profileName || "this profile"}.`,
    nextStepId: "logged-in-device-spawn",
  },

  // New profile path
  {
    id: "new-profile-form",
    actor: "assistant",
    message:
      "Great! Let's create a new asset profile. Please fill out the form below as best you can!",
    widget: {
      type: "profile-config-form",
    },
    waitForUserInput: true,
    nextStepId: "new-profile-submitted",
  },

  {
    id: "new-profile-submitted",
    actor: "user",
    message: (context: FlowContext) => {
      const config = context.profileConfig;
      if (!config) return "Profile configuration submitted";
      return `Profile name: ${config.profileName}\nTraining seconds: ${config.trainingSeconds}\nDays to Maintenance: ${config.daysToMaintenance}\nCycle Duration: ${config.cycleDuration}`;
    },
    nextStepId: "payment-prompt",
  },

  {
    id: "payment-prompt",
    actor: "assistant",
    message:
      "Great now please select your payment plan and provide your payment details.",
    widget: {
      type: "payment-form",
    },
    waitForUserInput: true,
    nextStepId: "payment-submitted",
  },

  {
    id: "payment-submitted",
    actor: "user",
    message: "Payment information provided",
    nextStepId: "payment-received",
  },

  {
    id: "payment-received",
    actor: "assistant",
    message:
      "I received your payment information; I will now create your asset profile!",
    action: "create-new-profile",
    nextStepId: "profile-created",
  },

  {
    id: "profile-created",
    actor: "assistant",
    message: "I am spawning your MI Agent now.",
    nextStepId: "logged-in-device-spawn",
  },

  // Common device spawn for logged-in users
  {
    id: "logged-in-device-spawn",
    actor: "assistant",
    message: "Spawning your machine intelligence agent...",
    widget: {
      type: "device-status-widget",
    },
    action: "spawn-live-device",
    nextStepId: "logged-in-mqtt-details",
  },

  {
    id: "logged-in-mqtt-details",
    actor: "assistant",
    message: "Here are your connection details:",
    widget: {
      type: "mqtt-connection-info",
    },
    action: "show-connection-details",
    nextStepId: "logged-in-device-complete",
  },

  {
    id: "logged-in-device-complete",
    actor: "assistant",
    message: "Machine is activated successfully.",
    action: "show-dashboard",
    nextStepId: "dashboard-shown",
  },

  // Continue with POST_LOGIN_FLOW steps (include required intermediate steps)
  ...POST_LOGIN_FLOW.filter((step) =>
    [
      "session-transfer",
      "dashboard-shown",
      "user-invitation-prompt",
      "users-submitted",
      "users-added",
      "notification-prompt",
      "notification-confirm",
      "test-ticket-prompt",
      "test-ticket-created",
      "completion",
      "nudges",
    ].includes(step.id),
  ),
];

/**
 * Flow Manager - Executes the flow steps
 */
export class FlowManager {
  private flow: FlowStep[];
  private currentStepIndex: number = 0;
  private context: FlowContext = {};

  constructor(flowType: "non-login" | "logged-in") {
    this.flow = flowType === "non-login" ? NON_LOGIN_FLOW : LOGGED_IN_FLOW;
  }

  getCurrentStep(): FlowStep | null {
    return this.flow[this.currentStepIndex] || null;
  }

  getStepById(id: string): FlowStep | null {
    return this.flow.find((step) => step.id === id) || null;
  }

  advanceToNextStep(): FlowStep | null {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return null;

    let nextStepId: string | null = null;

    if (typeof currentStep.nextStepId === "function") {
      nextStepId = currentStep.nextStepId(this.context);
    } else {
      nextStepId = currentStep.nextStepId || null;
    }

    if (!nextStepId) return null;

    const nextStepIndex = this.flow.findIndex((step) => step.id === nextStepId);
    if (nextStepIndex === -1) return null;

    // Guard: if next step resolves to the current step, do not advance
    if (nextStepIndex === this.currentStepIndex) {
      return null;
    }

    this.currentStepIndex = nextStepIndex;
    return this.flow[nextStepIndex];
  }

  jumpToStep(stepId: string): FlowStep | null {
    const stepIndex = this.flow.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) return null;

    this.currentStepIndex = stepIndex;
    return this.flow[stepIndex];
  }

  updateContext(updates: Partial<FlowContext>): void {
    this.context = { ...this.context, ...updates };
  }

  getContext(): FlowContext {
    return { ...this.context };
  }

  renderMessage(step: FlowStep): string {
    if (typeof step.message === "function") {
      return step.message(this.context);
    }
    return step.message;
  }

  reset(): void {
    this.currentStepIndex = 0;
    this.context = {};
  }
}
