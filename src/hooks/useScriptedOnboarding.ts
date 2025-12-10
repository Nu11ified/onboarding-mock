import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FlowManager, type FlowStep, type FlowContext, type FlowStepAction } from '@/lib/onboarding/flows';
import { getOrCreateAnonymousSession, clearAnonymousSession } from '@/lib/onboarding/utils';
import type { ProfileConfig, OnboardingMode } from '@/lib/onboarding/types';

interface ChatMessage {
  id: string;
  actor: 'user' | 'assistant';
  message: string;
  widget?: any; // Widget type definition from the step
  timestamp: Date;
}

export function useScriptedOnboarding(flowType: 'non-login' | 'logged-in' = 'non-login') {
  const router = useRouter();
  const [flowManager] = useState(() => new FlowManager(flowType));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messageIdCounter = useRef(0);
  const initializedRef = useRef(false);
  
  // Save messages whenever they change (for continuity)
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('onboarding_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Initialize flow on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Clear any previous training completion state
    localStorage.removeItem('training_complete');
    
    // Check if continuing from non-login flow
    const urlParams = new URLSearchParams(window.location.search);
    const continueOnboarding = urlParams.get('continue-onboarding') === 'true';
    
    if (continueOnboarding && flowType === 'non-login') {
      // Restore context from pending session and trigger post-login flow
      const pendingSession = localStorage.getItem('pending_session');
      if (pendingSession) {
        try {
          const sessionData = JSON.parse(pendingSession);
          flowManager.updateContext(sessionData);
          // Jump to post-login flow (session transfer step)
          flowManager.jumpToStep('session-transfer');
          setTimeout(() => {
            startFlow();
          }, 300);
        } catch (error) {
          console.error('Failed to restore session:', error);
        }
      }
      return;
    }
    
    // Start flow after a brief delay
    setTimeout(() => {
      startFlow();
    }, 300);
  }, []);

  // Start the flow by showing first message and auto-advancing
  const startFlow = useCallback(async () => {
    if (flowType === 'non-login') {
      // Initialize session
      const session = getOrCreateAnonymousSession();
      flowManager.updateContext({
        sessionId: session.sessionId,
        chatId: session.chatId,
      });

      // Create server-side session
      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create' })
        });
        const data = await response.json();
        if (data.success) {
          flowManager.updateContext({
            sessionId: data.session.sessionId,
            chatId: data.session.chatId,
          });
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }

    // Show first message and auto-advance
    const currentStep = flowManager.getCurrentStep();
    if (currentStep) {
      addMessageFromCurrentStep();
      
      // Auto-advance if no user input needed
      if (!currentStep.waitForUserInput) {
        setTimeout(() => {
          handleUserInput('');
        }, 800);
      }
    }
  }, [flowManager, flowType]);

  // Add message from current step (handles both user and assistant)
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
  
  // Keep this for backwards compatibility
  const addAssistantMessage = addMessageFromCurrentStep;

  // Add user message
  const addUserMessage = useCallback((text: string) => {
    const message: ChatMessage = {
      id: `msg-${messageIdCounter.current++}`,
      actor: 'user',
      message: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
  }, []);

  // Execute action for current step
  const executeAction = useCallback(async (action: FlowStepAction, payload?: any) => {
    const context = flowManager.getContext();

    switch (action) {
      case 'register-email': {
        const email = context.email;
        if (!email) {
          console.error('No email in context');
          return false;
        }
        
        console.log('✅ Registering email (mock - allowing repeats):', email);
        // Mock: Always succeed, no redirect
        return true;
      }

      case 'register-user-info': {
        const { email, firstName, lastName, phoneNumber } = context;
        if (!email) {
          console.error('No email in context');
          return false;
        }
        
        console.log('✅ Registering user info (mock):', { email, firstName, lastName, phoneNumber });
        // Store user info in localStorage for later account creation
        localStorage.setItem('pending_user_info', JSON.stringify({
          email,
          firstName,
          lastName,
          phoneNumber,
        }));
        return true;
      }

      case 'validate-otp': {
        console.log('✅ Validating OTP (mock pass):', context.otp);
        // Simulate profile creation which happens here
        const mockProfileKey = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        flowManager.updateContext({
          profileKey: mockProfileKey
        });
        return true;
      }
      
      case 'send-password-reset': {
        // Just store the email - user will click button to navigate to reset page
        const email = context.email;
        if (email) {
          localStorage.setItem('pending_reset_email', email);
        }
        return true;
      }

      case 'spawn-demo-device': {
        console.log('🚀 Spawning demo device (mock)');
        const mockDeviceId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        flowManager.updateContext({
          deviceId: mockDeviceId,
          mode: 'demo'
        });
        
        // Persist for dashboard handoff
        try {
          localStorage.setItem('onboarding_state', JSON.stringify({
            email: context.email,
            deviceId: mockDeviceId,
            profileKey: context.profileKey,
            mode: 'demo',
            sessionId: context.sessionId,
            chatId: context.chatId,
            shouldContinue: false,
          }));
        } catch {}
        return true;
      }

      case 'validate-schema': {
        console.log('✅ Validating schema (mock pass)');
        return true;
      }

      case 'spawn-live-device': {
        const config = payload?.config || context.profileConfig;
        console.log('🚀 Spawning live device (mock)', config);
        
        const mockDeviceId = `live_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        flowManager.updateContext({
          deviceId: mockDeviceId,
          mode: 'live',
          // Mock MQTT connection details if needed for anything else
          mqttConnection: {
            brokerEndpoint: 'mock.mqtt.com',
            brokerPort: 8883,
            topic: `device/${mockDeviceId}/telemetry`,
            username: 'mock_user',
            password: 'mock_password',
            sampleSchema: {}
          }
        });
        
        try {
          localStorage.setItem('onboarding_state', JSON.stringify({
            email: context.email,
            deviceId: mockDeviceId,
            profileKey: context.profileKey,
            mode: 'live',
            sessionId: context.sessionId,
            chatId: context.chatId,
            shouldContinue: false,
          }));
        } catch {}
        return true;
      }

      case 'transfer-session': {
        // TODO: Get authenticated user ID
        const authenticatedUserId = 'user_authenticated_123';
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'transfer',
            anonSessionId: context.sessionId,
            anonUserId: context.sessionId, // Using sessionId as userId for now
            authenticatedUserId,
            chatId: context.chatId
          })
        });
        const data = await response.json();

        if (data.success) {
          flowManager.updateContext({
            sessionId: data.newSessionId,
            chatId: data.chatId
          });
          clearAnonymousSession();
          return true;
        }
        return false;
      }

      case 'add-users': {
        const users = payload?.users ?? context.invitedUsers;
        if (!users || users.length === 0) {
          console.error('❌ No users provided for add-users');
          return false;
        }
        // TODO: Implement user invitation API
        flowManager.updateContext({ invitedUsers: users });
        return true;
      }

      case 'subscribe-notifications': {
        // TODO: Implement notification subscription API
        flowManager.updateContext({ notificationsEnabled: true });
        return true;
      }

      case 'create-test-ticket': {
        // TODO: Implement ticket creation API
        const ticketId = `T-${Date.now()}`;
        flowManager.updateContext({ testTicketId: ticketId });
        return true;
      }

      case 'auto-login': {
        // Attempt auto-login; proceed to dashboard even if the mock API fails
        try {
          const loginResponse = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'login',
              email: context.email,
              password: context.password
            })
          });
          const loginData = await loginResponse.json();
          if (loginData?.success) {
            localStorage.setItem('user_session', JSON.stringify({
              email: context.email,
              userId: loginData.userId,
              profileKey: context.profileKey,
              deviceId: context.deviceId,
              mode: context.mode,
            }));
          }
        } catch (e) {
          console.warn('Auto-login API failed, continuing to dashboard:', e);
        }

        // Save continuation state regardless to ensure post-login flow proceeds
        localStorage.setItem('onboarding_state', JSON.stringify({
          email: context.email,
          deviceId: context.deviceId,
          profileKey: context.profileKey,
          mode: context.mode,
          flowType: 'non-login',
          currentStepId: flowManager.getCurrentStep()?.id,
          completedAt: new Date().toISOString(),
          shouldContinue: true,
        }));
        localStorage.setItem('onboarding_complete', JSON.stringify({
          email: context.email,
          deviceId: context.deviceId,
          profileKey: context.profileKey,
          mode: context.mode,
          completedAt: new Date().toISOString(),
        }));

        // Redirect to demo dashboard with onboarded flag
        setTimeout(() => {
          router.push('/demo/dashboard?onboarded=true&showDashboard=true');
        }, 1200);
        return true;
      }
      
      case 'show-profile-selection': {
        // Fetch existing profiles - this is handled by ProfileSelectionWidget
        // No action needed here, just return true
        return true;
      }
      
      case 'create-new-profile': {
        // Create new profile with payment information
        const config = payload?.profileConfig || context.profileConfig;
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-profile',
            email: context.email,
            profileConfig: config,
          })
        });
        const data = await response.json();
        
        if (data.success) {
          flowManager.updateContext({
            profileKey: data.profileKey,
          });
          return true;
        }
        return false;
      }
      
      case 'show-payment-widget': {
        // Payment widget is displayed, actual processing happens on submit
        // No action needed here
        return true;
      }
      
      case 'show-dashboard': {
        // Signal that dashboard should be displayed
        // This will be handled by the UI layer
        console.log('Dashboard should be displayed now');
        return true;
      }
      
      case 'show-connection-details': {
        // Connection details are already in context from spawn-live-device
        // Just ensure they're present
        return true;
      }

      case 'create-account': {
        // Create user account with the info collected earlier
        const { email, firstName, lastName, phoneNumber, deviceId, profileKey, mode } = context;
        console.log('✅ Creating account (mock):', { email, firstName, lastName });
        
        // Store account creation state
        localStorage.setItem('pending_reset_email', email || '');
        localStorage.setItem('onboarding_state', JSON.stringify({
          email,
          firstName,
          lastName,
          phoneNumber,
          deviceId,
          profileKey,
          mode,
          accountCreated: true,
          completedAt: new Date().toISOString(),
        }));
        return true;
      }

      case 'skip-account': {
        // User skipped account creation, just save session
        const { email, deviceId, profileKey, mode } = context;
        console.log('⏭️ Skipping account creation, saving session');
        
        localStorage.setItem('onboarding_state', JSON.stringify({
          email,
          deviceId,
          profileKey,
          mode,
          accountCreated: false,
          sessionSaved: true,
          completedAt: new Date().toISOString(),
        }));
        return true;
      }

      default:
        return true;
    }
  }, [flowManager, router]);

  // Handle user input and advance flow
  const handleUserInput = useCallback(async (input: string | any) => {
    setIsProcessing(true);

    try {
      const currentStep = flowManager.getCurrentStep();
      if (!currentStep) return;

      // Normalize possible text input (chat sends objects with { userMessage })
      const textInput: string = typeof input === 'string'
        ? input
        : (input && typeof input === 'object' && 'userMessage' in input ? String((input as any).userMessage || '') : '');

      // Check if user wants to switch to demo mode
      if (textInput && textInput.toLowerCase().includes('switch to demo')) {
        addUserMessage(textInput);
        flowManager.updateContext({ mode: 'demo' });
        
        // Jump to demo flow start
        flowManager.jumpToStep('demo-device-init');
        
        // Trigger processing of the new step
        setTimeout(() => {
          handleUserInput('');
        }, 500);
        
        setIsProcessing(false);
        return;
      }

      // Special input routing and explicit jumps
      let handledSpecialInput = false;
      let jumpToStepId: string | null = null;
      let forceAction: FlowStepAction | null = null;

      // MQTT done -> schema + agent validation widgets chain
      if (textInput && currentStep?.id === 'live-mqtt-prompt') {
        const lower = textInput.toLowerCase().trim();
        if (lower === 'done' || lower === 'ready' || lower.includes('done')) {
          addUserMessage(textInput);
          const step = flowManager.jumpToStep('live-mqtt-schema-status');
          if (step) {
            addMessageFromCurrentStep();
            setIsProcessing(false);
            return;
          }
        }
      }

      // Channel configure/skip
      if (textInput && currentStep?.id === 'live-data-received') {
        const lowerInput = textInput.toLowerCase().trim();
        if (lowerInput === 'configure' || lowerInput.includes('configure')) {
          console.log('🔧 User wants to configure channels');
          addUserMessage(textInput);
          flowManager.updateContext({ configureChannels: true });
          jumpToStepId = 'live-channel-config';
          handledSpecialInput = true;
        } else if (lowerInput === 'skip' || lowerInput.includes('skip') || lowerInput.includes('default')) {
          console.log('⏭️ User wants to skip channel config');
          addUserMessage(textInput);
          flowManager.updateContext({ configureChannels: false });
          jumpToStepId = 'live-device-init';
          handledSpecialInput = true;
        }
      }

      // Account creation yes/no
      if (textInput && (currentStep?.id === 'demo-complete-message' || currentStep?.id === 'live-complete-message')) {
        const lowerInput = textInput.toLowerCase().trim();
        if (lowerInput === 'yes' || lowerInput.includes('yes') || lowerInput.includes('create')) {
          console.log('✅ User wants to create account');
          addUserMessage(textInput);
          flowManager.updateContext({ createAccount: true });
          jumpToStepId = 'account-created';
          forceAction = 'create-account'; // ensure we run creation even though step waits for input
          handledSpecialInput = true;
        } else if (lowerInput === 'no' || lowerInput.includes('no') || lowerInput.includes('later')) {
          console.log('⏭️ User will come back later');
          addUserMessage(textInput);
          flowManager.updateContext({ createAccount: false });
          jumpToStepId = 'session-saved';
          handledSpecialInput = true;
        }
      }

      // Update context FIRST if input contains data (before executing action)
      if (typeof input === 'object' && input) {
        // Separate userMessage from real context fields
        const { userMessage, ...rest } = input as any;
        if (Object.keys(rest).length > 0) {
          flowManager.updateContext(rest);
        }
      }

      // Add user message if it's a text input (unless already handled)
      if (textInput && !handledSpecialInput) {
        addUserMessage(textInput);
      }

      // If we need to jump to a specific step, do it now and process actions/messages appropriately
      if (jumpToStepId) {
        const step = flowManager.jumpToStep(jumpToStepId);
        if (!step) {
          console.error('Failed to jump to step:', jumpToStepId);
          setIsProcessing(false);
          return;
        }

        // Run forced action (e.g., account creation) even if the step waits for input
        if (forceAction) {
          const ok = await executeAction(forceAction);
          if (!ok) {
            console.error('Forced action failed:', forceAction);
            setIsProcessing(false);
            return;
          }
        } else if (step.action && !step.waitForUserInput) {
          // Otherwise run step action if appropriate
          const ok = await executeAction(step.action);
          if (!ok) {
            console.error('Step action failed:', step.action);
            setIsProcessing(false);
            return;
          }
        }

        // Show the message for the new current step
        addMessageFromCurrentStep();

        // If the step waits for user input, stop here
        if (step.waitForUserInput) {
          setIsProcessing(false);
          return;
        }

        // Otherwise continue advancing until a wait step
        let continueAdvancing = true;
        while (continueAdvancing) {
          const nextStep = flowManager.advanceToNextStep();
          if (!nextStep) break;
          await new Promise(resolve => setTimeout(resolve, 300));
          if (nextStep.action && !nextStep.waitForUserInput) {
            const ok = await executeAction(nextStep.action);
            if (!ok) break;
          }
          addMessageFromCurrentStep();
          if (nextStep.waitForUserInput) continueAdvancing = false;
        }
        setIsProcessing(false);
        return;
      }

      // If current step is waiting for user input and the user typed free-text that wasn't handled, do NOT advance
      if (currentStep.waitForUserInput && textInput && !handledSpecialInput) {
        setIsProcessing(false);
        return;
      }

      // Execute action if present on current step (only if it doesn't wait for user input)
      if (currentStep.action && !currentStep.waitForUserInput) {
        const success = await executeAction(currentStep.action, input);
        if (!success) {
          console.error('Action failed:', currentStep.action);
          setIsProcessing(false);
          return;
        }
      }

      // Keep advancing through steps that don't wait for user input
      let continueAdvancing = true;
      while (continueAdvancing) {
        console.log('📍 About to advance from:', currentStep?.id, 'Context:', flowManager.getContext());
        const nextStep = flowManager.advanceToNextStep();
        console.log('➡️ Advanced to:', nextStep?.id);
        if (!nextStep) {
          continueAdvancing = false;
          break;
        }

        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Execute action for next step if it doesn't wait for user input
        if (nextStep.action && !nextStep.waitForUserInput) {
          const success = await executeAction(nextStep.action);
          if (!success) {
            console.error('Next step action failed:', nextStep.action);
            setIsProcessing(false);
            return;
          }
        }
        
        addMessageFromCurrentStep();
        
        // Stop if next step waits for user input
        if (nextStep.waitForUserInput) {
          continueAdvancing = false;
        }
      }
    } catch (error) {
      console.error('Error handling user input:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [flowManager, addUserMessage, addMessageFromCurrentStep, executeAction]);

  // Get current widget component
  const getCurrentWidget = useCallback(() => {
    const currentStep = flowManager.getCurrentStep();
    return currentStep?.widget || null;
  }, [flowManager]);

  // Get context
  const getContext = useCallback(() => {
    return flowManager.getContext();
  }, [flowManager]);

  return {
    messages,
    isProcessing,
    handleUserInput,
    getCurrentWidget,
    getContext,
    currentStep: flowManager.getCurrentStep(),
  };
}
