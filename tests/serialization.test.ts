import { beforeAll, describe, expect, it } from "vitest";
import { deserializeEvent, defineEvent, registerEvent, serializeEvent } from "../src/domain-event";
import { catAdopted, catRenamed, registerEvents } from "./events";
import { Scope } from "../src/scope";

const catUpdated = defineEvent<{ displayName: string; profile: { firstName: string } }>(
  "cats",
  "cat.updated",
);

describe("Polymorphic event serialization", () => {
  beforeAll(() => {
    registerEvents();
    registerEvent(catUpdated);
  });

  it("should serialize event payload keys as snake_case when JSON.stringify is called", () => {
    const event = catUpdated.create({ displayName: "Whiskers", profile: { firstName: "Tom" } });
    event.setMetadata({
      entity: { id: "cat-3", area: "cats", scope: Scope.Global },
      eventId: "event-3",
      correlationId: "corr-3",
      causationId: "cause-3",
      timestamp: 111111,
      sequence: 3,
    });

    const serialized = JSON.parse(JSON.stringify(event));

    expect(serialized.display_name).toBe("Whiskers");
    expect(serialized.profile.first_name).toBe("Tom");
    expect(serialized.metadata.event_id).toBe("event-3");
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

  it("should serialize polymorphic envelope payload keys as snake_case", () => {
    const event = catUpdated.create({ displayName: "Whiskers", profile: { firstName: "Tom" } });
    event.setMetadata({
      entity: { id: "cat-4", area: "cats", scope: Scope.Global },
      eventId: "event-4",
      correlationId: "corr-4",
      causationId: "cause-4",
      timestamp: 222222,
      sequence: 4,
    });

    const envelope = JSON.parse(serializeEvent(event));

    expect(envelope.content.display_name).toBe("Whiskers");
    expect(envelope.content.profile.first_name).toBe("Tom");
    expect(envelope.content.metadata.event_id).toBe("event-4");
  });

  it("should deserialize a snake_case payload into camelCase event properties", () => {
    const raw = JSON.stringify({
      $type: catUpdated.discriminator,
      content: {
        display_name: "Whiskers",
        profile: { first_name: "Tom" },
        metadata: {
          entity: {
            id: "cat-5",
            area: "cats",
            scope: Scope.Global,
          },
          event_id: "event-5",
          correlation_id: "corr-5",
          causation_id: "cause-5",
          timestamp: 333333,
          sequence: 5,
        },
      },
    });

    const decoded = deserializeEvent(raw);

    expect(decoded.getDiscriminator()).toBe(catUpdated.discriminator);
    expect((decoded as any).displayName).toBe("Whiskers");
    expect((decoded as any).profile.firstName).toBe("Tom");
    expect(decoded.getMetadata()?.eventId).toBe("event-5");
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
