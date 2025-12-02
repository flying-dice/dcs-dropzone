# Command–Query Pattern in the App Server

This document explains how the server-side code under `src/app/server` uses the command–query pattern instead of a large "service" layer. The goal is to make each operation explicit, composable, and testable.

## Why commands and queries?
- Commands perform state changes (create/update/delete). They must be explicit about side effects and validations.
- Queries read data and return DTOs. They must be side‑effect-free and cache‑friendly.

This separation avoids service classes that simply orchestrate between the HTTP createMod and the ORM.

## Folder layout
We adopt one-folder-per-operation.
```
src/app/server/
  commands/
    CreateMod/
      CreateMod.ts        # the command implementation (pure function)
      types.ts          # Params/Result types (and error types if needed)
      createMod.test.ts   # tests for the command (optional)
      index.ts          # re-exports for concise imports (optional)
    UpdateRelease/
      CreateMod.ts
      contract.ts
      CreateMod.test.ts
    ...
  queries/
    FindUserModById/
      CreateMod.ts        # the query implementation (no side-effects)
      types.ts          # Params/Result types
      createMod.test.ts
      index.ts
    GetAllTags/
      CreateMod.ts
      contract.ts
  entities/             # persistence models
  schemas/              # shared DTOs (domain-level) if needed
  middleware/           # cross-cutting (auth, logging)
  services/             # narrowly-scoped helpers where needed
```

## Design principles
- Single operation per folder. The folder contains a `CreateMod.ts` (logic) and `types.ts` (Params/Result). Optionally `index.ts` re-exports typed `execute`.
- Pure inputs/outputs. Inputs and outputs are described using `types.ts`; validate at the edges (API) with Zod as needed.
- No hidden state. Dependencies should be passed in via parameters where needed.
- Logging at boundaries. Each command/query logs `start` and success/failure with enough context for tracing.
- Errors as data. Prefer `neverthrow` `Result<T, E>` or thrown domain errors that are handled at the API layer.
- Tests near code. Each command/query may have a sibling `createMod.test.ts`.

## Commands
- Do: authorization checks, input validation, idempotency safeguards, write to DB, emit events/metrics.
- Don’t: return partially saved data; either succeed and return the final DTO or surface a domain error.

Example: `commands/CreateMod/`
- `types.ts` exports `Command/Params` and `Result` types.
- `createMod.ts` exports `execute(params: Params): Promise<Result>`; API layer should Zod-validate inbound requests before calling execute.
- Keep side-effects inside the command and return the final DTO.

## Queries
- Do: filtering, paging, projections to DTOs.
- Don’t: mutate state.

Shape:
- `queries/FindUserModById/types.ts` defines `Params` and `Result` (often `neverthrow`-wrapped for NotFound).
- `queries/FindUserModById/createMod.ts` implements the read and returns the typed `Result`.

Example: `queries/FindUserModById/`
- Authorizes by `maintainers: user.id` criterion.
- Returns a `Result<ModData, "NotFound">`.

## Validation and DTOs
- Prefer co-located `types.ts` per operation for request/response shapes.
- Use shared `schemas/` (Zod) for parsing/validating DTOs at the API boundary; commands/queries consume typed data.

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
  1) Validate/parse inputs using Zod DTOs in `schemas/` (or an operation-specific validator if present).
  2) Call `execute` from the operation's `createMod.ts` (or its `index.ts` re-export) with typed `types.ts` Params.
  3) Map `Result` or DTO to HTTP.
- Avoid putting business logic inside API handlers.

## Testing guidance
- Prefer tests that exercise the operation end‑to‑end at the module boundary.
- Place tests next to the operation: `commands/VerbNoun/createMod.test.ts`, `queries/VerbNoun/createMod.test.ts`.
- Assertions focus on:
  - Correct DTOs returned (or `Result` values)
  - Correct authorization/filtering
  - DB effects for commands (use an in‑memory DB like MongoMemoryServer or a stubbed repo)

## Conventions summary
- One operation per folder (VerbNoun/).
- Files: `createMod.ts`, `types.ts`, optional `index.ts`, and `createMod.test.ts`.
- Clear naming: `commands/CreateMod`, `queries/FindUserModById`.
- Zod at edges (API layer), `Result` for expected absence.
- No shared mutable state; inject dependencies.
- Keep HTTP handlers thin; keep logic in commands/queries.
