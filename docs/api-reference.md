# `es-ts` API Reference

This file summarizes the public API surface exported by `es-ts`.

## Event model

- `DomainEvent`
- `EventDescriptor<E, P>`
- `defineEvent<P, E>(discriminator: string, area: string)`
- `createDomainEvent<T>(discriminator: string, area: string, payload: T)`
- `registerEvent(descriptor)`
- `serializeEvent(event)`
- `deserializeEvent(json)`

## Entity / metadata

- `Entity`
- `EventMetadata`
- `newEntity(id, area)`
- `newTenantEntity(tenantId, id, area)`
- `auditStreamEntity(domain)`
- `entityKey(entity)`
- `isEmptyEntity(value)`
- `Scope`

## Aggregate

- `Aggregate`
- `PendingAudit`
- `newAggregate(area, id)`
- `newTenantAggregate(area, tenantId, id)`

## Store and repository

- `Store`
- `Repository`
- `newRepository(store)`
- `newInMemoryEventStore()`
- `ConcurrencyError`

## Context and tracing

- `Context`
- `createContext(initialValues)`
- `mergeContext(base, update)`

## Notes

- `es-ts` is designed as a small core library. It supports typed event dispatch, event metadata stamping, audit stream staging, and a repository/store abstraction.
- Use the `registerEvent` + `serializeEvent` / `deserializeEvent` pair for cross-process polymorphic event handling.
- `newAggregate` and `newTenantAggregate` help keep entity scope explicit.
