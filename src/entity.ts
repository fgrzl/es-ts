import { Scope } from "./scope";

export interface Entity {
  id: string;
  area: string;
  tenantId?: string;
  scope: Scope;
}

export interface EventMetadata {
  entity: Entity;
  eventId: string;
  correlationId: string;
  causationId: string;
  timestamp: number;
  sequence: number;
}

export function newEntity(id: string, area: string): Entity {
  if (!id) throw new Error("newEntity: id cannot be empty");
  if (!area) throw new Error("newEntity: area cannot be empty");
  return { id, area, scope: Scope.Global };
}

export function newTenantEntity(tenantId: string, id: string, area: string): Entity {
  if (!tenantId) throw new Error("newTenantEntity: tenantId cannot be empty");
  if (!id) throw new Error("newTenantEntity: id cannot be empty");
  if (!area) throw new Error("newTenantEntity: area cannot be empty");
  return { id, tenantId, area, scope: Scope.Tenant };
}

export function auditStreamEntity(domain: Entity): Entity {
  return {
    id: crypto.randomUUID(),
    area: domain.area,
    tenantId: domain.tenantId,
    scope: domain.scope,
  };
}

export function entityKey(entity: Entity): string {
  const tenant = entity.tenantId ?? "";
  return `${entity.scope}:${tenant}:${entity.area}:${entity.id}`;
}

export function isEmptyEntity(value: Entity | undefined): boolean {
  return !value || !value.id || !value.area;
}
