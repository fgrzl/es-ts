import { Entity, entityKey } from "./entity";
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
      const uncommitted =
        (
          aggregate as { getUncommittedEventRefs?: () => DomainEvent[] }
        ).getUncommittedEventRefs?.() ?? aggregate.getUncommittedEvents();
      const pending =
        (aggregate as { getPendingAuditRefs?: () => PendingAudit[] }).getPendingAuditRefs?.() ??
        aggregate.getPendingAudits();
      const expectedSequence = aggregate.getCommittedSequence();

      if (uncommitted.length === 0 && pending.length === 0) {
        return;
      }

      const correlationId = aggregate.getCorrelationID();
      const causationId = aggregate.getCausationID();

      if (pending.length > 0 && uncommitted.length === 0) {
        const batchEntity = pending[0].entity;
        let sameEntity = true;

        for (let i = 1; i < pending.length; i += 1) {
          if (pending[i].entity !== batchEntity) {
            sameEntity = false;
            break;
          }
        }

        if (sameEntity) {
          const events: DomainEvent[] = [];
          for (let index = 0; index < pending.length; index += 1) {
            const pa = pending[index];
            pa.event.setMetadata({
              entity: batchEntity,
              eventId: pa.eventId,
              correlationId,
              causationId,
              timestamp: pa.timestamp,
              sequence: index + 1,
            });
            events.push(pa.event);
          }
          await store.saveEvents(ctx, batchEntity, events, 0);
          aggregate.trimPendingAudits(pending.length);
          aggregate.commit();
          aggregate.discardPendingAudits();
          return;
        }
      }

      const batches = groupPendingAuditsByStream(pending);
      for (const batch of batches) {
        const events: DomainEvent[] = [];
        for (let index = 0; index < batch.items.length; index += 1) {
          const pa = batch.items[index];
          pa.event.setMetadata({
            entity: batch.entity,
            eventId: pa.eventId,
            correlationId,
            causationId,
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
    const key = entityKey(item.entity);
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
