import { bench, describe, beforeAll } from "vitest";
import { createCat } from "../../tests/aggregates/cat";
import { catViewed } from "../../tests/events/cat-viewed";
import { catRenamed } from "../../tests/events/cat-renamed";
import { registerEvent } from "../../src/domain-event";

describe("Aggregate hotpaths", () => {
  beforeAll(() => {
    registerEvent(catRenamed);
    registerEvent(catViewed);
  });

  bench("raise event hotpath", () => {
    const cat = createCat("bench-cat-raise");
    cat.rename("Whiskers");
  });

  bench("audit event hotpath", () => {
    const cat = createCat("bench-cat-audit");
    cat.view();
  });
});
