# Command–Query Pattern in the Webapp Server

This document explains how the server-side code under `apps/webapp/src/server/hono` uses the command–query pattern instead of a large service layer. Each operation is explicit, composable, and testable.

**Note:** This pattern is used in the **webapp** application (`apps/webapp`). The daemon service (`apps/daemon`) uses a different architecture based on the **Ports & Adapters** pattern focused on queue management and system operations. See [Daemon Architecture](./daemon-architecture.md) for details.

## Why commands and queries?
- Commands perform state changes (create/save/delete). They must be explicit about side effects and validations.
- Queries read data and return DTOs. They must be side‑effect‑free and cache‑friendly.

This separation avoids “god” services that just proxy between HTTP and the ORM.

## Layout (single-file per operation)
We use one file per operation (no per-operation folders):
```
apps/webapp/src/server/
  commands/
    CreateMod.ts
    UpdateMod.ts
    DeleteMod.ts
    CreateRelease.ts
    UpdateRelease.ts
    DeleteRelease.ts
    HandleAuthResult.ts
    MigrateLegacyRegistry.ts
    RegisterModReleaseDownload.ts
  queries/
    FindUserModById.ts
    FindUserModReleases.ts
    FindUserModReleaseById.ts
    FindAllUserMods.ts
    FindPublicModReleases.ts
    FindPublicModReleaseById.ts
    GetAllPublishedMods.ts
    GetAllFeaturedMods.ts
    GetAllTags.ts
    GetCategoryCounts.ts
    GetPublicModById.ts
    FindUpdateInformationByIds.ts
  entities/
  schemas/
  middleware/
  services/
```

## Command shape
- Single default export: `export default async function (command: Command): Promise<ResultOrDto>`
- Inline types at the top of the file:
  - `export type <Name>Command = { /* params */ }`
  - `export type <Name>Result = Result<DTO, ErrorString>` or a DTO type
- Prefer `neverthrow` `Result<T, E>` for expected domain errors. Use concrete error strings, e.g. `"ModNotFound"`, `"ReleaseNotFound"`.
- Perform authorization inside the command (e.g., owner checks with `maintainers: user.id`).
- Validate payloads with Zod schemas from `schemas/` when constructing or updating records.
- Keep logging minimal; only log meaningful boundaries.

Example (abbreviated):
```
// apps/webapp/src/server/commands/UpdateMod.ts
export type UpdateModCommand = { user: UserData; modId: string; updateData: typeof ModUpdateData._type };
export type UpdateModResult = Result<void, "ModNotFound">;
export default async function (cmd: UpdateModCommand): Promise<UpdateModResult> { /* ... */ }
```

## Query shape
- Single default export: `export default async function (query: Query): Promise<ResultOrDto>`
- Inline `Query` / `Result` types at the top of the file, or reuse shared DTOs from `schemas/`.
- Queries must not mutate state.

## API integration
- API handlers import the operation directly, e.g. `import createRelease from "../commands/CreateRelease.ts"`.
- Validate route params/body with Zod (`schemas/`), then call the command/query.
- Map `Result` or DTO to HTTP status codes.

## Error strings used today
- Commands that operate on mods/releases return specific errors (when using `Result`):
  - `"ModNotFound"`
  - `"ReleaseNotFound"`

## Testing guidance
- Place tests next to the file using the `<Name>.test.ts` convention (same folder as the operation).
- The webapp uses Mongoose (MongoDB) for data persistence. Use MongoMemoryServer in tests that require MongoDB access to provide isolated test environments.
- Prefer local doubles over mocks for any auxiliary behavior; plain objects over Maps in tests.

## Conventions summary
- One file per operation; inline `Command`/`Result` types at the top.
- Prefer `neverthrow` `Result<T, E>` for expected domain errors with concrete error strings.
- Zod at edges (API layer) and when creating/updating documents inside commands.
- Keep HTTP handlers thin; put business logic in commands/queries.
- Minimal, purposeful logging.
