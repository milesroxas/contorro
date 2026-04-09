export type DomainEvent<T extends string, P> = {
  type: T;
  occurredAt: Date;
  payload: P;
};

export interface EventBus {
  publish<E extends DomainEvent<string, unknown>>(event: E): Promise<void>;
  subscribe<E extends DomainEvent<string, unknown>>(
    type: E["type"],
    handler: (event: E) => Promise<void>,
  ): void;
}
