import { describe, expect, it } from "vitest";
import { newAggregate, newTenantAggregate } from "../src/aggregate";
import { defineEvent } from "../src/domain-event";

describe("Aggregate", () => {
  it("should apply a raised event given a registered handler when raise is called", () => {
    const aggregate = newAggregate("tests", "aggregate-1");
    const eventDescriptor = defineEvent<{ value: string }>("tests", "aggregate.event");
    let applied = "";

    aggregate.registerHandler(eventDescriptor, (event) => {
      applied = event.value;
    });

    const event = eventDescriptor.create({ value: "hello" });
    aggregate.raise(event);

    expect(aggregate.getUncommittedEvents()).toHaveLength(1);
    expect(applied).toBe("hello");
  });

  it("should move uncommitted events to committed given commit is called", () => {
    const aggregate = newAggregate("tests", "aggregate-1");
    const eventDescriptor = defineEvent<{ value: string }>("tests", "aggregate.event");
    aggregate.registerHandler(eventDescriptor, () => undefined);
    const event = eventDescriptor.create({ value: "hello" });

    aggregate.raise(event);
    aggregate.commit();

    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    expect(aggregate.getCommittedEvents()).toHaveLength(1);
    expect(aggregate.getCommittedSequence()).toBe(1);
  });

  it("should load committed events and apply registered handlers given load is called", () => {
    const eventDescriptor = defineEvent<{ value: string }>("tests", "aggregate.load");
    const event = eventDescriptor.create({ value: "loaded" });
    event.setMetadata({
      entity: { id: "aggregate-2", area: "tests", scope: 0 },
      eventId: "event-load",
      correlationId: "corr-load",
      causationId: "cause-load",
      timestamp: 1,
      sequence: 1,
    });

    const aggregate = newAggregate("tests", "aggregate-2");
    let applied = "";
    aggregate.registerHandler(eventDescriptor, (event) => {
      applied = event.value;
    });

    aggregate.load([event]);

    expect(applied).toBe("loaded");
    expect(aggregate.getCommittedEvents()).toHaveLength(1);
  });

  it("should reject duplicate handler registration given the same descriptor", () => {
    const aggregate = newAggregate("tests", "aggregate-3");
    const eventDescriptor = defineEvent<{}>("tests", "aggregate.duplicate");

    aggregate.registerHandler(eventDescriptor, () => undefined);

    expect(() => {
      aggregate.registerHandler(eventDescriptor, () => undefined);
    }).toThrow("RegisterHandler: handler for event already exists");
  });

  it("should reject a raise event given the wrong area when raise is called", () => {
    const aggregate = newAggregate("tests", "aggregate-4");
    const wrongEvent = defineEvent<{}>("other", "aggregate.wrong");

    expect(() => aggregate.raise(wrongEvent.create({}))).toThrow(
      "Raise: aggregate area is not valid for event",
    );
  });

  it("should reject an audit event given the wrong area when audit is called", () => {
    const aggregate = newAggregate("tests", "aggregate-4");
    const wrongEvent = defineEvent<{}>("other", "aggregate.wrong");

    expect(() => aggregate.audit(wrongEvent.create({}))).toThrow(
      "Audit: aggregate area is not valid for event",
    );
  });

  it("should stage pending audits separately given audit is called", () => {
    const aggregate = newAggregate("tests", "aggregate-5");
    const auditDescriptor = defineEvent<{}>("tests", "aggregate.audit");
    const event = auditDescriptor.create({});

    aggregate.audit(event);

    expect(aggregate.getPendingAudits()).toHaveLength(1);
  });

  it("should clear pending audits given discardPendingAudits is called", () => {
    const aggregate = newAggregate("tests", "aggregate-5");
    const auditDescriptor = defineEvent<{}>("tests", "aggregate.audit");
    const event = auditDescriptor.create({});

    aggregate.audit(event);
    aggregate.discardPendingAudits();

    expect(aggregate.getPendingAudits()).toHaveLength(0);
  });

  it("should reject duplicate audit staging given the same event instance", () => {
    const aggregate = newAggregate("tests", "aggregate-6");
    const auditDescriptor = defineEvent<{}>("tests", "aggregate.audit.unique");
    const event = auditDescriptor.create({});

    aggregate.audit(event);

    expect(() => aggregate.audit(event)).toThrow(
      "Audit: event instance must not be staged more than once",
    );
  });

  it("should trim pending audits given trimPendingAudits is called", () => {
    const aggregate = newAggregate("tests", "aggregate-7");
    const a1 = defineEvent<{}>("tests", "aggregate.audit.a").create({});
    const a2 = defineEvent<{}>("tests", "aggregate.audit.b").create({});

    aggregate.audit(a1);
    aggregate.audit(a2);

    aggregate.trimPendingAudits(1);

    expect(aggregate.getPendingAudits()).toHaveLength(1);
  });

  it("should validate tenant aggregate creation arguments when newTenantAggregate is called", () => {
    expect(() => newTenantAggregate("tests", "", "aggregate-8")).toThrow(
      "newTenantAggregate: tenantId cannot be empty",
    );
  });
});
