import { Aggregate, newAggregate } from "../../src/aggregate";
import { catRenamed } from "../events/cat-renamed";
import { catAdopted } from "../events/cat-adopted";
import { catViewed } from "../events/cat-viewed";

export interface CatAggregate {
  aggregate: Aggregate;
  rename(name: string): void;
  adopt(): void;
  view(): void;
}

export function createCat(id: string): CatAggregate {
  let name = "";
  let adopted = false;

  const aggregate = newAggregate("cats", id);

  aggregate.registerHandler(catRenamed, (event) => {
    name = event.name;
  });

  aggregate.registerHandler(catAdopted, () => {
    adopted = true;
  });

  return {
    aggregate,

    rename(newName: string) {
      if (!newName) {
        throw new Error("Name cannot be empty");
      }
      if (name === newName) {
        return;
      }
      aggregate.raise(catRenamed.create({ name: newName }));
    },

    adopt() {
      if (adopted) {
        return;
      }
      aggregate.raise(catAdopted.create({}));
    },

    view() {
      aggregate.audit(catViewed.create({}));
    },
  };
}
