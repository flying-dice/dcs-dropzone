# Contributing Guidelines

## Testing conventions
- Use local TestClasses (test doubles) instead of framework mocks. Keep them minimal, record state, and assert on that state.
- Prefer plain objects/arrays over `Map` in tests unless non-string keys or ordered maps are necessary.
- For factories returning concrete service classes, you may return a TestClass and cast at the boundary inside the test helper.

## Queue ownership and lifecycle
- ReleaseAssetService is responsible for:
  - Enqueueing download and extract jobs for a release
  - Cancelling both download and extract jobs when removing a release
  - Removing the release’s working folder
- Do not call queue `cancelJobsForRelease` from higher layers; call `ReleaseAssetService.removeReleaseAssetsAndFolder()` instead.

## Style
- Keep unit tests colocated with the source file (`.test.ts`)
- Keep integration/E2E tests in `tests/`
- Run `bun run tsc` and `bun run biome` before opening a PR