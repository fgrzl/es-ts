import { beforeAll, describe, expect, it } from "vitest";
import { deserializeEvent, registerEvent, serializeEvent } from "../src/domain-event";
import { catAdopted } from "./events/cat-adopted";
import { catRenamed } from "./events/cat-renamed";
import { Scope } from "../src/scope";

describe("Polymorphic event serialization", () => {
  beforeAll(() => {
    registerEvent(catAdopted);
    registerEvent(catRenamed);
  });

  it("should round-trip a typed domain event given a registered descriptor when serializeEvent is called", () => {
    const event = catRenamed.create({ name: "Whiskers" });
    event.setMetadata({
      entity: { id: "cat-1", area: "cats", scope: Scope.Global },
      eventId: "event-1",
      correlationId: "corr-1",
      causationId: "cause-1",
      timestamp: 123456,
      sequence: 1,
    });

    const serialized = serializeEvent(event);
    const decoded = deserializeEvent(serialized);

    expect(decoded.getDiscriminator()).toBe(catRenamed.discriminator);
    expect((decoded as any).name).toBe("Whiskers");
    expect(decoded.getMetadata()?.eventId).toBe("event-1");
    expect(decoded.getEntity().scope).toBe(Scope.Global);
  });

  it("should deserialize a Go-style envelope given snake_case metadata", () => {
    const raw = JSON.stringify({
      $type: catAdopted.discriminator,
      content: {
        metadata: {
          entity: {
            id: "cat-2",
            area: "cats",
            scope: Scope.Global,
          },
          event_id: "event-2",
          correlation_id: "corr-2",
          causation_id: "cause-2",
          timestamp: 987654,
          sequence: 5,
        },
      },
    });

    const decoded = deserializeEvent(raw);

    expect(decoded.getDiscriminator()).toBe(catAdopted.discriminator);
    expect(decoded.getMetadata()?.eventId).toBe("event-2");
    expect(decoded.getEntity().scope).toBe(Scope.Global);
  });
});
