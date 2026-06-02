import { bench, beforeAll } from "vitest";
import { registerEvent, serializeEvent, deserializeEvent } from "../../src/domain-event";
import { catAdopted } from "../../tests/events/cat-adopted";
import { catRenamed } from "../../tests/events/cat-renamed";
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
  registerEvent(catRenamed);
  registerEvent(catAdopted);
  serialized = serializeEvent(event);
});

bench("serialize event hotpath", () => {
  serializeEvent(event);
});

bench("deserialize event hotpath", () => {
  deserializeEvent(serialized);
});
