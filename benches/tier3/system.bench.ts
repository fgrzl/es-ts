import { bench } from "vitest";
import { createContext } from "../../src/context";
import { newInMemoryEventStore } from "../../src/in-memory-store";
import { newRepository } from "../../src/repository";
import { createCat } from "../../tests/aggregates/cat";

bench("system save/load roundtrip", async () => {
  const store = newInMemoryEventStore();
  const repo = newRepository(store);
  const cat = createCat("system-bench-1");

  cat.rename("Shadow");
  await repo.save(createContext(), cat.aggregate);

  const fresh = createCat("system-bench-1");
  await repo.load(createContext(), fresh.aggregate);
});

bench("system audit persistence", async () => {
  const store = newInMemoryEventStore();
  const repo = newRepository(store);
  const cat = createCat("system-bench-2");

  cat.view();
  await repo.save(createContext(), cat.aggregate);
});
