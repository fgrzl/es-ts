import { bench, beforeAll } from "vitest";
import { serializeEvent, deserializeEvent } from "../../src/domain-event";
import { catRenamed, registerEvents } from "../../tests/events";
import { Scope } from "../../src/scope";

let serialized: string;
const event = catRenamed.create({ name: "Whiskers" });

event.setMetadata({
  entity: { id: "cat-1", area: "cats", scope: Scope.Global },
  eventId: "event-1",
  correlationId: "corr-1",
  causationId: "cause-1",
  timestamp: 123456,
  sequence: 1,
});

beforeAll(() => {
  registerEvents();
  serialized = serializeEvent(event);
});

bench("serialize event hotpath", () => {
  serializeEvent(event);
});

bench("deserialize event hotpath", () => {
  deserializeEvent(serialized);
});
