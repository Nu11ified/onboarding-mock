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
        
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            email,
            sessionId: context.sessionId
          })
        });
        const data = await response.json();
        // stash email for reset page login
        try { localStorage.setItem('pending_reset_email', JSON.stringify(email)); } catch {}

        // If account exists and is verified, redirect to login
        if (data.accountExists && data.shouldLogin && !data.isPremature) {
          console.log('Account already exists and is verified. Redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 1500);
          return false;
        }

        // If premature account or new account, OTP is sent
        if (data.success || data.isPremature) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔑 YOUR OTP CODE: ' + data.otp);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          return true;
        }
        return false;
      }

      case 'validate-otp': {
        const otp = context.otp;
        
        if (!otp) {
          console.error('❌ No OTP in context:', context);
          return false;
        }
        
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'validate-otp',
            email: context.email,
            otp
          })
        });
        const data = await response.json();

        if (data.success) {
          // Create profile and get profile key right after OTP validation
          const profileResponse = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create-profile',
              email: context.email,
              profileConfig: {
                profileName: 'Default Profile',
                trainingSeconds: 200,
                daysToMaintenance: 30,
                cycleDuration: 20,
              }
            })
          });
          const profileData = await profileResponse.json();
          
          if (profileData.success) {
            flowManager.updateContext({
              profileKey: profileData.profileKey
            });
            return true;
          } else {
            console.error('Profile creation failed:', profileData);
            return false;
          }
        } else {
          console.error('OTP validation failed:', data);
        }
        return false;
      }
      
      case 'send-password-reset': {
        try {
          const email = context.email;
          if (!email) {
            console.error('❌ No email in context for password reset');
            return false;
          }
          // Send reset email (simulated)
          const sendRes = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send-password-reset', email })
          });
          const sendData = await sendRes.json();
          if (!sendData?.success || !sendData?.resetUrl) {
            console.error('❌ Failed to send reset email:', sendData);
            return false;
          }
          // Redirect user to the real reset page to complete password setup
          window.location.href = sendData.resetUrl;
          return true;
        } catch (e) {
          console.error('Password reset flow failed:', e);
          return false;
        }
      }

      case 'spawn-demo-device': {
        const response = await fetch('/api/device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'spawn',
            profileKey: context.profileKey,
            mode: 'demo',
            sessionId: context.sessionId,
            sessionExpiry: Date.now() + (24 * 60 * 60 * 1000),
            config: {
              profileName: 'Demo Machine',
              trainingSeconds: 200,
              daysToMaintenance: 30,
              cycleDuration: 20,
            }
          })
        });
        const data = await response.json();

        if (data.success) {
          flowManager.updateContext({
            deviceId: data.deviceId,
            mode: 'demo'
          });
          // Persist onboarding state early so dashboard handoff has deviceId
          try {
            localStorage.setItem('onboarding_state', JSON.stringify({
              email: context.email,
              deviceId: data.deviceId,
              profileKey: context.profileKey,
              mode: 'demo',
              sessionId: context.sessionId,
              chatId: context.chatId,
              shouldContinue: false,
            }));
          } catch {}
          return true;
        }
        return false;
      }

      case 'spawn-live-device': {
        const config = payload?.config || context.profileConfig;
        
        console.log('🚀 Spawning live device with config:', config);
        console.log('📦 Context profileKey:', context.profileKey);
        console.log('🔑 Context sessionId:', context.sessionId);
        
        if (!context.profileKey) {
          console.error('❌ No profileKey in context for live device spawn');
          return false;
        }
        
        if (!config) {
          console.error('❌ No config provided for live device spawn');
          return false;
        }
        
        const response = await fetch('/api/device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'spawn',
            profileKey: context.profileKey,
            mode: 'live',
            sessionId: context.sessionId,
            sessionExpiry: Date.now() + (24 * 60 * 60 * 1000),
            config
          })
        });
        const data = await response.json();
        
        console.log('📡 Device spawn API response:', data);

        if (data.success) {
          flowManager.updateContext({
            deviceId: data.deviceId,
            mode: 'live',
            mqttConnection: {
              brokerEndpoint: data.brokerEndpoint,
              brokerPort: data.brokerPort,
              topic: data.topic,
              username: data.username,
              password: data.password,
              sampleSchema: data.sampleSchema,
            }
          });
          // Persist onboarding state early so dashboard handoff has deviceId
          try {
            localStorage.setItem('onboarding_state', JSON.stringify({
              email: context.email,
              deviceId: data.deviceId,
              profileKey: context.profileKey,
              mode: 'live',
              sessionId: context.sessionId,
              chatId: context.chatId,
              shouldContinue: false,
            }));
          } catch {}
          return true;
        } else {
          console.error('❌ Device spawn failed:', data);
        }
        return false;
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

      // Update context FIRST if input contains data (before executing action)
      if (typeof input === 'object' && input) {
        // Check if there's a userMessage to display
        if (input.userMessage) {
          addUserMessage(input.userMessage);
        }
        flowManager.updateContext(input);
      }

      // Add user message if it's a text input
      if (typeof input === 'string' && input) {
        addUserMessage(input);
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
        const nextStep = flowManager.advanceToNextStep();
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
