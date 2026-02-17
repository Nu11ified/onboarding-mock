'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type RightSidePanelType =
  | 'machine-config-help'
  | 'mqtt-setup'
  | 'channel-config-help'
  | 'health-metrics'
  | 'agentic-workflow'
  | 'what-can-i-do-next'
  | 'training-video'
  | 'chat-groups';

export type RightSidePanelState = {
  type: RightSidePanelType;
  title?: string;
  data?: any;
};

type RightSidePanelContextValue = {
  panel: RightSidePanelState | null;
  isOpen: boolean;
  openPanel: (panel: RightSidePanelState) => void;
  closePanel: () => void;
};

const RightSidePanelContext = createContext<RightSidePanelContextValue | null>(null);

export function RightSidePanelProvider({ children }: { children: React.ReactNode }) {
  const [panel, setPanel] = useState<RightSidePanelState | null>(null);

  const openPanel = useCallback((next: RightSidePanelState) => {
    setPanel(next);
  }, []);

  const closePanel = useCallback(() => {
    setPanel(null);
  }, []);

  const value = useMemo<RightSidePanelContextValue>(
    () => ({
      panel,
      isOpen: !!panel,
      openPanel,
      closePanel,
    }),
    [panel, openPanel, closePanel],
  );

  return (
    <RightSidePanelContext.Provider value={value}>
      {children}
    </RightSidePanelContext.Provider>
  );
}

export function useRightSidePanel() {
  const ctx = useContext(RightSidePanelContext);
  if (!ctx) {
    throw new Error('useRightSidePanel must be used within RightSidePanelProvider');
  }
  return ctx;
}

export function useRightSidePanelOptional() {
  return useContext(RightSidePanelContext);
}
