# Command–Query Pattern in the App Server

This document explains how the server-side code under `src/app/server` uses the command–query pattern instead of a large "service" layer. The goal is to make each operation explicit, composable, and testable.

## Why commands and queries?
- Commands perform state changes (create/update/delete). They must be explicit about side effects and validations.
- Queries read data and return DTOs. They must be side‑effect-free and cache‑friendly.

This separation avoids service classes that simply orchestrate between the HTTP handler and the ORM.

## Folder layout
```
src/app/server/
  commands/   # write operations (side effects)
  queries/    # read operations (no side effects)
  entities/   # persistence models
  schemas/    # Zod DTOs for IO contracts
  middleware/ # cross-cutting (auth, logging)
  services/   # narrowly-scoped helpers where needed
```

## Design principles
- Single operation per file. Export one default function (the command/query) and its typed props.
- Pure inputs/outputs. Inputs and outputs are validated using Zod schemas (`schemas/`).
- No hidden state. Dependencies should be passed in via parameters where needed.
- Logging at boundaries. Each command/query logs `start` and success/failure with enough context for tracing.
- Errors as data. Prefer `neverthrow` `Result<T, E>` or thrown domain errors that are handled at the API layer.
- Tests near code. Each command/query may have a sibling `*.test.ts`.

## Commands
- Shape: `export type XCommand = { /* inputs */ }; export default async function (props: XCommand): Promise<OutDTO> { }`
- Do: authorization checks, input validation, idempotency safeguards, write to DB, emit events/metrics.
- Don’t: return partially-saved data; either succeed and return the final DTO or surface a domain error.

Example: `commands/CreateMod.ts`
- Validates inputs via `ModCreateData` and assembles a `ModData` DTO.
- Persists as a single unit and returns the validated DTO.

## Queries
- Shape: `export type XQuery = { /* inputs */ }; export default async function (props: XQuery): Promise<Result<DTO, E>> { }`
- Do: filtering, paging, projections to DTOs.
- Don’t: mutate state.

Example: `queries/FindUserModById.ts`
- Authorizes by `maintainers: user.id` criteria.
- Returns a `Result<ModData, "NotFound">`.

## Validation and DTOs
- All external IO (request JSON, DB reads) flows through Zod schemas under `schemas/` (e.g., `ModData`, `UserData`).
- Commands and Querieis typically return DTOs defined in `schemas/`.

## Error handling
- Known/Checked Exceptions are wrapped in a `Result` utilising the `neverthrow` library.
- Unknown/Unchecked Exceptions are handled using normal Typescript Throwables.

## Transactions
- For multi‑write commands, ensure atomicity (DB transaction or two‑phase update) and place the transaction logic inside the command file.

## Logging
- Use a per‑file logger category (e.g., `getLogger("CreateModCommand")`). Log `start`, important decision points, and `success` / `error`.

## When to use a small service
- If polymorphic behavior is needed, a service interface and implementations may be appropriate, but they would be used by commands/queries rather than directly by API handlers.
 
## API layer integration
- API handlers should:
  1) Validate/parse inputs.
  2) Call a command or query.
  3) Map `Result` or DTO to HTTP.
- Avoid putting business logic inside API handlers.

## Testing guidance
- Prefer Tests that span a useful slice, less focus on unit tests when testing the Mid Layer.
- Assertions focus on:
  - Correct DTOs returned (or `Result` values)
  - Correct authorization/filtering
  - The Database Layer operations execute as expected, should use MongoMemoryServer rather than mocking i.e.

```typescript
// See [CreateMod.test.ts](../src/app/server/commands/CreateMod.test.ts)
    beforeEach(async () => {
        const mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
    });
```

## Conventions summary
- One operation per file.
- Clear naming: `VerbNoun.ts` (CreateMod, UpdateRelease, FindUserModById).
- Zod at edges, `Result` for expected absence.
- No shared mutable state; inject dependencies.
- Keep HTTP handlers thin; keep logic in commands/queries.
