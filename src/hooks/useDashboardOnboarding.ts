import { useState, useCallback, useEffect, useRef } from 'react';
import { FlowManager, type FlowStep, type FlowContext, type FlowStepAction } from '@/lib/onboarding/flows';

interface ChatMessage {
  id: string;
  actor: 'user' | 'assistant';
  message: string;
  widget?: any;
  timestamp: Date;
}

interface DashboardOnboardingState {
  messages: ChatMessage[];
  isProcessing: boolean;
  isActive: boolean;
  currentStep: FlowStep | null;
  handleUserInput: (input: string | any) => Promise<void>;
  getCurrentWidget: () => any;
  getContext: () => FlowContext;
  addMessage: (actor: 'user' | 'assistant', message: string, widget?: any) => void;
}

export function useDashboardOnboarding(): DashboardOnboardingState {
  const [flowManager] = useState(() => new FlowManager('logged-in'));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActive, setIsActive] = useState(false); // Start inactive, activated by user query
  const messageIdCounter = useRef(0);
  const initializedRef = useRef(false);
  const needsPostLoginFlowRef = useRef(false);

  const [isPostLogin, setIsPostLogin] = useState(false);
  const postLoginStageRef = useRef<
    | 'idle'
    | 'workflow-question'
    | 'invite-question'
    | 'awaiting-invite-email'
    | 'fault-question'
    | 'waiting-ticket'
    | 'awaiting-assignee'
    | 'confirm-assignee'
    | 'post-assignment-status-question'
  >('idle');

  type AssignableUser = {
    name: string;
    email: string;
    role?: string;
  };

  const assignableUsersRef = useRef<AssignableUser[]>([]);
  const pendingAssignmentRef = useRef<
    | {
        ticketId: string;
        user: AssignableUser;
      }
    | null
  >(null);

  const lastAssignedTicketIdRef = useRef<string | null>(null);

  // Initialize flow from saved state (runs once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const onboardingState = localStorage.getItem('onboarding_state');
    const savedMessages = localStorage.getItem('onboarding_chat_messages');

    const machineConfigHelpWidget = {
      type: 'info-popup-button',
      data: {
        infoType: 'machine-config-help',
        title: 'Machine Parameter Configuration',
        buttonText: 'View Parameter Configuration Info',
        content: {},
      },
    };

    const channelConfigHelpWidget = {
      type: 'info-popup-button',
      data: {
        infoType: 'channel-config-help',
        title: 'Channel Configuration',
        buttonText: 'View Channel Configuration Info',
        content: {},
      },
    };

    const mqttHelpWidget = {
      type: 'info-popup-button',
      data: {
        infoType: 'mqtt-setup',
        title: 'MQTT Configuration',
        buttonText: 'View MQTT Configuration Info',
        content: {
          brokerEndpoint: 'mqtt.industrialiq.ai',
          brokerPort: 8883,
          topic: 'telemetry',
        },
      },
    };

    const widgetHasButtonText = (w: any, buttonText: string): boolean => {
      if (!w) return false;
      if (w?.type === 'info-popup-button' && w?.data?.buttonText === buttonText) return true;
      if (w?.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
        return w.data.widgets.some((child: any) => widgetHasButtonText(child, buttonText));
      }
      return false;
    };

    const prependWidgets = (existingWidget: any, toPrepend: any[]) => {
      const additions = toPrepend.filter(
        (nw) => !widgetHasButtonText(existingWidget, nw?.data?.buttonText),
      );
      if (additions.length === 0) return existingWidget;

      if (!existingWidget) {
        if (additions.length === 1) return additions[0];
        return { type: 'widget-stack', data: { widgets: additions } };
      }

      if (existingWidget?.type === 'widget-stack' && Array.isArray(existingWidget?.data?.widgets)) {
        return {
          ...existingWidget,
          data: {
            ...existingWidget.data,
            widgets: [...additions, ...existingWidget.data.widgets],
          },
        };
      }

      return { type: 'widget-stack', data: { widgets: [...additions, existingWidget] } };
    };

    const injectReferenceButtonsIntoHistory = (raw: any[]) => {
      if (!Array.isArray(raw) || raw.length === 0) return raw;

      // Remove legacy "standalone" reference buttons that were appended as separate messages.
      const referenceButtonTexts = [
        'View Parameter Configuration Info',
        'View Channel Configuration Info',
        'View MQTT Configuration Info',
      ];

      const cleaned = raw.filter((m: any) => {
        const buttonText = (m as any)?.widget?.data?.buttonText;
        const isStandaloneReferenceButton =
          (m as any)?.actor === 'assistant' &&
          ((m as any)?.message === '' || (m as any)?.message == null) &&
          (m as any)?.widget?.type === 'info-popup-button' &&
          referenceButtonTexts.includes(buttonText);

        return !isStandaloneReferenceButton;
      });

      return cleaned.map((m: any) => {
        if (!m || m.actor !== 'assistant') return m;

        // Machine details step (has machine-details-form widget)
        if (m?.widget?.type === 'machine-details-form') {
          const nextWidget = prependWidgets(m.widget, [machineConfigHelpWidget]);
          return nextWidget === m.widget ? m : { ...m, widget: nextWidget };
        }

        // Channel config step (has channel-configuration-widget widget)
        if (m?.widget?.type === 'channel-configuration-widget') {
          const nextWidget = prependWidgets(m.widget, [channelConfigHelpWidget]);
          return nextWidget === m.widget ? m : { ...m, widget: nextWidget };
        }

        // MQTT step (message contains endpoint details; often no widget)
        if (
          typeof m?.message === 'string' &&
          (m.message.includes('Endpoint: mqtt.industrialiq.ai') ||
            m.message.includes("We'll provide you with MQTT broker details"))
        ) {
          const nextWidget = prependWidgets(m.widget, [mqttHelpWidget]);
          return nextWidget === m.widget ? m : { ...m, widget: nextWidget };
        }

        return m;
      });
    };

    // Fallback: if we have messages saved, ensure chat is active even if flag missing
    if (savedMessages && !onboardingState) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          const hydrated = injectReferenceButtonsIntoHistory(parsedMessages);
          setIsActive(true);
          setMessages(hydrated);
          messageIdCounter.current = hydrated.length;
          // Assume post-login if we have saved messages but no active flow state
          setIsPostLogin(true);
        }
      } catch {}
    }

    if (onboardingState) {
      try {
        const state = JSON.parse(onboardingState);
        
        // Only continue if shouldContinue flag is set
        if (state.shouldContinue) {
          setIsActive(true);

          // Restore previous messages and ensure device status widget persists
          let initialMsgs: ChatMessage[] = [];
          if (savedMessages) {
            try {
              initialMsgs = injectReferenceButtonsIntoHistory(
                JSON.parse(savedMessages) as ChatMessage[],
              ) as ChatMessage[];
            } catch {}
          }
          // If no device status widget found and we have a device, inject one
          const hasDeviceStatus = initialMsgs.some(m => (m as any)?.widget?.type === 'device-status-widget');
          if (!hasDeviceStatus && state.deviceId) {
            initialMsgs.push({
              id: `msg-${messageIdCounter.current++}`,
              actor: 'assistant',
              message: 'Creating your device with the provided configuration...',
              widget: { type: 'device-status-widget', data: { deviceId: state.deviceId } },
              timestamp: new Date(),
            });
          }
          if (initialMsgs.length > 0) {
            setMessages(initialMsgs);
            messageIdCounter.current = initialMsgs.length;
          }

          // Restore context
          flowManager.updateContext({
            email: state.email,
            deviceId: state.deviceId,
            profileKey: state.profileKey,
            mode: state.mode,
            sessionId: state.sessionId,
            chatId: state.chatId,
          });

          // Enter Post-Login Mode (Regex Mode)
          setIsPostLogin(true);
          needsPostLoginFlowRef.current = true;

          // Clear the flag so we don't re-initialize
          localStorage.setItem('onboarding_state', JSON.stringify({
            ...state,
            shouldContinue: false,
          }));
        }
      } catch (error) {
        console.error('Failed to restore onboarding state:', error);
      }
    }
  }, [flowManager]);

  // Keep a ref to the latest messages to avoid stale closures in callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0 && isActive) {
      localStorage.setItem('onboarding_chat_messages', JSON.stringify(messages));
    }
  }, [messages, isActive]);

  const addMessageFromCurrentStep = useCallback((widget?: any) => {
    const currentStep = flowManager.getCurrentStep();
    if (!currentStep) return;

    const renderedMessage = flowManager.renderMessage(currentStep);

    // Skip empty messages unless there's a widget
    if (!renderedMessage && !currentStep.widget && !widget) {
      return;
    }

    const baseWidget = currentStep.actor === 'assistant' ? (currentStep.widget || widget) : undefined;

    // Inject contextual "info" buttons under the SAME message (via widget-stack)
    const helpWidgets: any[] = [];
    if (currentStep.actor === 'assistant') {
      if (currentStep.id === 'live-machine-details-prompt') {
        helpWidgets.push({
          type: 'info-popup-button',
          data: {
            infoType: 'machine-config-help',
            title: 'Machine Parameter Configuration',
            buttonText: 'View Parameter Configuration Info',
            content: {},
          },
        });
      }

      if (currentStep.id === 'live-mqtt-prompt') {
        helpWidgets.push({
          type: 'info-popup-button',
          data: {
            infoType: 'mqtt-setup',
            title: 'MQTT Configuration',
            buttonText: 'View MQTT Configuration Info',
            content: {
              brokerEndpoint: 'mqtt.industrialiq.ai',
              brokerPort: 8883,
              topic: 'telemetry',
            },
          },
        });
      }

      if (currentStep.id === 'live-channel-config') {
        helpWidgets.push({
          type: 'info-popup-button',
          data: {
            infoType: 'channel-config-help',
            title: 'Channel Configuration',
            buttonText: 'View Channel Configuration Info',
            content: {},
          },
        });
      }
    }

    const mergedWidget = (() => {
      if (helpWidgets.length === 0) return baseWidget;
      if (!baseWidget) {
        return helpWidgets.length === 1
          ? helpWidgets[0]
          : { type: 'widget-stack', data: { widgets: helpWidgets } };
      }
      if (baseWidget?.type === 'widget-stack' && Array.isArray(baseWidget?.data?.widgets)) {
        return {
          ...baseWidget,
          data: {
            ...baseWidget.data,
            widgets: [...helpWidgets, ...baseWidget.data.widgets],
          },
        };
      }
      return { type: 'widget-stack', data: { widgets: [...helpWidgets, baseWidget] } };
    })();

    const message: ChatMessage = {
      id: `msg-${messageIdCounter.current++}`,
      actor: currentStep.actor,
      message: renderedMessage,
      widget: currentStep.actor === 'assistant' ? mergedWidget : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
  }, [flowManager]);

  const addUserMessage = useCallback((text: string) => {
    const message: ChatMessage = {
      id: `msg-${messageIdCounter.current++}`,
      actor: 'user',
      message: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
  }, []);

  const addAssistantMessage = useCallback((text: string, widget?: any) => {
    const message: ChatMessage = {
      id: `msg-${messageIdCounter.current++}`,
      actor: 'assistant',
      message: text,
      widget,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const executeAction = useCallback(async (action: FlowStepAction, payload?: any) => {
    const context = flowManager.getContext();

    switch (action) {
      case 'show-profile-selection': {
        // Profile selection widget is displayed
        console.log('✅ Showing profile selection');
        return true;
      }

      case 'create-new-profile': {
        // Create new profile with payment information
        const config = payload?.profileConfig || context.profileConfig;
        console.log('✅ Creating new profile:', config);
        
        // TODO: Make actual API call
        const mockProfileKey = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        flowManager.updateContext({
          profileKey: mockProfileKey,
        });
        return true;
      }

      case 'register-email': {
        const email = payload?.email || context.email;
        console.log('✅ Registering email (mock - allowing repeats):', email);
        // Mock: Always succeed, allowing repeat emails without redirecting to login
        return true;
      }

      case 'validate-otp': {
        const otp = payload?.otp || context.otp;
        console.log('✅ Validating OTP (mock - any 6 digits):', otp);
        // Mock: Accept any OTP
        return true;
      }

      case 'spawn-demo-device': {
        console.log('🚀 Spawning demo device');
        const mockDeviceId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        flowManager.updateContext({
          deviceId: mockDeviceId,
          mode: 'demo',
        });
        return true;
      }

      case 'spawn-live-device': {
        const config = payload?.config || context.profileConfig;
        
        console.log('🚀 Spawning live device with config:', config);
        
        if (!context.profileKey) {
          console.error('❌ No profileKey in context for live device spawn');
          return false;
        }
        
        if (!config) {
          console.error('❌ No config provided for live device spawn');
          return false;
        }
        
        // TODO: Make actual API call to spawn device
        const mockDeviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const mockMqttConnection = {
          brokerEndpoint: 'mqtt.example.com',
          brokerPort: 8883,
          topic: `device/${mockDeviceId}/telemetry`,
          username: mockDeviceId,
          password: 'generated_password_123',
          sampleSchema: {
            temperature: 'float',
            pressure: 'float',
            vibration: 'float',
          },
        };
        
        flowManager.updateContext({
          deviceId: mockDeviceId,
          mode: 'live',
          mqttConnection: mockMqttConnection,
        });
        return true;
      }

      case 'show-connection-details': {
        // Connection details are already in context from spawn-live-device
        console.log('✅ Showing connection details');
        return true;
      }

      case 'transfer-session': {
        try {
          // Transfer the session from anonymous to authenticated user
          const ctx = flowManager.getContext();
          const userSessionRaw = localStorage.getItem('user_session');
          const userSession = userSessionRaw ? JSON.parse(userSessionRaw) : null;
          const authenticatedUserId = userSession?.userId || 'user_authenticated_123';
          const res = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'transfer',
              anonSessionId: ctx.sessionId,
              anonUserId: ctx.sessionId,
              authenticatedUserId,
              chatId: ctx.chatId,
            }),
          });
          const data = await res.json();
          if (data?.success) {
            console.log('✅ Session transferred');
            flowManager.updateContext({ sessionId: data.newSessionId, chatId: data.chatId });
            return true;
          }
          console.warn('Session transfer failed, proceeding optimistically', data);
        } catch (e) {
          console.warn('Session transfer error, proceeding optimistically', e);
        }
        return true;
      }

      case 'show-dashboard': {
        // Dashboard is already displayed
        console.log('✅ Dashboard is displayed');
        return true;
      }

      case 'add-users': {
        let users = payload?.users || payload?.invitedUsers;
        // If the input is a plain string, parse comma-separated emails
        if (typeof payload === 'string' && (!users || users.length === 0)) {
          const emails = payload
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s && s.includes('@'));
          users = emails.map((email: string) => ({ name: email.split('@')[0], email, role: 'Viewer' }));
        }
        // If nextStep is 'users-submitted', make sure context has invitedUsers
        if (!users || users.length === 0) {
          console.warn('No users parsed from input for add-users');
          return false;
        }
        try {
          const res = await fetch('/api/v2/user/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users }),
          });
          await res.json();
        } catch (e) {
          console.warn('Invite API failed, proceeding locally', e);
        }
        console.log('Adding users:', users);
        flowManager.updateContext({ invitedUsers: users });
        return true;
      }

      case 'subscribe-notifications': {
        try {
          let email = context.email;
          if (!email) {
            const me = await fetch('/api/v2/user/me');
            const meData = await me.json();
            email = meData?.email;
          }
          await fetch('/api/v2/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'email', email, deviceId: context.deviceId }),
          });
          console.log('✅ Subscribing to notifications');
        } catch (e) {
          console.warn('Subscription API failed, proceeding optimistically', e);
        }
        flowManager.updateContext({ notificationsEnabled: true });
        return true;
      }

      case 'switch-graph-channel': {
        try {
          const to = (payload && payload.to) || 'Speed';
          await fetch('/api/v2/dashboard/switch-channel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: context.deviceId, to }),
          });
          console.log(`✅ Switched dashboard graphs to ${to}`);
          return true;
        } catch (e) {
          console.error('Failed switching graph channel', e);
          return false;
        }
      }

      case 'query-metrics': {
        try {
          const res = await fetch('/api/v2/metrics/query?metrics=vibration,temperature&window=7d');
          const data = await res.json();
          console.log('📈 Metrics queried:', data);
          flowManager.updateContext({ lastMetricsWindow: '7d' as any });
          return true;
        } catch (e) {
          console.error('Failed querying metrics', e);
          return false;
        }
      }

      case 'compute-correlation': {
        try {
          const res = await fetch('/api/v2/metrics/correlation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: 'vibration', y: 'cycle_duration', window: '7d' }),
          });
          const data = await res.json();
          console.log('🔗 Correlation:', data);
          flowManager.updateContext({ correlation: data?.correlation });
          return true;
        } catch (e) {
          console.error('Failed computing correlation', e);
          return false;
        }
      }

      case 'forecast-maintenance': {
        try {
          const res = await fetch('/api/v2/forecast/maintenance', { method: 'POST' });
          const data = await res.json();
          console.log('🗓️ Forecast maintenance:', data);
          flowManager.updateContext({ predictedMaintenanceInDays: data?.predictedInDays, predictedMaintenanceDate: data?.date });
          return true;
        } catch (e) {
          console.error('Failed forecasting maintenance', e);
          return false;
        }
      }

      case 'explain-health-drivers': {
        try {
          const res = await fetch('/api/v2/health/drivers');
          const data = await res.json();
          console.log('🧠 Health drivers:', data);
          flowManager.updateContext({ healthDrivers: data?.drivers });
          return true;
        } catch (e) {
          console.error('Failed explaining health drivers', e);
          return false;
        }
      }

      case 'compare-lines': {
        try {
          const res = await fetch('/api/v2/compare/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ a: 'line-a', b: 'line-b', metric: 'vibration', since: 'monday' }),
          });
          const data = await res.json();
          console.log('📊 Line comparison:', data);
          flowManager.updateContext({ comparisonSummary: data?.summary });
          return true;
        } catch (e) {
          console.error('Failed comparing lines', e);
          return false;
        }
      }

      case 'create-test-ticket': {
        let ticketId = `T-${Date.now()}`;
        try {
          const res = await fetch('/api/v2/tickets/generate-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ severity: 'Warning' }),
          });
          const data = await res.json();
          ticketId = data?.ticketId || ticketId;
          console.log('✅ Created test ticket via API:', ticketId);
        } catch (e) {
          console.warn('Test ticket API failed, using fallback:', ticketId);
        }

        flowManager.updateContext({ testTicketId: ticketId });

        // Ensure the ticket exists in our demo tickets store so assignment/update succeeds.
        try {
          await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              ticket: {
                timestamp: new Date().toLocaleString(),
                workorder: `WO-${Math.floor(8000 + Math.random() * 500)}`,
                summary: 'Simulated fault detected (demo)',
                related: ticketId,
                severity: 'Warning',
                owner: 'Unassigned',
                status: 'New',
                machine: 'Demo Machine',
                timeline: [
                  {
                    id: `t-${Date.now()}`,
                    author: 'System',
                    body: 'Ticket auto-created by simulated fault.',
                    timestamp: new Date().toLocaleString(),
                  },
                ],
              },
            }),
          });
        } catch (e) {
          console.warn('Failed creating demo ticket in /api/tickets (non-fatal)', e);
        }

        return true;
      }

      case 'show-completion': {
        // Onboarding complete
        console.log('🎉 Onboarding complete!');
        // Clear the onboarding state after a delay
        setTimeout(() => {
          localStorage.removeItem('onboarding_state');
          setIsActive(false);
        }, 3000);
        return true;
      }

      default:
        return true;
    }
  }, [flowManager]);

  const handleUserInput = useCallback(async (input: string | any) => {
    setIsProcessing(true);

    try {
      const currentStep = flowManager.getCurrentStep();

      const isYes = (s: string) => /^(y|yes|yeah|yep|sure|ok|okay|continue)$/i.test(s.trim());
      const isNo = (s: string) => /^(n|no|nope|not now)$/i.test(s.trim());
      const isInduced = (s: string) => /(induced|triggered|done|started|i did|i have induced|test condition)/i.test(s.trim());

      const normalize = (s: string) =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9@\s._-]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const fetchAssignableUsers = async (): Promise<AssignableUser[]> => {
        const ctx = flowManager.getContext();
        const invited = Array.isArray((ctx as any).invitedUsers) ? (ctx as any).invitedUsers : [];

        const fallbackUsers: AssignableUser[] = [
          { name: 'Amelia Chen', email: 'amelia@industrialiq.ai', role: 'Admin' },
          { name: 'Jane Cooper', email: 'jcooper@industrialiq.ai', role: 'Manager' },
          { name: 'Devon Lane', email: 'devon@industrialiq.ai', role: 'Technician' },
          { name: 'Courtney Henry', email: 'courtney@industrialiq.ai', role: 'Operator' },
        ];

        try {
          const res = await fetch('/api/state');
          const data = await res.json();
          const apiUsers = Array.isArray(data?.state?.collaborators) ? data.state.collaborators : [];

          const merged = [...apiUsers, ...invited, ...fallbackUsers]
            .filter((u: any) => u?.email)
            .reduce((acc: AssignableUser[], u: any) => {
              if (acc.some((x) => x.email === u.email)) return acc;
              acc.push(u);
              return acc;
            }, []);

          assignableUsersRef.current = merged;
          return merged;
        } catch {
          const merged = [...invited, ...fallbackUsers]
            .filter((u: any) => u?.email)
            .reduce((acc: AssignableUser[], u: any) => {
              if (acc.some((x) => x.email === u.email)) return acc;
              acc.push(u);
              return acc;
            }, []);

          assignableUsersRef.current = merged;
          return merged;
        }
      };

      const isShowUsersIntent = (s: string) =>
        /^show\s+me\s+users$|^show\s+users$|list\s+users|who\s+can\s+i\s+assign/i.test(s.trim());

      // === Post-login scripted flow (YES/NO gating per spec) ===
      if (isPostLogin) {
        // Handle widget submissions for invite email
        if (
          postLoginStageRef.current === 'awaiting-invite-email' &&
          typeof input === 'object' &&
          input &&
          typeof (input as any).email === 'string' &&
          (input as any).email.trim()
        ) {
          const email = (input as any).email.trim();
          // Do NOT echo email back as a user message (privacy)
          const users = [{ name: email.split('@')[0] || 'User', email, role: 'Viewer' }];
          await executeAction('add-users', { users });
          await new Promise((resolve) => setTimeout(resolve, 500));
          addAssistantMessage('Perfect — your invite has been sent.');

          const ctx = flowManager.getContext();
          const mode = ctx.mode || 'demo';
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (mode === 'demo') {
            addAssistantMessage(
              'Now, would you like to see the agentic workflow in action?\n\nSince this is a demo machine, I can introduce a controlled fault for you.\nThis will simulate the robotic arm’s motor behaving abnormally and causing vibration anomalies.\n\nHere’s what you’ll experience step-by-step:\n• The Machine Intelligence Agent will detect the abnormal sensor patterns\n• The Health Score will drop in real time\n• A fault notification will be generated with the identified root cause\n• A maintenance ticket will be automatically created\n• The alert will be sent to you or whichever engineer is assigned\n\nWould you like me to trigger this simulated fault now?'
            );
          } else {
            addAssistantMessage(
              'Would you like to see the agentic workflow in action?\n\nSince this is a live machine, I can’t introduce a fault — but you can safely create or reproduce a minor test condition on your side.\n\nOnce that happens, you’ll see:\n• The Machine Intelligence Agent detect the anomaly\n• The Health Score drop\n• A real-time alert with the identified root cause\n• A ticket automatically created\n\nLet me know once you’ve induced the test condition — as soon as the alert and ticket appear, I’ll retrieve the ticket for this device and guide you through the assignment process.'
            );
          }

          postLoginStageRef.current = 'fault-question';
          setIsProcessing(false);
          return;
        }
      }
      
      // === REGEX-BASED INTENT PARSING (High Priority) ===
      if (typeof input === 'string' && input && input.trim()) {
        const text = input.trim();
        const userInput = text.toLowerCase();

        if (isPostLogin) {
          // 0) Post-assignment follow-up (smooth continuation)
          if (
            postLoginStageRef.current === 'post-assignment-status-question' &&
            (isYes(text) || isNo(text))
          ) {
            addUserMessage(input);

            const ticketId = lastAssignedTicketIdRef.current;
            if (!ticketId) {
              await new Promise((resolve) => setTimeout(resolve, 300));
              addAssistantMessage('I don’t have a recent ticket to update.');
              postLoginStageRef.current = 'idle';
              setIsProcessing(false);
              return;
            }

            if (isNo(text)) {
              await new Promise((resolve) => setTimeout(resolve, 300));
              addAssistantMessage(
                `Okay — leaving ticket **${ticketId}** as-is. You can always update it later from this chat (e.g. "update ticket ${ticketId} status to In Progress").`,
              );
              postLoginStageRef.current = 'idle';
              setIsProcessing(false);
              return;
            }

            try {
              await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'updateStatus',
                  id: ticketId,
                  status: 'In Progress',
                }),
              });
            } catch {
              // Non-fatal in this demo
            }

            await new Promise((resolve) => setTimeout(resolve, 350));
            addAssistantMessage(
              `Done — ticket **${ticketId}** is now **In Progress**.\n\nIf you'd like, I can also add a note for the assignee or reassign it at any time.`,
            );
            postLoginStageRef.current = 'idle';
            setIsProcessing(false);
            return;
          }

          // 1) Ticket assignment conversational flow (after "I see the ticket")
          if (postLoginStageRef.current === 'awaiting-assignee') {
            // Allow showing user list without leaving the stage
            if (isShowUsersIntent(text)) {
              addUserMessage(input);
              const users = await fetchAssignableUsers();
              const list = users.map((u) => `• ${u.name} (${u.email}) — ${u.role || 'User'}`).join('\n');
              await new Promise((resolve) => setTimeout(resolve, 500));
              addAssistantMessage(`Here are the users you can assign tickets to:\n\n${list}`);
              setIsProcessing(false);
              return;
            }

            if (isNo(text)) {
              addUserMessage(input);
              await new Promise((resolve) => setTimeout(resolve, 400));
              addAssistantMessage('Okay — no assignment changes made.');
              postLoginStageRef.current = 'idle';
              setIsProcessing(false);
              return;
            }

            addUserMessage(input);

            const ticketId = flowManager.getContext().testTicketId;
            if (!ticketId) {
              await new Promise((resolve) => setTimeout(resolve, 400));
              addAssistantMessage('I don’t have a ticket to assign yet. Please type "I see the ticket" first.');
              setIsProcessing(false);
              return;
            }

            const users = assignableUsersRef.current.length > 0 ? assignableUsersRef.current : await fetchAssignableUsers();
            const normalizedInput = normalize(text);
            const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);

            const matches = users.filter((u) => {
              const email = normalize(u.email || '');
              const name = normalize(u.name || '');

              if (emailMatch) return email === normalize(emailMatch[0]);
              if (!normalizedInput) return false;

              // Exact or partial match on full name
              if (name === normalizedInput) return true;
              if (name.includes(normalizedInput)) return true;

              // Token-based match (first/last name)
              const tokens = name.split(' ');
              return tokens.some((t) => t && (t === normalizedInput || t.startsWith(normalizedInput)));
            });

            if (matches.length === 0) {
              await new Promise((resolve) => setTimeout(resolve, 400));
              addAssistantMessage(
                'I couldn’t match that to a user. Please type the full name or email, or type "show me users" to see the list again.',
              );
              setIsProcessing(false);
              return;
            }

            if (matches.length > 1) {
              const list = matches
                .slice(0, 5)
                .map((u) => `• ${u.name} (${u.email})`)
                .join('\n');
              await new Promise((resolve) => setTimeout(resolve, 400));
              addAssistantMessage(
                `I found multiple matches. Please type the full name or email:\n\n${list}`,
              );
              setIsProcessing(false);
              return;
            }

            const selected = matches[0];
            pendingAssignmentRef.current = { ticketId, user: selected };
            await new Promise((resolve) => setTimeout(resolve, 500));
            addAssistantMessage(
              `Would you like to assign ticket **${ticketId}** to **${selected.name}** (${selected.email})? (Yes/No)`,
            );
            postLoginStageRef.current = 'confirm-assignee';
            setIsProcessing(false);
            return;
          }

          if (postLoginStageRef.current === 'confirm-assignee' && (isYes(text) || isNo(text))) {
            addUserMessage(input);

            const pending = pendingAssignmentRef.current;
            if (!pending) {
              await new Promise((resolve) => setTimeout(resolve, 300));
              addAssistantMessage('No pending assignment found. Type a user name to assign the ticket.');
              postLoginStageRef.current = 'awaiting-assignee';
              setIsProcessing(false);
              return;
            }

            if (isNo(text)) {
              await new Promise((resolve) => setTimeout(resolve, 400));
              addAssistantMessage('Okay — not assigning it yet. Type a different name/email, or type "show me users".');
              postLoginStageRef.current = 'awaiting-assignee';
              setIsProcessing(false);
              return;
            }

            try {
              await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'update',
                  id: pending.ticketId,
                  updates: { owner: pending.user.name },
                }),
              });
            } catch {
              // Non-fatal in this demo
            }

            await new Promise((resolve) => setTimeout(resolve, 400));
            addAssistantMessage(
              `Ticket **${pending.ticketId}** has been successfully assigned to **${pending.user.name}**.\n\nThis user will now receive notifications for this ticket and take appropriate action.\n\nYou can reassign or update this ticket at any time directly from this chat.`,
            );

            lastAssignedTicketIdRef.current = pending.ticketId;
            pendingAssignmentRef.current = null;

            await new Promise((resolve) => setTimeout(resolve, 700));
            addAssistantMessage(
              `Would you like me to move ticket **${pending.ticketId}** to **In Progress** now? (Yes/No)`,
            );

            postLoginStageRef.current = 'post-assignment-status-question';
            setIsProcessing(false);
            return;
          }
          // 0) Agentic workflow question gate
          if (postLoginStageRef.current === 'workflow-question' && (isYes(text) || isNo(text))) {
            addUserMessage(input);

            if (isNo(text)) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              addAssistantMessage('No problem — you can ask me to show the agentic workflow anytime.');
              postLoginStageRef.current = 'idle';
              setIsProcessing(false);
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, 800));
            addAssistantMessage(
              'Your Agentic Workflow is now active for this machine. This means the system is already:\n\n• Monitoring real-time behavior\n• Tracking health and maintenance risk\n• Generating alerts and tickets\n• Producing AI-driven insights and recommendations\n\nNow, let\'s set up who else should be involved.\nWould you like to invite other users to explore this machine with you and designate who should receive alerts and take action when something needs attention?'
            );
            postLoginStageRef.current = 'invite-question';
            setIsProcessing(false);
            return;
          }

          // 1) Invite other users gate
          if (postLoginStageRef.current === 'invite-question' && (isYes(text) || isNo(text))) {
            addUserMessage(input);

            if (isNo(text)) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              addAssistantMessage('Okay — we can set this up later.');
              postLoginStageRef.current = 'idle';
              setIsProcessing(false);
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
            addAssistantMessage(
              'Please provide the email address of the person you’d like to invite, and we’ll send them an invite so they can explore this machine and receive the appropriate alerts.',
              {
                type: 'email-form',
                data: {
                  label: 'Invitee Email Address',
                  helperText: "We'll send an invite email so they can access this machine.",
                  submitLabel: 'Send Invite',
                },
              }
            );
            postLoginStageRef.current = 'awaiting-invite-email';
            setIsProcessing(false);
            return;
          }

          // 2) Fault/test-condition gate (demo: trigger simulated fault, live: acknowledge)
          if (
            postLoginStageRef.current === 'fault-question' &&
            (isYes(text) || isNo(text) || isInduced(text))
          ) {
            addUserMessage(input);

            if (isNo(text)) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              addAssistantMessage('No problem — you can ask me to walk through the workflow anytime.');
              postLoginStageRef.current = 'idle';
              setIsProcessing(false);
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, 800));
            const ctx = flowManager.getContext();
            const mode = ctx.mode || 'demo';

            // If user already induced the condition, skip the "once you induce" wording.
            if (mode !== 'demo' && isInduced(text) && !isYes(text)) {
              addAssistantMessage(
                'Great — thanks. Once the alert/ticket appears, I’ll retrieve it and guide you through assignment.\n\n(As this is a mock, please type "I see the ticket" to continue)'
              );
              postLoginStageRef.current = 'waiting-ticket';
              setIsProcessing(false);
              return;
            }

            if (mode === 'demo') {
              addAssistantMessage(
                'Great — I\'ve triggered the simulated fault.\n\nYou should soon see:\n• A drop in the Health Score\n• A fault notification\n• A newly generated ticket in the Tickets section of your dashboard\n\nLet me know once you see the ticket appear, and I\'ll walk you through retrieving it and assigning it to the right person.\n\n(As this is a mock, please type "I see the ticket" to continue)'
              );
            } else {
              addAssistantMessage(
                'Great — once you induce a minor test condition on your side, you should soon see:\n\n• A Health Score drop\n• An alert with an identified root cause\n• A ticket automatically created\n\nLet me know once you see the ticket appear, and I\'ll retrieve it and guide you through assignment.\n\n(As this is a mock, please type "I see the ticket" to continue)'
              );
            }
            postLoginStageRef.current = 'waiting-ticket';
            setIsProcessing(false);
            return;
          }

          // If we asked for an invite email, accept typed email too
          if (postLoginStageRef.current === 'awaiting-invite-email') {
            const emails = text.match(/[\w\.-]+@[\w\.-]+\.\w+/g);
            if (emails && emails.length > 0) {
              const email = emails[0];
              const users = [{ name: email.split('@')[0] || 'User', email, role: 'Viewer' }];
              // Store the typed email as the user's message (OK in this demo)
              addUserMessage(input);
              await executeAction('add-users', { users });
              await new Promise((resolve) => setTimeout(resolve, 500));
              addAssistantMessage('Perfect — your invite has been sent.');
              postLoginStageRef.current = 'fault-question';

              const ctx = flowManager.getContext();
              const mode = ctx.mode || 'demo';
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (mode === 'demo') {
                addAssistantMessage(
                  'Now, would you like to see the agentic workflow in action?\n\nSince this is a demo machine, I can introduce a controlled fault for you.\n\nWould you like me to trigger this simulated fault now?'
                );
              } else {
                addAssistantMessage(
                  'Would you like to see the agentic workflow in action?\n\nSince this is a live machine, I can’t introduce a fault — but you can safely create or reproduce a minor test condition on your side. Let me know once you’ve induced it.'
                );
              }

              setIsProcessing(false);
              return;
            }
          }
        }

        // 1. Assign Users to Tickets
        const assignMatch = userInput.match(/assign\s+(?:ticket\s+)?([a-z0-9-]+)\s+to\s+(.+)/i);
        if (assignMatch) {
          addUserMessage(input);
          const ticketId = assignMatch[1]; // e.g. T-123
          const assignee = assignMatch[2]; // e.g. Alice
          
          try {
             // We try to find the ticket first via API or just optimistically update
             // Since we are in a hook, we can't easily access the page's ticket state directly
             // But we can call the same API the page uses
             const res = await fetch('/api/tickets', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'update', id: ticketId, updates: { owner: assignee } }),
             });
             const data = await res.json();
             if (data.ticket) {
               addAssistantMessage(`I've assigned ticket ${ticketId} to ${assignee}.`);
             } else {
               addAssistantMessage(`I couldn't find ticket ${ticketId}. Please check the ID.`);
             }
          } catch (e) {
             addAssistantMessage(`Failed to assign ticket. Please try again.`);
          }
          setIsProcessing(false);
          return;
        }

        // 2. Invite Users
        if (userInput.match(/invite|add user|team|collaborator/)) {
           addUserMessage(input);
           if (userInput.includes('@')) {
             // Attempt to extract emails directly
             const emails = text.match(/[\w\.-]+@[\w\.-]+\.\w+/g);
             if (emails && emails.length > 0) {
               const users = emails.map((email: string) => ({ name: email.split('@')[0], email, role: 'Viewer' }));
               await executeAction('add-users', { users });
               addAssistantMessage(`Invited: ${emails.join(', ')}`);
             } else {
               addAssistantMessage("I can help you invite team members. Who would you like to invite?", { type: 'user-invitation-form' });
             }
           } else {
             addAssistantMessage("I can help you invite team members. Who would you like to invite?", { type: 'user-invitation-form' });
           }
           setIsProcessing(false);
           return;
        }

        // 3. Getting Recent Tickets
        if (userInput.match(/recent ticket|latest ticket|show ticket|list ticket/)) {
           addUserMessage(input);
           try {
             const res = await fetch('/api/tickets?pageSize=5');
             const data = await res.json();
             if (data.tickets && data.tickets.length > 0) {
               const ticketList = data.tickets.map((t: any) => `• **${t.related}**: ${t.summary} (${t.status})`).join('\n');
               addAssistantMessage(`Here are the recent tickets:\n\n${ticketList}`);
             } else {
               addAssistantMessage("You don't have any recent tickets.");
             }
           } catch (e) {
             addAssistantMessage("Failed to fetch tickets.");
           }
           setIsProcessing(false);
           return;
        }

        // 4. Demo Fault Simulation
        if (userInput.match(/simulate|fault|trigger|demo fault|test fault/)) {
          addUserMessage(input);
          await new Promise(resolve => setTimeout(resolve, 800));
          const ctx = flowManager.getContext();
          const mode = ctx.mode || 'demo';
          
          if (mode === 'demo') {
            addAssistantMessage(
              'Great — I\'ve triggered the simulated fault. You should soon see:\n\n• A drop in the Health Score\n• A fault notification\n• A newly generated ticket in the Tickets section of your dashboard\n\nLet me know once you see the ticket appear, and I\'ll walk you through retrieving it and assigning it to the right person.\n\n(As this is a mock, please type "I see the ticket" to continue)'
            );
          }
          setIsProcessing(false);
          return;
        }

        // 4b. Ticket appeared response
        if (userInput.match(/see.*ticket|ticket.*appear|ticket.*visible|found.*ticket/i)) {
          addUserMessage(input);
          await executeAction('create-test-ticket');
          const tid = flowManager.getContext().testTicketId;
          await new Promise((resolve) => setTimeout(resolve, 800));
          addAssistantMessage(
            `You can assign tickets directly through this chat interface — no need to navigate away.\n\nType the name/email of the person you'd like to assign ticket **${tid}** to, or type "show me users" to see the list.`,
          );
          postLoginStageRef.current = 'awaiting-assignee';
          setIsProcessing(false);
          return;
        }

        // 5. Creating a Ticket
        if (userInput.match(/create ticket|open ticket|new ticket|issue|problem|repair/)) {
           addUserMessage(input);
           addAssistantMessage("Opening a new maintenance ticket for you...", { type: 'ticket-creation-form' }); 
           await executeAction('create-test-ticket');
           const tid = flowManager.getContext().testTicketId;
           addAssistantMessage(`Draft ticket ${tid} created. Please fill in the details in the Tickets panel.`);
           setIsProcessing(false);
           return;
        }

        // 5. Compare Sensor Values
        if (userInput.match(/compare|sensor|graph|chart|metric/)) {
           addUserMessage(input);
           addAssistantMessage("I've highlighted the sensor comparison view. You can toggle between Vibration, Temperature, and Pressure on the charts panel.");
           await executeAction('switch-graph-channel', { to: 'Vibration' }); 
           setIsProcessing(false);
           return;
        }

        // 5.5 Show me users (ticket assignment helper)
        if (isShowUsersIntent(text)) {
          addUserMessage(input);

          const merged = await fetchAssignableUsers();
          const list = merged
            .map((u) => `• ${u.name} (${u.email}) — ${u.role || 'User'}`)
            .join('\n');

          await new Promise((resolve) => setTimeout(resolve, 500));
          addAssistantMessage(`Here are the users you can assign tickets to:\n\n${list}`);

          setIsProcessing(false);
          return;
        }

        // 6. Showing different dashboards / Switching graphs
        // IMPORTANT: do not treat "show me users" as a graph switch
        const switchMatch = userInput.match(/(?:switch|change\s+graph|show)\s+(?!me\b)(.+)/i);
        if (switchMatch) {
           // Be careful not to over-match "show ticket"
           if (!userInput.includes('ticket')) {
             addUserMessage(input);
             const target = switchMatch[1].replace(/graph|dashboard|sensor/gi, '').trim();
             // Heuristic mapping
             let channel = 'Speed';
             if (target.match(/temp|heat/)) channel = 'Temperature';
             if (target.match(/vib/)) channel = 'Vibration';
             if (target.match(/press/)) channel = 'Pressure';
             
             const ok = await executeAction('switch-graph-channel', { to: channel });
             addAssistantMessage(ok ? `Switched dashboard graphs to ${channel}.` : `I couldn't switch to ${target}.`);
             setIsProcessing(false);
             return;
           }
        }
        
        // Specific exact matches (Legacy support)
        if (text === 'Show connection details') {
          addUserMessage(input);
          const ctx = flowManager.getContext();
          const renderConn = () => ({ type: 'mqtt-connection-info' });
          if (ctx.mqttConnection) {
            addAssistantMessage('Here are your connection details:', renderConn());
          } else {
            addAssistantMessage('Connection details are not available yet. Try after the device is created.');
          }
          setIsProcessing(false);
          return;
        }


        // General / Help
        if (userInput.match(/help|hi|hello|start|options/)) {
           addUserMessage(input);
           addAssistantMessage("Thank you for logging in. You can now see the insights of your onboarded machine on the right. You can also:\n\n• **Invite Users**: Share this dashboard\n• **Get Recent Tickets**: See what's happening\n• **Create Ticket**: Report an issue\n• **Assign Tickets**: e.g., \"Assign T-123 to Alice\"\n• **Compare Sensors**: Analyze data\n\nWhat would you like to do?");
           setIsProcessing(false);
           return;
        }

        // Check if user wants to restart/start new onboarding
        if (userInput.match(/restart|start.*new|onboard.*another|add.*another|fresh.*start/i)) {
            addUserMessage(input);
            await new Promise(resolve => setTimeout(resolve, 500));
            addAssistantMessage(
              'Ready to onboard a new machine?',
              { 
                type: 'restart-onboarding-widget', 
                data: { 
                  message: 'Click the button below to start fresh with a new demo or live machine. Your current dashboard will remain accessible.' 
                } 
              }
            );
            setIsProcessing(false);
            return;
        }

        // Check if user wants to onboard/add machine (Only if NOT in post-login mode?)
        // Actually, user might want to add ANOTHER machine.
        if (userInput.includes('onboard') || userInput.includes('add machine') || userInput.includes('add device')) {
            // Start the logged-in onboarding flow
            // If we are in post-login mode, we might want to reset to allow this flow
            // But for now, let's allow it.
            setIsActive(true);
            setIsPostLogin(false); // Re-enable flow manager for this task
            flowManager.jumpToStep('user-question-logged-in');
            
            // Auto-advance through the initial step
            await new Promise(resolve => setTimeout(resolve, 800));
            const firstStep = flowManager.getCurrentStep();
            if (firstStep) {
              addMessageFromCurrentStep();
              const nextStep = flowManager.advanceToNextStep();
              if (nextStep) {
                await new Promise(resolve => setTimeout(resolve, 500));
                addMessageFromCurrentStep();
              }
            }
            setIsProcessing(false);
            return;
        }
      }

      // If we are in Post-Login Mode (Regex Mode), STOP here. Do not fall through to FlowManager steps.
      if (isPostLogin) {
        // If we reached here, it means no regex matched.
        if (typeof input === 'string' && input && input.trim()) {
          addUserMessage(input);
          // Generic response
          await new Promise(resolve => setTimeout(resolve, 800));
          addAssistantMessage("I didn't catch that. You can ask me to invite users, show tickets, compare sensors, or create a ticket.");
        }
        setIsProcessing(false);
        return;
      }
      
      // === LEGACY FLOW MANAGER LOGIC ===
      
      // If input is empty and we're in post-login mode, ensure we don't fall through
      // (Extra safety check in case isPostLogin state update is pending but we shouldn't advance)
      if (!input && isPostLogin) {
        setIsProcessing(false);
        return;
      }
      
      // If no active flow, check if user wants to start onboarding (Fallback)
      if (!currentStep) {
        // ... existing fallback logic ...
        if (typeof input === 'string' && input && input.trim()) {
             addUserMessage(input);
             const responseMessage: ChatMessage = {
                id: `msg-${messageIdCounter.current++}`,
                actor: 'assistant',
                message: 'I received your message. Try asking me to "add a machine" to get started with device onboarding!',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, responseMessage]);
        }
        setIsProcessing(false);
        return;
      }

      console.log('📥 Handling input:', { input, currentStep: currentStep.id });

      // For widget submissions, only update context and don't add a user message
      const isWidgetSubmission = typeof input === 'object' && input && !input.userMessage;
      
      // Update context if input contains data
      if (typeof input === 'object' && input) {
        // Check if there's a userMessage to display
        if (input.userMessage) {
          addUserMessage(input.userMessage);
        }
        flowManager.updateContext(input);
      }

      // Add user message if it's a text input (not a widget submission)
      if (typeof input === 'string' && input && input.trim()) {
        addUserMessage(input);
      }

      // Execute action if present on current step AND we just submitted for this step
      if (currentStep.action && currentStep.waitForUserInput) {
        const success = await executeAction(currentStep.action, input);
        if (!success) {
          console.error('Action failed:', currentStep.action);
          setIsProcessing(false);
          return;
        }
      }

      // Advance to next step and show messages
      let continueAdvancing = true;
      let stepsProcessed = 0;
      const maxSteps = 10; // Safety limit to prevent infinite loops
      
      while (continueAdvancing && stepsProcessed < maxSteps) {
        const nextStep = flowManager.advanceToNextStep();
        if (!nextStep) {
          console.log('✅ No more steps');
          continueAdvancing = false;
          break;
        }

        stepsProcessed++;
        console.log(`📍 Advanced to step ${stepsProcessed}: ${nextStep.id}`);

        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Execute action for next step if it doesn't wait for user input
        if (nextStep.action && !nextStep.waitForUserInput) {
          console.log(`⚡ Executing action: ${nextStep.action}`);
          const success = await executeAction(nextStep.action, input);
          if (!success) {
            console.error('Next step action failed:', nextStep.action);
            setIsProcessing(false);
            return;
          }
        }

        // Add message for this step
        addMessageFromCurrentStep();

        // Stop if next step waits for user input (has a widget or requires response)
        if (nextStep.waitForUserInput) {
          console.log('⏸️  Waiting for user input at:', nextStep.id);
          continueAdvancing = false;
        }
      }
      
      if (stepsProcessed >= maxSteps) {
        console.warn('⚠️  Reached max steps limit, stopping to prevent infinite loop');
      }
    } catch (error) {
      console.error('Error handling user input:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [flowManager, addUserMessage, addMessageFromCurrentStep, executeAction, isPostLogin]);

  const startPostLoginFlow = useCallback(async () => {
    // Disabled: Post-login flow is now handled by regex mode
  }, []);

  // Start post-login flow if needed
  useEffect(() => {
    if (needsPostLoginFlowRef.current) {
      needsPostLoginFlowRef.current = false;
      setTimeout(() => {
        const ctx = flowManager.getContext();
        
        // Send the welcome message (metrics explanation stays here)
        const welcomeMessage: ChatMessage = {
          id: `msg-${messageIdCounter.current++}`,
          actor: 'assistant',
          message: 'Welcome to your Device Dashboard!\n\nOn the right, you\'re seeing the live view of your machine, where you can:\n• Monitor its Health Score\n• Track planned vs predicted days to maintenance\n• Watch real-time telemetry data\n• Receive alerts and notifications\n• View and manage maintenance tickets\n\nThis dashboard updates automatically as new data comes in. Feel free to explore it — click on any chart, alert, or ticket to dive deeper.',
          widget: {
            type: 'info-popup-button',
            data: {
              infoType: 'health-metrics',
              title: 'Dashboard Metrics Explained',
              buttonText: 'View Metrics Explanation',
              content: {
                healthScore: 94,
                dutyRate: '78%',
                plannedDays: 30,
                predictedDays: 6,
              },
            },
          },
          timestamp: new Date(),
        };

        setMessages((prev) => {
          // NOTE: reference buttons are injected into the ORIGINAL onboarding messages (machine details / MQTT / channel config)
          // so they appear under the correct part of the chat history, not as a block at the bottom.
          return [...prev, welcomeMessage];
        });
        
        // Check if user consented to SMS during onboarding
        const smsConsent = localStorage.getItem('sms_consent');
        let consentData = null;
        try {
          consentData = smsConsent ? JSON.parse(smsConsent) : null;
        } catch {}
        
        // Save SMS consent status to context
        if (consentData?.consent) {
          flowManager.updateContext({
            smsNotificationsEnabled: true,
            phoneNumber: consentData.phoneNumber,
          });
        }
        
        // Add workflow message
        setTimeout(() => {
          const workflowMessage: ChatMessage = {
            id: `msg-${messageIdCounter.current++}`,
            actor: 'assistant',
            message: 'Before we continue, would you like to move on and see how the agentic workflow is already working behind the scenes for this machine?',
            timestamp: new Date(),
          };
          postLoginStageRef.current = 'workflow-question';
          setMessages((prev) => [...prev, workflowMessage]);
        }, 1500);
        
        setIsActive(true);
      }, 1000);
    }
  }, []);

  const addMessage = useCallback((actor: 'user' | 'assistant', message: string, widget?: any) => {
    const newMessage: ChatMessage = {
      id: `msg-${messageIdCounter.current++}`,
      actor,
      message,
      widget,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setIsActive(true);
  }, []);

  return {
    messages,
    isProcessing,
    isActive,
    currentStep: flowManager.getCurrentStep(),
    handleUserInput,
    getCurrentWidget: () => flowManager.getCurrentStep()?.widget,
    getContext: () => flowManager.getContext(),
    addMessage,
  };
}
