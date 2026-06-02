import { Entity } from "./entity";
import { DomainEvent } from "./domain-event";
import { Store } from "./store";
import { Aggregate, PendingAudit } from "./aggregate";
import { Context } from "./context";

export interface Repository {
  load(ctx: Context, aggregate: Aggregate): Promise<void>;
  save(ctx: Context, aggregate: Aggregate): Promise<void>;
}

export function newRepository(store: Store): Repository {
  return {
    async load(ctx: Context, aggregate: Aggregate): Promise<void> {
      const entity = aggregate.getEntity();
      const events = await store.loadEvents(ctx, entity, 0);
      aggregate.load(events);
    },

    async save(ctx: Context, aggregate: Aggregate): Promise<void> {
      const entity = aggregate.getEntity();
      const uncommitted = aggregate.getUncommittedEvents();
      const pending = aggregate.getPendingAudits();
      const expectedSequence = aggregate.getCommittedSequence();

      if (uncommitted.length === 0 && pending.length === 0) {
        return;
      }

      const batches = groupPendingAuditsByStream(pending);
      for (const batch of batches) {
        const events: DomainEvent[] = [];
        for (let index = 0; index < batch.items.length; index += 1) {
          const pa = batch.items[index];
          pa.event.setMetadata({
            entity: batch.entity,
            eventId: pa.eventId,
            correlationId: aggregate.getCorrelationID(),
            causationId: aggregate.getCausationID(),
            timestamp: pa.timestamp,
            sequence: index + 1,
          });
          events.push(pa.event);
        }
        await store.saveEvents(ctx, batch.entity, events, 0);
        aggregate.trimPendingAudits(batch.items.length);
      }

      if (uncommitted.length > 0) {
        await store.saveEvents(ctx, entity, uncommitted, expectedSequence);
      }

      aggregate.commit();
      aggregate.discardPendingAudits();
    },
  };
}

interface AuditStreamBatch {
  entity: Entity;
  items: PendingAudit[];
}

function groupPendingAuditsByStream(pending: PendingAudit[]): AuditStreamBatch[] {
  if (pending.length === 0) {
    return [];
  }

  const batches: AuditStreamBatch[] = [];
  const batchesByEntity = new Map<string, number>();

  for (const item of pending) {
    const key = `${item.entity.scope}:${item.entity.tenantId ?? ""}:${item.entity.area}:${item.entity.id}`;
    const existingIndex = batchesByEntity.get(key);
    if (existingIndex !== undefined) {
      batches[existingIndex].items.push(item);
      continue;
    }

    batchesByEntity.set(key, batches.length);
    batches.push({ entity: item.entity, items: [item] });
  }

  return batches;
}
