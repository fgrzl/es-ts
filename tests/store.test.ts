import { describe, expect, it } from "vitest";
import { defineEvent } from "../src/domain-event";
import { newInMemoryEventStore, ConcurrencyError } from "../src/in-memory-store";
import { newEntity } from "../src/entity";

describe("InMemoryEventStore", () => {
  const descriptor = defineEvent<{ name: string }>("tests", "store.event");

  it("should persist and load events given saved entity events", async () => {
    const store = newInMemoryEventStore();
    const entity = newEntity("cat-1", "tests");

    const first = descriptor.create({ name: "first" });
    first.setMetadata({
      entity,
      eventId: "evt-1",
      correlationId: "corr-1",
      causationId: "cause-1",
      timestamp: 100,
      sequence: 1,
    });

    const second = descriptor.create({ name: "second" });
    second.setMetadata({
      entity,
      eventId: "evt-2",
      correlationId: "corr-2",
      causationId: "cause-2",
      timestamp: 200,
      sequence: 2,
    });

    await store.saveEvents(undefined as any, entity, [first], 0);
    await store.saveEvents(undefined as any, entity, [second], 1);

    const all = await store.loadEvents(undefined as any, entity, 0);
    const afterOne = await store.loadEvents(undefined as any, entity, 2);

    expect(all).toHaveLength(2);
    expect(afterOne).toHaveLength(1);
    expect(afterOne[0].getEventID()).toBe("evt-2");
  });

  it("should throw a concurrency error given a sequence mismatch when saving events", async () => {
    const store = newInMemoryEventStore();
    const entity = newEntity("cat-2", "tests");
    const event = descriptor.create({ name: "first" });
    event.setMetadata({
      entity,
      eventId: "evt-3",
      correlationId: "corr-3",
      causationId: "cause-3",
      timestamp: 300,
      sequence: 1,
    });

    await store.saveEvents(undefined as any, entity, [event], 0);

    await expect(store.saveEvents(undefined as any, entity, [event], 0)).rejects.toBeInstanceOf(
      ConcurrencyError,
    );
  });
});
