import { Entity, EventMetadata } from "./entity";
import { Scope } from "./scope";

export interface JsonEntity {
  id: string;
  area: string;
  tenant_id?: string;
  scope: Scope;
}

export interface JsonEventMetadata {
  entity: JsonEntity;
  event_id: string;
  correlation_id: string;
  causation_id: string;
  timestamp: number;
  sequence: number;
}

interface JsonPolymorphicEnvelope {
  $type: string;
  content: Record<string, unknown>;
}

const eventRegistry = new Map<string, EventDescriptor<DomainEvent, DomainEventPayload>>();
const eventPayloadSymbol = Symbol("eventPayload");

type EventWithPayload = DomainEvent & {
  [eventPayloadSymbol]?: Record<string, unknown>;
};

export interface DomainEvent {
  getDiscriminator(): string;
  getAggregateID(): string;
  getArea(): string;
  getTenantID(): string | undefined;
  getCausationID(): string;
  getCorrelationID(): string;
  getEntity(): Entity;
  getEventID(): string;
  getMetadata(): EventMetadata | undefined;
  getSequence(): number;
  getTimestamp(): number;
  setMetadata(metadata: EventMetadata): void;
}

export interface EventDescriptor<E extends DomainEvent, P extends DomainEventPayload = {}> {
  discriminator: string;
  area: string;
  create(payload: P): E;
}

export function defineEvent<
  P extends DomainEventPayload,
  E extends DomainEvent & P = DomainEvent & P,
>(area: string, discriminator: string): EventDescriptor<E, P> {
  return {
    discriminator,
    area,
    create: (payload: P) => createDomainEvent<P>(discriminator, area, payload) as E,
  };
}

type DomainEventPayload = Record<string, unknown>;

export function createDomainEvent<T extends DomainEventPayload>(
  discriminator: string,
  area: string,
  payload: T,
): DomainEvent & T {
  let metadata: EventMetadata | undefined;

  const event = {
    ...payload,
    [eventPayloadSymbol]: payload,
    getDiscriminator: () => discriminator,
    getAggregateID: () => metadata?.entity.id ?? "",
    getArea: () => area,
    getTenantID: () => metadata?.entity.tenantId,
    getCausationID: () => metadata?.causationId ?? "",
    getCorrelationID: () => metadata?.correlationId ?? "",
    getEntity: () => metadata?.entity ?? { id: "", area, scope: Scope.Global },
    getEventID: () => metadata?.eventId ?? "",
    getMetadata: () => metadata,
    getSequence: () => metadata?.sequence ?? 0,
    getTimestamp: () => metadata?.timestamp ?? 0,
    setMetadata: (value) => {
      if (!metadata) {
        metadata = value;
      }
    },
    toJSON: () => {
      if (!metadata) {
        return payload;
      }
      return { ...payload, metadata: toJsonEventMetadata(metadata) };
    },
  } as DomainEvent & T;

  return event;
}

function toJsonEntity(entity: Entity): JsonEntity {
  return {
    id: entity.id,
    area: entity.area,
    tenant_id: entity.tenantId,
    scope: entity.scope,
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function fromJsonEntity(value: unknown): Entity {
  if (!isPlainObject(value)) {
    throw new Error("deserializeEvent: invalid entity payload");
  }

  return {
    id: asString(value.id),
    area: asString(value.area),
    tenantId: value.tenant_id !== undefined ? asString(value.tenant_id) : undefined,
    scope: typeof value.scope === "number" ? value.scope : Scope.Global,
  };
}

function toJsonEventMetadata(metadata: EventMetadata): JsonEventMetadata {
  return {
    entity: toJsonEntity(metadata.entity),
    event_id: metadata.eventId,
    correlation_id: metadata.correlationId,
    causation_id: metadata.causationId,
    timestamp: metadata.timestamp,
    sequence: metadata.sequence,
  };
}

function fromJsonEventMetadata(value: unknown): EventMetadata {
  if (!isPlainObject(value)) {
    throw new Error("deserializeEvent: invalid metadata payload");
  }

  return {
    entity: fromJsonEntity(value.entity),
    eventId: asString(value.event_id),
    correlationId: asString(value.correlation_id),
    causationId: asString(value.causation_id),
    timestamp: asNumber(value.timestamp),
    sequence: asNumber(value.sequence),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getEventPayload(event: DomainEvent): Record<string, unknown> {
  const typedEvent = event as EventWithPayload;
  const payload = typedEvent[eventPayloadSymbol];
  if (payload && isPlainObject(payload)) {
    return payload;
  }

  const result: Record<string, unknown> = {};
  const eventRecord = event as unknown as Record<string, unknown>;

  for (const key of Object.keys(event)) {
    const value = eventRecord[key];
    if (typeof value !== "function") {
      result[key] = value;
    }
  }

  return result;
}

export function registerEvent<E extends DomainEvent, P extends DomainEventPayload>(
  descriptor: EventDescriptor<E, P>,
): void {
  const discriminator = descriptor.discriminator;
  if (!discriminator) {
    throw new Error("registerEvent: discriminator must not be empty");
  }

  if (eventRegistry.has(discriminator)) {
    throw new Error(
      `registerEvent: an event is already registered for discriminator ${discriminator}`,
    );
  }

  eventRegistry.set(discriminator, descriptor as EventDescriptor<DomainEvent, DomainEventPayload>);
}

export function serializeEvent(event: DomainEvent): string {
  const descriptor = eventRegistry.get(event.getDiscriminator());
  if (!descriptor) {
    throw new Error(`serializeEvent: event type ${event.getDiscriminator()} is not registered`);
  }

  const payload = getEventPayload(event);
  const metadata = event.getMetadata();
  const content: Record<string, unknown> = metadata
    ? { ...payload, metadata: toJsonEventMetadata(metadata) }
    : payload;

  return JSON.stringify({ $type: event.getDiscriminator(), content });
}

export function deserializeEvent(json: string): DomainEvent {
  let envelope: JsonPolymorphicEnvelope;
  try {
    envelope = JSON.parse(json) as JsonPolymorphicEnvelope;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`deserializeEvent: invalid JSON payload: ${message}`);
  }

  if (!envelope || typeof envelope.$type !== "string") {
    throw new Error("deserializeEvent: missing $type field");
  }

  const descriptor = eventRegistry.get(envelope.$type);
  if (!descriptor) {
    throw new Error(`deserializeEvent: unknown discriminator ${envelope.$type}`);
  }

  if (!isPlainObject(envelope.content)) {
    throw new Error("deserializeEvent: content must be an object");
  }

  const content = envelope.content as Record<string, unknown>;
  const metadata = content.metadata;
  if ("metadata" in content) {
    delete content.metadata;
  }

  const event = descriptor.create(content as DomainEventPayload);
  if (metadata !== undefined) {
    event.setMetadata(fromJsonEventMetadata(metadata));
  }

  return event;
}
