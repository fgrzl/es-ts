import { describe, expect, it } from "vitest";
import { createCat } from "./cat";
import { catRenamed } from "../events/cat-renamed";
import { catAdopted } from "../events/cat-adopted";
import { catViewed } from "../events/cat-viewed";
import { Scope } from "../../src/scope";
import type { CatRenamed } from "../events/cat-renamed";

describe("Cat aggregate", () => {
  it("should create an uncommitted renamed event given the cat is renamed", () => {
    const cat = createCat("cat-1");

    cat.rename("Whiskers");

    const events = cat.aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(cat.aggregate.getCommittedEvents()).toHaveLength(0);

    const event = events[0] as CatRenamed;
    expect(event.getDiscriminator()).toBe(catRenamed.discriminator);
    expect(event.name).toBe("Whiskers");
  });

  it("should create an uncommitted adopted event given the cat is adopted", () => {
    const cat = createCat("cat-2");

    cat.adopt();

    const events = cat.aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(cat.aggregate.getCommittedEvents()).toHaveLength(0);
    expect(events[0].getDiscriminator()).toBe(catAdopted.discriminator);
  });

  it("should stage audit events separately given a cat is viewed", () => {
    const cat = createCat("cat-3");

    cat.view();

    const audits = cat.aggregate.getPendingAudits();
    expect(audits).toHaveLength(1);
    expect(cat.aggregate.getUncommittedEvents()).toHaveLength(0);
    expect(audits[0].event.getDiscriminator()).toBe(catViewed.discriminator);
  });

  it("should reject an event given the wrong area when raise is called", () => {
    const cat = createCat("cat-3");

    expect(() => {
      cat.aggregate.raise({
        getDiscriminator: () => "dog.renamed",
        getAggregateID: () => "cat-3",
        getArea: () => "dogs",
        getTenantID: () => undefined,
        getCausationID: () => "",
        getCorrelationID: () => "",
        getEntity: () => ({ id: "cat-3", area: "dogs", scope: Scope.Global }),
        getEventID: () => "",
        getMetadata: () => undefined,
        getSequence: () => 0,
        getTimestamp: () => 0,
        setMetadata: () => undefined,
      });
    }).toThrow("Raise: aggregate area is not valid for event");
  });
});
