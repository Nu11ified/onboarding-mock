export type FlowStateId = string;

export type FlowEvent = {
  type: string;
  data?: Record<string, unknown>;
};

export type FlowTransition = {
  target?: FlowStateId | ((ctx: any) => FlowStateId | undefined);
  action?: string | ((ctx: any, event: FlowEvent) => Promise<void> | void);
};

export type FlowStateConfig = {
  id: FlowStateId;
  message?: string | ((ctx: any) => string);
  widget?: any;
  waitForUserInput?: boolean;
  on?: Record<string, FlowTransition>;
};

export type FlowDefinition = {
  initial: FlowStateId;
  states: Record<FlowStateId, FlowStateConfig>;
};

export type PersistAdapter = {
  load: () => any | null;
  save: (state: { stateId: FlowStateId; context: any; history: FlowStateId[] }) => void;
  clear: () => void;
};

export type ActionsRegistry = Record<string, (ctx: any, event: FlowEvent) => Promise<void> | void>;
