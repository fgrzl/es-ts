import { DomainEvent } from "./domain-event";
import { Entity } from "./entity";
import { Context } from "./context";

export interface Store {
  saveEvents(
    ctx: Context,
    entity: Entity,
    events: DomainEvent[],
    expectedSequence: number,
  ): Promise<void>;
  loadEvents(ctx: Context, entity: Entity, minSequence: number): Promise<DomainEvent[]>;
}
