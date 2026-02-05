import type { ActionsRegistry, FlowDefinition, FlowEvent, FlowStateConfig, FlowStateId, PersistAdapter } from './types';

export class StateMachine<TCtx extends Record<string, any> = any> {
  private def: FlowDefinition;
  private actions: ActionsRegistry;
  private persist?: PersistAdapter;

  stateId: FlowStateId;
  context: TCtx;
  history: FlowStateId[] = [];
  wasRestored = false;

  constructor(def: FlowDefinition, actions: ActionsRegistry = {}, initialContext: TCtx = {} as TCtx, persist?: PersistAdapter) {
    this.def = def;
    this.actions = actions;
    this.persist = persist;

    const restored = persist?.load?.();
    if (restored?.stateId && def.states[restored.stateId]) {
      this.stateId = restored.stateId;
      this.context = restored.context || ({} as TCtx);
      this.history = restored.history || [];
      this.wasRestored = true;
    } else {
      this.stateId = def.initial;
      this.context = initialContext;
      this.history = [this.stateId];
      this.wasRestored = false;
      this.save();
    }
  }

  get state(): FlowStateConfig {
    return this.def.states[this.stateId];
  }

  updateContext(patch: Partial<TCtx>) {
    this.context = { ...this.context, ...patch };
    this.save();
  }

  private resolveTarget(trans: { target?: FlowStateId | ((ctx: any) => FlowStateId | undefined) }): FlowStateId | undefined {
    if (!trans.target) return undefined;
    return typeof trans.target === 'function' ? trans.target(this.context) : trans.target;
  }

  async send(event: FlowEvent): Promise<void> {
    const current = this.state;
    const trans = current.on?.[event.type];
    if (!trans) return;

    // Run action first so it can mutate context before deciding next state
    const action = trans.action;
    if (action) {
      if (typeof action === 'string') {
        const fn = this.actions[action];
        if (fn) await fn(this.context, event);
      } else {
        await action(this.context, event);
      }
      this.save();
    }

    const target = this.resolveTarget(trans);
    if (target && target !== this.stateId) {
      this.stateId = target;
      this.history.push(target);
      this.save();
    }
  }

  reset(ctx?: Partial<TCtx>) {
    this.stateId = this.def.initial;
    this.context = { ...(this.context || {}), ...(ctx || {}) } as TCtx;
    this.history = [this.stateId];
    this.save();
  }

  private save() {
    this.persist?.save?.({ stateId: this.stateId, context: this.context, history: this.history });
  }
}

export const localStoragePersist = (key: string): PersistAdapter => ({
  load: () => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  },
  save: (s) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(s)); } catch {}
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(key); } catch {}
  },
});
