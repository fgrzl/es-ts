import { bench } from "vitest";
import { createContext } from "../../src/context";
import { newInMemoryEventStore } from "../../src/in-memory-store";
import { newRepository } from "../../src/repository";
import { createCat } from "../../tests/aggregates/cat";

bench("repository save hotpath", async () => {
  const store = newInMemoryEventStore();
  const repo = newRepository(store);
  const cat = createCat("repo-bench-save");

  cat.rename("Whiskers");
  await repo.save(createContext(), cat.aggregate);
});

bench("repository load hotpath", async () => {
  const store = newInMemoryEventStore();
  const repo = newRepository(store);
  const cat = createCat("repo-bench-load");

  cat.rename("Mittens");
  await repo.save(createContext(), cat.aggregate);

  const fresh = createCat("repo-bench-load");
  await repo.load(createContext(), fresh.aggregate);
});
