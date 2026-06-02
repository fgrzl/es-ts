# es-ts

A TypeScript port of the `fgrzl/es` event sourcing library.

## Overview

`es-ts` is a small, strongly typed event sourcing core for TypeScript.

Key features:

- typed domain event descriptors and polymorphic serialization
- aggregate event wiring with `raise()` and `audit()` support
- metadata stamping with correlation, causation, sequence, and timestamp
- in-memory store and repository semantics for load/save workflows
- `Scope`-aware entity identities for global and tenant aggregates

## Getting Started

Install dependencies with npm:

```bash
cd es-ts
npm ci
```

Build a package:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

Run benchmarks:

```bash
npm run bench
```

Format the code:

```bash
npm run fmt
```

Lint the code:

```bash
npm run lint
```

Run a local dev server:

```bash
npm run dev
```

## Documentation

- [`docs/getting-started.md`](./docs/getting-started.md)
- [`docs/api-reference.md`](./docs/api-reference.md)

## License

`es-ts` is licensed under the Apache License 2.0. See the repository `LICENSE` file for details.
