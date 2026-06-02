import { bench, beforeAll } from "vitest";
import { defineEvent } from "../../src/domain-event";
import { newEntity } from "../../src/entity";
import { newInMemoryEventStore } from "../../src/in-memory-store";

const descriptor = defineEvent<{ name: string }>("bench.store", "tests");
const entity = newEntity("store-bench", "tests");
const event = descriptor.create({ name: "save" });

event.setMetadata({
  entity,
  eventId: "bench-event",
  correlationId: "bench-corr",
  causationId: "bench-cause",
  timestamp: 1,
  sequence: 1,
});

const store = newInMemoryEventStore();

beforeAll(async () => {
  for (let index = 0; index < 50; index += 1) {
    const item = descriptor.create({ name: `loaded-${index}` });
    item.setMetadata({
      entity,
      eventId: `bench-event-${index}`,
      correlationId: "bench-corr",
      causationId: "bench-cause",
      timestamp: index,
      sequence: index + 1,
    });
    await store.saveEvents(undefined as any, entity, [item], index);
  }
});

bench("store save hotpath", async () => {
  const runtimeStore = newInMemoryEventStore();
  await runtimeStore.saveEvents(undefined as any, entity, [event], 0);
});

bench("store load hotpath", async () => {
  await store.loadEvents(undefined as any, entity, 25);
});
