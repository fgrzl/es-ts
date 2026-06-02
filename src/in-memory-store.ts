import { DomainEvent } from "./domain-event";
import { Entity, entityKey } from "./entity";
import { Store } from "./store";
import { Context } from "./context";

export class ConcurrencyError extends Error {
  constructor(
    public readonly expectedSequence: number,
    public readonly currentSequence: number,
  ) {
    super(`version mismatch: expected ${expectedSequence}, got ${currentSequence}`);
    this.name = "ConcurrencyError";
  }
}

export interface InMemoryEventStore extends Store {
  data: Map<string, DomainEvent[]>;
}

export function newInMemoryEventStore(): InMemoryEventStore {
  const data = new Map<string, DomainEvent[]>();

  return {
    data,

    async loadEvents(_ctx: Context, entity: Entity, minSequence: number): Promise<DomainEvent[]> {
      const events = data.get(entityKey(entity)) ?? [];
      return events.filter((event) => event.getSequence() >= minSequence);
    },

    async saveEvents(
      _ctx: Context,
      entity: Entity,
      events: DomainEvent[],
      expectedSequence: number,
    ): Promise<void> {
      const key = entityKey(entity);
      const existing = data.get(key) ?? [];
      const currentSequence = existing.length;

      if (expectedSequence !== currentSequence) {
        throw new ConcurrencyError(expectedSequence, currentSequence);
      }

      data.set(key, [...existing, ...events]);
    },
  };
}
