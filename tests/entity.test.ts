import { describe, expect, it } from "vitest";
import {
  newEntity,
  newTenantEntity,
  auditStreamEntity,
  entityKey,
  isEmptyEntity,
} from "../src/entity";
import { Scope } from "../src/scope";

describe("Entity", () => {
  it("should create a global entity given a valid id and area", () => {
    const entity = newEntity("cat-1", "cats");

    expect(entity.id).toBe("cat-1");
    expect(entity.area).toBe("cats");
    expect(entity.scope).toBe(Scope.Global);
    expect(entity.tenantId).toBeUndefined();
  });

  it("should create a tenant-scoped entity given a tenant id, id, and area", () => {
    const entity = newTenantEntity("tenant-1", "cat-2", "cats");

    expect(entity.id).toBe("cat-2");
    expect(entity.area).toBe("cats");
    expect(entity.scope).toBe(Scope.Tenant);
    expect(entity.tenantId).toBe("tenant-1");
  });

  it("should throw when id is missing given newEntity is called", () => {
    expect(() => newEntity("", "cats")).toThrow("newEntity: id cannot be empty");
  });

  it("should throw when area is missing given newEntity is called", () => {
    expect(() => newEntity("cat-1", "")).toThrow("newEntity: area cannot be empty");
  });

  it("should throw when tenantId is missing given newTenantEntity is called", () => {
    expect(() => newTenantEntity("", "cat-1", "cats")).toThrow(
      "newTenantEntity: tenantId cannot be empty",
    );
  });

  it("should create an audit stream entity given a domain entity", () => {
    const domain = { id: "cat-1", area: "cats", tenantId: "tenant-1", scope: Scope.Tenant };
    const audit = auditStreamEntity(domain);

    expect(audit.area).toBe(domain.area);
    expect(audit.tenantId).toBe(domain.tenantId);
    expect(audit.scope).toBe(domain.scope);
    expect(audit.id).not.toBe(domain.id);
  });

  it("should generate deterministic entity keys given entity identity values", () => {
    expect(entityKey({ id: "cat-1", area: "cats", scope: Scope.Global })).toBe("0::cats:cat-1");
    expect(
      entityKey({ id: "cat-2", area: "cats", tenantId: "tenant-1", scope: Scope.Tenant }),
    ).toBe("1:tenant-1:cats:cat-2");
  });

  it("should treat entities with missing id or area as empty", () => {
    expect(isEmptyEntity(undefined)).toBe(true);
    expect(isEmptyEntity({ id: "", area: "cats", scope: Scope.Global })).toBe(true);
    expect(isEmptyEntity({ id: "cat-1", area: "", scope: Scope.Global })).toBe(true);
    expect(isEmptyEntity({ id: "cat-1", area: "cats", scope: Scope.Global })).toBe(false);
  });
});
