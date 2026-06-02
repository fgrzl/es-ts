import { describe, expect, it } from "vitest";
import { newRepository } from "../src/repository";
import { newInMemoryEventStore } from "../src/in-memory-store";
import { createCat } from "./aggregates/cat";
import { createContext } from "../src/context";
import { defineEvent } from "../src/domain-event";

describe("Repository", () => {
  it("should no-op given no uncommitted or pending audit events when save is called", async () => {
    const store = newInMemoryEventStore();
    const repo = newRepository(store);
    const cat = createCat("cat-1");

    await repo.save(createContext(), cat.aggregate);

    expect((store as any).data.size).toBe(0);
  });

  it("should commit uncommitted events given an aggregate with uncommitted changes when save is called", async () => {
    const store = newInMemoryEventStore();
    const repo = newRepository(store);
    const cat = createCat("cat-2");

    cat.rename("Whiskers");
    await repo.save(createContext(), cat.aggregate);

    expect(cat.aggregate.getUncommittedEvents()).toHaveLength(0);
    expect(cat.aggregate.getCommittedEvents()).toHaveLength(1);
    expect((store as any).data.size).toBe(1);
  });

  it("should save pending audits in a single audit stream given multiple audits on the same aggregate", async () => {
    const store = newInMemoryEventStore();
    const repo = newRepository(store);
    const auditEventA = defineEvent<{}>("repository.audit.a", "cats").create({});
    const auditEventB = defineEvent<{}>("repository.audit.b", "cats").create({});
    const aggregate = createCat("cat-3").aggregate;

    aggregate.audit(auditEventA);
    aggregate.audit(auditEventB);

    await repo.save(createContext(), aggregate);

    expect(aggregate.getPendingAudits()).toHaveLength(0);
    expect(aggregate.getCommittedEvents()).toHaveLength(0);
    expect((store as any).data.size).toBe(1);
    const firstEntry = Array.from((store as any).data.entries() as Iterable<[string, unknown]>)[0];
    const saved = firstEntry?.[1] as unknown[];
    expect(saved).toHaveLength(2);
  });

  it("should load committed events into a fresh aggregate given saved event history", async () => {
    const store = newInMemoryEventStore();
    const repo = newRepository(store);
    const original = createCat("cat-4");

    original.rename("Mittens");
    await repo.save(createContext(), original.aggregate);

    const fresh = createCat("cat-4");
    await repo.load(createContext(), fresh.aggregate);

    expect(fresh.aggregate.getCommittedEvents()).toHaveLength(1);
    expect(fresh.aggregate.getUncommittedEvents()).toHaveLength(0);
  });
});
