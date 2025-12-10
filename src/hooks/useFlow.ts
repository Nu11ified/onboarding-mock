import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { StateMachine, localStoragePersist } from '@/lib/flow/machine';
import type { FlowEvent } from '@/lib/flow/types';
import { ONBOARDING_FLOW } from '@/lib/flow/definitions/onboarding';
import { actions } from '@/lib/flow/actions';

export type ChatMessage = {
  id: string;
  actor: 'user' | 'assistant';
  message: string;
  widget?: any;
  timestamp: Date;
};

export function useFlow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messageId = useRef(0);
  const initializedRef = useRef(false);

  const persist = useMemo(() => typeof window !== 'undefined' ? localStoragePersist('onboarding_machine') : undefined, []);
  const machine = useMemo(() => new StateMachine(ONBOARDING_FLOW, actions, {}, persist), [persist]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem('onboarding_chat_messages', JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // Restore messages from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('onboarding_chat_messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            messageId.current = parsed.length;
            initializedRef.current = true; // Skip initial message since we restored
          }
        }
      } catch {}
    }
  }, []);

  const addAssistant = useCallback((text?: string, widget?: any) => {
    if (!text && !widget) return;
    setMessages(prev => prev.concat({ id: `m${messageId.current++}`, actor: 'assistant', message: text || '', widget, timestamp: new Date() }));
  }, []);

  const addUser = useCallback((text: string) => {
    setMessages(prev => prev.concat({ id: `m${messageId.current++}`, actor: 'user', message: text, timestamp: new Date() }));
  }, []);

  // Show initial message only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const s = machine.state;
    const rendered = typeof s.message === 'function' ? s.message(machine.context) : s.message;
    addAssistant(rendered, s.widget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(async (event: FlowEvent) => {
    setIsProcessing(true);
    try {
      const beforeId = machine.state?.id as string;
      await machine.send(event);
      const s = machine.state;
      const rendered = typeof s.message === 'function' ? s.message(machine.context) : s.message;
      const afterId = s?.id as string;

      // Only add a message if the state actually changed
      if (beforeId === afterId) {
        // State didn't change (action-only transition), don't add duplicate message
        return;
      }

      // Add a delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 600));

      // Append the new message
      setMessages(prev => {
        const next = { id: `m${messageId.current++}`, actor: 'assistant' as const, message: rendered || '', widget: s.widget, timestamp: new Date() };
        return prev.concat(next);
      });
    } finally {
      setIsProcessing(false);
    }
  }, [machine]);

  // Convenience helpers to map UI interactions to events
  const api = {
    submitUserInfo: (data: any) => send({ type: 'SUBMIT', data }),
    verifyOtp: (data: any) => send({ type: 'VERIFY', data }),
    selectDemo: () => send({ type: 'SELECT_DEMO' }),
    selectLive: () => send({ type: 'SELECT_LIVE' }),
    startDemoSpawn: () => send({ type: 'START' }),
    completeDemoSpawn: () => send({ type: 'COMPLETE' }),
    machineDetailsSubmit: (data: any) => send({ type: 'SUBMIT', data }),
    mqttReady: () => send({ type: 'DONE' }),
    nextFromSchema: () => send({ type: 'NEXT' }),
    nextFromAgent: () => send({ type: 'NEXT' }),
    configureChannels: () => send({ type: 'CONFIGURE' }),
    skipChannels: () => send({ type: 'SKIP' }),
    channelConfigSubmit: (data: any) => send({ type: 'SUBMIT', data }),
    startLiveSpawn: (config?: any) => send({ type: 'START', data: { config } }),
    completeLiveSpawn: () => send({ type: 'COMPLETE' }),
    sayYesCreate: () => send({ type: 'YES' }),
    sayNoSkip: () => send({ type: 'NO' }),
  } as const;

  const reset = useCallback(() => {
    persist?.clear();
    machine.reset({});
    setMessages([]);
    messageId.current = 0;
    // Clear saved chat messages from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('onboarding_chat_messages');
        localStorage.removeItem('onboarding_state');
      } catch {}
    }
    // Show initial message after reset
    const s = machine.state;
    const rendered = typeof s.message === 'function' ? s.message(machine.context) : s.message;
    setMessages([{ id: `m${messageId.current++}`, actor: 'assistant', message: rendered || '', widget: s.widget, timestamp: new Date() }]);
  }, [machine, persist]);

  return {
    messages,
    isProcessing,
    machine,
    send,
    api,
    addUserMessage: addUser,
    reset,
  };
}
