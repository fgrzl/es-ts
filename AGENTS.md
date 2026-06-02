# Repository Conventions for `es-ts`

## Preferred style

- Prefer strongly typed contracts.
  - Use explicit TypeScript interfaces and type parameters.
  - Prefer `unknown` over `any` when accepting external or untyped values.
  - Avoid ad-hoc `any` casts unless there is no cleaner typed alternative.
- Prefer functions over classes.
  - Build behaviors with plain functions and factory functions.
  - Use data-first design and immutable/functional patterns where practical.
  - Avoid class-heavy APIs unless the domain strongly benefits from instance inheritance.
  - The only common exception is small `Error` subclasses used for typed runtime error checks.
- Prefer plain data shapes and small helper utilities.
  - Event and metadata models should remain simple objects.
  - Keep serializers, converters, and test fixtures as plain functions.

## Test conventions

- Test names should follow the pattern:
  - `should <expected outcome> given <context> when <action>`
- Each `it(...)` block should verify a single behavior.
  - One behavior means one outcome, one set of preconditions, and one action.
  - If a scenario requires multiple assertions, keep them tightly related to the same behavior.
- Use `describe(...)` to group related domain behavior, not to express the entire story.
- Write tests as executable documentation.
  - Prefer clear, explicit setup.
  - Avoid deep object access or implicit state hidden outside the test.
  - Keep tests readable and easy to scan.

## Serialization and event model conventions

- Register polymorphic event descriptors explicitly.
- Preserve compatibility with external JSON contracts.
  - Use exact field names and shapes required by cross-language consumers.
  - Convert metadata fields between internal and external forms in a dedicated layer.
- Keep event construction, metadata stamping, and JSON conversion separate.

## Practical guidance

- Favor `export function` and `export interface` over `export class` where possible.
- Keep source files small and focused on a single responsibility.
- For new tests, follow the naming convention and keep each test focused on one behavior.
- Document conventions in `AGENTS.md` and keep it current as the repo evolves.
