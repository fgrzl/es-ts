# Getting Started with `es-ts`

`es-ts` is a lightweight TypeScript port of the `fgrzl/es` event sourcing library. It provides typed domain events, aggregate wiring, audit support, and a simple repository/store contract.

## Install

Use `npm ci` to install dependencies deterministically.

```bash
cd es-ts
npm ci
```

## Build

Build a distributable package with Vite+:

```bash
npm run build
```

## Run tests

```bash
npm run test
```

## Define an event

Create typed event descriptors with `defineEvent`.

```ts
import { defineEvent } from "./src/domain-event";

export interface CatRenamed {
  name: string;
}

export const catRenamed = defineEvent<{ name: string }, CatRenamed>("cat.renamed", "cats");
```

## Create an aggregate

Use `newAggregate` and register handlers for typed events.

```ts
import { newAggregate } from "./src/aggregate";
import { catRenamed } from "./events/cat-renamed";

const aggregate = newAggregate("cats", "cat-1");
aggregate.registerHandler(catRenamed, (event) => {
  console.log("cat renamed to", event.name);
});
```

## Serialize polymorphic events

Register event descriptors and serialize/deserialize by discriminator.

```ts
import { registerEvent, serializeEvent, deserializeEvent } from "./src/domain-event";
import { catRenamed } from "./events/cat-renamed";

registerEvent(catRenamed);

const event = catRenamed.create({ name: "Whiskers" });
const json = serializeEvent(event);
const decoded = deserializeEvent(json);
```

## Read the docs

- See `docs/api-reference.md` for the full public API.
