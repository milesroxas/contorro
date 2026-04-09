import type { DomainEvent, EventBus } from "@repo/kernel";

export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<
    string,
    Set<(event: DomainEvent<string, unknown>) => Promise<void>>
  >();

  async publish<E extends DomainEvent<string, unknown>>(
    event: E,
  ): Promise<void> {
    const set = this.handlers.get(event.type);
    if (!set || set.size === 0) return;
    await Promise.all([...set].map((h) => h(event)));
  }

  subscribe<E extends DomainEvent<string, unknown>>(
    type: E["type"],
    handler: (event: E) => Promise<void>,
  ): void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as (event: DomainEvent<string, unknown>) => Promise<void>);
  }
}
