import { v4 as uuid } from "uuid";
import { DomainEvent, EventDescriptor } from "./domain-event";
import { Entity, auditStreamEntity } from "./entity";
import { Scope } from "./scope";

export type DomainEventHandler<E extends DomainEvent = DomainEvent> = (event: E) => void;

export interface Aggregate {
  getEntity(): Entity;
  getAggregateID(): string;
  getCorrelationID(): string;
  getCausationID(): string;
  appendCommitted(event: DomainEvent): void;
  getCommittedEvents(): DomainEvent[];
  getCommittedSequence(): number;
  appendUncommitted(event: DomainEvent): void;
  getUncommittedEvents(): DomainEvent[];
  getUncommittedSequence(): number;
  registerHandler<E extends DomainEvent = DomainEvent>(
    discriminator: string,
    handler: DomainEventHandler<E>,
  ): void;
  registerHandler<E extends DomainEvent = DomainEvent>(
    descriptor: EventDescriptor<E>,
    handler: DomainEventHandler<E>,
  ): void;
  raise(event: DomainEvent): void;
  audit(event: DomainEvent): void;
  load(events: DomainEvent[]): void;
  commit(): void;
  getPendingAudits(): PendingAudit[];
  discardPendingAudits(): void;
  trimPendingAudits(n: number): void;
}

export interface PendingAudit {
  event: DomainEvent;
  entity: Entity;
  eventId: string;
  timestamp: number;
}

interface InternalAggregate extends Aggregate {
  getUncommittedEventRefs(): DomainEvent[];
  getPendingAuditRefs(): PendingAudit[];
}

const errRegisterHandlerAlreadyExists = "RegisterHandler: handler for event already exists";
const errRaiseInvalidAggregateArea = "Raise: aggregate area is not valid for event";
const errAuditInvalidAggregateArea = "Audit: aggregate area is not valid for event";
const errAuditEventStaged = "Audit: event instance must not be staged more than once";
const errNewAggregateNilID = "newAggregate: id cannot be empty";
const errNewAggregateEmptyArea = "newAggregate: area cannot be empty";
const errNewTenantAggregateNilTenantID = "newTenantAggregate: tenantId cannot be empty";

type AggregateState = {
  entity: Entity;
  correlationId: string;
  causationId: string;
  committed: DomainEvent[];
  uncommitted: DomainEvent[];
  pendingAudits: PendingAudit[];
  stagedAudits: Set<DomainEvent>;
  handlers: Map<string, DomainEventHandler>;
};

function createAggregateBase(
  entity: Entity,
  correlationId?: string,
  causationId?: string,
): Aggregate & InternalAggregate {
  const state: AggregateState = {
    entity,
    correlationId: correlationId ?? uuid(),
    causationId: causationId ?? uuid(),
    committed: [],
    uncommitted: [],
    pendingAudits: [],
    stagedAudits: new Set(),
    handlers: new Map(),
  };

  const getEntity = (): Entity => state.entity;
  const getAggregateID = (): string => state.entity.id;
  const getCorrelationID = (): string => state.correlationId;
  const getCausationID = (): string => state.causationId;
  const appendCommitted = (event: DomainEvent): void => {
    state.committed.push(event);
  };
  const getCommittedEvents = (): DomainEvent[] => [...state.committed];
  const getCommittedSequence = (): number => state.committed.length;
  const appendUncommitted = (event: DomainEvent): void => {
    state.uncommitted.push(event);
  };
  const getUncommittedEvents = (): DomainEvent[] => [...state.uncommitted];
  const getUncommittedEventRefs = (): DomainEvent[] => state.uncommitted;
  const getPendingAuditRefs = (): PendingAudit[] => state.pendingAudits;
  const getUncommittedSequence = (): number => state.committed.length + state.uncommitted.length;

  const registerHandler = <E extends DomainEvent = DomainEvent>(
    discriminatorOrDescriptor: string | EventDescriptor<E>,
    handler: DomainEventHandler<E>,
  ): void => {
    const discriminator =
      typeof discriminatorOrDescriptor === "string"
        ? discriminatorOrDescriptor
        : discriminatorOrDescriptor.discriminator;

    if (state.handlers.has(discriminator)) {
      throw new Error(errRegisterHandlerAlreadyExists);
    }
    state.handlers.set(discriminator, handler as DomainEventHandler);
  };

  const applyEvent = (event: DomainEvent): void => {
    const eventName = event.getDiscriminator();
    const handler = state.handlers.get(eventName);
    if (handler) {
      handler(event);
    }
  };

  const raise = (event: DomainEvent): void => {
    const domainArea = state.entity.area;
    if (event.getArea() !== domainArea) {
      throw new Error(errRaiseInvalidAggregateArea);
    }

    const sequence = state.committed.length + state.uncommitted.length + 1;
    event.setMetadata({
      entity: getEntity(),
      eventId: uuid(),
      correlationId: getCorrelationID(),
      causationId: getCausationID(),
      timestamp: Date.now(),
      sequence,
    });

    applyEvent(event);
    appendUncommitted(event);
  };

  const audit = (event: DomainEvent): void => {
    const domainArea = state.entity.area;
    if (event.getArea() !== domainArea) {
      throw new Error(errAuditInvalidAggregateArea);
    }
    if (state.stagedAudits.has(event)) {
      throw new Error(errAuditEventStaged);
    }

    const auditEntity =
      state.pendingAudits.length > 0
        ? state.pendingAudits[0].entity
        : auditStreamEntity(state.entity);

    state.pendingAudits.push({
      event,
      entity: auditEntity,
      eventId: uuid(),
      timestamp: Date.now(),
    });
    state.stagedAudits.add(event);
  };

  const load = (events: DomainEvent[]): void => {
    const committed = state.committed;
    for (const event of events) {
      applyEvent(event);
      committed.push(event);
    }
  };

  const commit = (): void => {
    state.committed.push(...state.uncommitted);
    state.uncommitted.length = 0;
  };

  const getPendingAudits = (): PendingAudit[] => [...state.pendingAudits];

  const discardPendingAudits = (): void => {
    state.pendingAudits = [];
    state.stagedAudits.clear();
  };

  const trimPendingAudits = (n: number): void => {
    if (n <= 0) {
      return;
    }

    const removed = state.pendingAudits.splice(0, n);
    for (const item of removed) {
      state.stagedAudits.delete(item.event);
    }
  };

  return {
    getEntity,
    getAggregateID,
    getCorrelationID,
    getCausationID,
    appendCommitted,
    getCommittedEvents,
    getCommittedSequence,
    appendUncommitted,
    getUncommittedEvents,
    getUncommittedEventRefs,
    getPendingAuditRefs,
    getUncommittedSequence,
    registerHandler,
    raise,
    audit,
    load,
    commit,
    getPendingAudits,
    discardPendingAudits,
    trimPendingAudits,
  };
}

export function newAggregate(area: string, id: string): Aggregate {
  if (!id) {
    throw new Error(errNewAggregateNilID);
  }
  if (!area) {
    throw new Error(errNewAggregateEmptyArea);
  }
  return createAggregateBase({ id, area, scope: Scope.Global });
}

export function newTenantAggregate(area: string, tenantId: string, id: string): Aggregate {
  if (!tenantId) {
    throw new Error(errNewTenantAggregateNilTenantID);
  }
  if (!id) {
    throw new Error(errNewAggregateNilID);
  }
  if (!area) {
    throw new Error(errNewAggregateEmptyArea);
  }
  return createAggregateBase({ id, area, tenantId, scope: Scope.Tenant });
}
