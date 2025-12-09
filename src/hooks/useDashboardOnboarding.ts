import { useState, useCallback, useEffect, useRef } from 'react';
import { FlowManager, type FlowStep, type FlowContext, type FlowStepAction, POST_LOGIN_FLOW } from '@/lib/onboarding/flows';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActive, setIsActive] = useState(false); // Start inactive, activated by user query
  const messageIdCounter = useRef(0);
  const initializedRef = useRef(false);
  const needsPostLoginFlowRef = useRef(false);

  const [isPostLogin, setIsPostLogin] = useState(false);

  // Initialize flow from saved state (runs once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const onboardingState = localStorage.getItem('onboarding_state');
    const savedMessages = localStorage.getItem('onboarding_chat_messages');

    // Fallback: if we have messages saved, ensure chat is active even if flag missing
    if (savedMessages && !onboardingState) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setIsActive(true);
          setMessages(parsedMessages);
          messageIdCounter.current = parsedMessages.length;
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
            try { initialMsgs = JSON.parse(savedMessages) as ChatMessage[]; } catch {}
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

    const message: ChatMessage = {
      id: `msg-${messageIdCounter.current++}`,
      actor: currentStep.actor,
      message: renderedMessage,
      widget: currentStep.actor === 'assistant' ? (currentStep.widget || widget) : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
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
        try {
          const res = await fetch('/api/v2/tickets/generate-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ severity: 'Warning' }),
          });
          const data = await res.json();
          const ticketId = data?.ticketId || `T-${Date.now()}`;
          console.log('✅ Created test ticket via API:', ticketId);
          flowManager.updateContext({ testTicketId: ticketId });
        } catch (e) {
          const fallbackId = `T-${Date.now()}`;
          console.warn('Test ticket API failed, using fallback:', fallbackId);
          flowManager.updateContext({ testTicketId: fallbackId });
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
      
      // === REGEX-BASED INTENT PARSING (High Priority) ===
      if (typeof input === 'string' && input && input.trim()) {
        const text = input.trim();
        const userInput = text.toLowerCase();

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

        // 4. Creating a Ticket
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

        // 6. Showing different dashboards / Switching graphs
        const switchMatch = userInput.match(/switch|change graph|show\s+(.+)/i);
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
        // Send the welcome message
        const welcomeMessage: ChatMessage = {
          id: `msg-${messageIdCounter.current++}`,
          actor: 'assistant',
          message: 'Thank you for logging in. You can now see the insights of your onboarded machine on the right. You can also do:\n\n• **Invite users**\n• **Get recent tickets**\n• **Create a ticket**\n• **Assign users to tickets**\n• **Compare sensor values**\n• **Show different dashboards**',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, welcomeMessage]);
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
