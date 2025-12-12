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
            const hasWidgetType = (w: any, t: string): boolean => {
              if (!w) return false;
              if (w?.type === t) return true;
              if (w?.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
                return w.data.widgets.some((child: any) => hasWidgetType(child, t));
              }
              return false;
            };

            const hasInfoButton = (w: any, infoType: string): boolean => {
              if (!w) return false;
              if (w?.type === 'right-panel-button') {
                const payload = w?.data && typeof w.data === 'object' ? w.data : w;
                return payload?.panelType === infoType;
              }
              if (w?.type === 'info-popup-button') {
                const payload =
                  w?.data && typeof w.data === 'object' && (w.data.infoType || w.data.buttonText)
                    ? w.data
                    : w;
                return payload?.infoType === infoType;
              }
              if (w?.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
                return w.data.widgets.some((child: any) => hasInfoButton(child, infoType));
              }
              return false;
            };

            const migrateInfoButtonsToRightPanel = (w: any): any => {
              if (!w) return w;
              if (w?.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
                return {
                  ...w,
                  data: {
                    ...w.data,
                    widgets: w.data.widgets.map((child: any) => migrateInfoButtonsToRightPanel(child)),
                  },
                };
              }

              if (w?.type === 'info-popup-button') {
                const payload =
                  w?.data && typeof w.data === 'object' && (w.data.infoType || w.data.buttonText)
                    ? w.data
                    : w;
                const infoType = payload?.infoType;
                const supported =
                  infoType === 'machine-config-help' ||
                  infoType === 'channel-config-help' ||
                  infoType === 'mqtt-setup' ||
                  infoType === 'health-metrics';
                if (supported) {
                  return {
                    type: 'right-panel-button',
                    data: {
                      panelType: infoType,
                      title: payload?.title,
                      buttonText: payload?.buttonText,
                      content: payload?.content,
                    },
                  };
                }
              }

              return w;
            };

            const removeBrokenInfoButtons = (w: any) => {
              if (!w) return w;
              if (w?.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
                const filtered = w.data.widgets.filter((child: any) => {
                  if (child?.type !== 'info-popup-button' && child?.type !== 'right-panel-button') return true;
                  const payload =
                    child?.data && typeof child.data === 'object' ? child.data : child;
                  const panelType = payload?.panelType ?? payload?.infoType;
                  const buttonText = payload?.buttonText;
                  const looksValid = !!panelType && !!buttonText && buttonText !== 'View Details';
                  return looksValid;
                });
                return { ...w, data: { ...w.data, widgets: filtered } };
              }
              return w;
            };

            const ensureHelpButton = (
              msg: any,
              {
                cue,
                widgetType,
                infoType,
                title,
                buttonText,
                content,
              }: {
                cue?: (message: string) => boolean;
                widgetType?: string;
                infoType: string;
                title: string;
                buttonText: string;
                content: any;
              },
            ) => {
              if (!msg || msg.actor !== 'assistant') return msg;
              const byWidget = widgetType ? hasWidgetType(msg.widget, widgetType) : false;
              const byCue =
                cue && typeof msg.message === 'string' ? cue(msg.message) : false;
              if (!byWidget && !byCue) return msg;

              const cleaned = migrateInfoButtonsToRightPanel(removeBrokenInfoButtons(msg.widget));
              if (hasInfoButton(cleaned, infoType)) {
                return cleaned === msg.widget ? msg : { ...msg, widget: cleaned };
              }

              const help = {
                type: 'right-panel-button',
                data: {
                  panelType: infoType,
                  title,
                  buttonText,
                  content,
                },
              };

              // If widget is a stack, prepend help; otherwise wrap.
              let nextWidget = cleaned;
              if (!nextWidget) {
                nextWidget = help;
              } else if (
                nextWidget?.type === 'widget-stack' &&
                Array.isArray(nextWidget?.data?.widgets)
              ) {
                nextWidget = {
                  ...nextWidget,
                  data: {
                    ...nextWidget.data,
                    widgets: [help, ...nextWidget.data.widgets],
                  },
                };
              } else {
                nextWidget = { type: 'widget-stack', data: { widgets: [help, nextWidget] } };
              }

              return nextWidget === msg.widget ? msg : { ...msg, widget: nextWidget };
            };

            const widgetContainsPanelType = (w: any, panelType: string): boolean => {
              if (!w) return false;
              if (w?.type === 'right-panel-button') {
                const p = w?.data && typeof w.data === 'object' ? w.data : w;
                return p?.panelType === panelType;
              }
              if (w?.type === 'info-popup-button') {
                const p = w?.data && typeof w.data === 'object' ? w.data : w;
                return p?.infoType === panelType;
              }
              if (w?.type === 'widget-stack' && Array.isArray(w?.data?.widgets)) {
                return w.data.widgets.some((child: any) => widgetContainsPanelType(child, panelType));
              }
              return false;
            };

            const isDashboardOnlyLeak = (m: any): boolean => {
              if (!m || m.actor !== 'assistant') return false;

              // Dashboard-only panels/widgets that sometimes leaked into onboarding_chat_messages.
              if (widgetContainsPanelType(m.widget, 'health-metrics')) return true;
              if (m?.widget?.type === 'info-grid' && (m as any)?.widget?.data?.title === 'APM Ticket Overview') {
                return true;
              }

              const s = typeof m?.message === 'string' ? m.message : '';
              if (s.includes('Welcome to your Device Dashboard')) return true;
              if (s.includes('Your Agentic Workflow is active')) return true;

              return false;
            };

            const cleanedParsed = (parsed as any[]).filter((m: any) => {
              if (isDashboardOnlyLeak(m)) return false;

              const isStandalone =
                m?.actor === 'assistant' &&
                (m?.message === '' || m?.message == null) &&
                (m?.widget?.type === 'info-popup-button' ||
                  m?.widget?.type === 'right-panel-button');
              if (!isStandalone) return true;
              const payload =
                m?.widget?.data && typeof m.widget.data === 'object'
                  ? m.widget.data
                  : m.widget;
              const buttonText = payload?.buttonText;
              return !!buttonText && buttonText !== 'View Details';
            });

            const repaired = cleanedParsed.map((m: any) => {
              let next = m;
              next = ensureHelpButton(next, {
                widgetType: 'machine-details-form',
                infoType: 'machine-config-help',
                title: 'Machine Parameter Configuration',
                buttonText: 'View Parameter Configuration Info',
                content: {},
              });
              next = ensureHelpButton(next, {
                cue: (s) => s.includes('Endpoint: mqtt.industrialiq.ai'),
                infoType: 'mqtt-setup',
                title: 'MQTT Configuration',
                buttonText: 'View MQTT Configuration Info',
                content: {
                  brokerEndpoint: 'mqtt.industrialiq.ai',
                  brokerPort: 8883,
                  topic: 'telemetry',
                },
              });
              next = ensureHelpButton(next, {
                widgetType: 'channel-configuration-widget',
                cue: (s) => s.includes('configure your channels'),
                infoType: 'channel-config-help',
                title: 'Channel Configuration',
                buttonText: 'View Channel Configuration Info',
                content: {},
              });
              return next;
            });

            setMessages(repaired);
            messageId.current = repaired.length;
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
    // Clear saved chat messages from localStorage (both onboarding and dashboard keys)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('onboarding_chat_messages');
        localStorage.removeItem('dashboard_chat_messages');
        localStorage.removeItem('onboarding_state');
        localStorage.removeItem('onboarding_complete');
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
