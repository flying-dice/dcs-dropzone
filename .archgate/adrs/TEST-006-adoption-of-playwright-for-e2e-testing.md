---
id: TEST-006
title: Adoption of Playwright for End-to-End Testing
domain: testing
rules: false
---

## Context

The project needs automated end-to-end tests that verify user-facing behaviour across the webapp and daemon. Manual testing does not scale, and without E2E coverage regressions reach production undetected.

E2E test suites are notoriously brittle. Tests that depend on CSS selectors, DOM structure, hard-coded waits, or shared mutable data break on cosmetic changes, race against the UI, and contaminate each other when run in parallel. A fragile suite erodes trust — developers ignore failures and skip writing new tests.

We need an E2E testing framework and a set of conventions that produce fast, stable, isolated tests resistant to UI refactors.

## Decision

We will adopt **Playwright** as the E2E testing framework for this project. Tests are organised by target service (`tests/webapp/`, `tests/daemon/`) with separate Playwright projects for each, configured in `playwright.config.js`. Test files use the `.spec-pw.ts` suffix.

Element selection uses `data-testid` attributes via `page.getByTestId()` as the primary locator strategy. Test ID values are defined as shared constants in `@packages/testids` and imported by both components and tests. For list elements, test ID constants are factory functions that embed the React `key`.

## Do's and Don'ts

### Do

- **Do** call `page.getByTestId()` directly for every interaction and assertion — do not store locators in variables. Each line should read as a self-contained action.
  ```ts
  // Good — inline getByTestId for every call
  await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
  await expect(page.getByTestId(MY_MODS_BUTTON_TEST_ID)).toBeVisible();

  // Bad — storing locators in variables
  const loginBtn = page.getByTestId(LOGIN_BUTTON_TEST_ID);
  await loginBtn.click();
  ```
- **Do** define all test ID values as named constants in `@packages/testids` and import them in both components and tests. Never use inline string literals for test IDs.
  ```ts
  // @packages/testids
  export const LOGIN_BUTTON_TEST_ID = "__LOGIN_BUTTON_TEST_ID";

  // Component
  <button data-testid={LOGIN_BUTTON_TEST_ID}>Login</button>

  // Test
  import { LOGIN_BUTTON_TEST_ID } from "../../@packages/testids";
  await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
  ```
- **Do** use the `__SCREAMING_SNAKE_CASE_TEST_ID` naming convention for constant values — the double-underscore prefix and `_TEST_ID` suffix make them instantly identifiable in source and DOM.
- **Do** embed the React `key` used for list items into the `data-testid`. For list/array elements, define test ID constants as factory functions that accept the key and produce a unique test ID. The key used in `data-testid` must be the same value used as the React `key` prop.
  ```ts
  // @packages/testids
  export const MOD_CARD_TEST_ID = (key: string) => `__MOD_CARD_TEST_ID-${key}`;
  export const MOD_CARD_DOWNLOAD_BTN_TEST_ID = (key: string) => `__MOD_CARD_DOWNLOAD_BTN_TEST_ID-${key}`;

  // Component
  {mods.map((mod) => (
    <div key={mod.id} data-testid={MOD_CARD_TEST_ID(mod.id)}>
      <button data-testid={MOD_CARD_DOWNLOAD_BTN_TEST_ID(mod.id)}>Download</button>
    </div>
  ))}

  // Test
  await page.getByTestId(MOD_CARD_TEST_ID("fa-18c-liveries")).click();
  ```
- **Do** validate that expected page structure is present before interacting with elements. Assert visibility of key components first, then perform actions. This catches rendering failures early and produces clearer error messages than a timeout on a missing button mid-flow.
  ```ts
  // Good — verify structure, then interact
  await expect(page.getByTestId(HEADER_LOGO_TEST_ID)).toBeVisible();
  await expect(page.getByTestId(LOGIN_BUTTON_TEST_ID)).toBeVisible();
  await expect(page.getByTestId(DISCOVER_BUTTON_TEST_ID)).toBeVisible();

  await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
  ```
- **Do** accept `data-testid` as a prop name in custom components and drill it through to the root element. Never invent alternative prop names like `testId`, `testID`, `tid`, or `data-test`.
  ```tsx
  // Good — drill data-testid through as-is
  function ModCard({ "data-testid": testId, mod }: ModCardProps & { "data-testid"?: string }) {
    return <div data-testid={testId}>{mod.name}</div>;
  }

  <ModCard data-testid={MOD_CARD_TEST_ID} mod={mod} />

  // Bad — inventing a custom prop name
  function ModCard({ testId, mod }: { testId?: string; mod: Mod }) {
    return <div data-testid={testId}>{mod.name}</div>;
  }
  ```
- **Do** add a `data-testid` to any element that a Playwright test needs to locate or assert against.
- **Do** extract entity IDs and dynamic values from DOM attributes rather than parsing URLs, cookies, or other indirect sources. Components should encode entity IDs as custom attributes (e.g., `mod-id={props.mod.id}`) on elements that already have a `data-testid`, so tests can read them with `getAttribute()`. This keeps tests coupled to the component contract, not to routing or application state.
  ```ts
  // Good — reads the ID from the DOM
  const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");

  // Bad — parses the ID from the URL (couples test to routing structure)
  const modId = page.url().split("/user-mods/")[1];
  ```
- **Do** use a guarded assertion when extracting values from the DOM for use later in the test. `getAttribute()` returns `string | null` — assert the value is non-null immediately so TypeScript narrows the type and the test fails early with a clear message if the attribute is missing.
  ```ts
  // Good — narrowed to string, later usage is type-safe
  const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");
  if (!modId) throw new Error("mod-id attribute not found on form");
  await page.getByTestId(MOD_CARD_TEST_ID(modId)).toBeVisible();

  // Bad — null sneaks through, fails later with a confusing error
  const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");
  await page.getByTestId(MOD_CARD_TEST_ID(modId!)).toBeVisible();
  ```
- **Do** generate fresh test data for each test to avoid cross-contamination when tests run in parallel. Never rely on pre-existing or shared data — each test must be self-contained and isolated.
  ```ts
  // Good — unique data per test
  test("user can publish a mod", async ({ page }) => {
    const modName = `test-mod-${crypto.randomUUID()}`;
    // create mod with unique name, assert against it
  });

  // Bad — shared fixture that another parallel test could mutate
  const MOD_NAME = "my-test-mod";
  ```
- **Do** use web-first assertions (`expect(locator)`) — they auto-retry until the condition is met or the timeout expires. Never snapshot a value with `await locator.textContent()` and assert on the snapshot — this races against the UI.
  ```ts
  // Good — web-first, auto-retries
  await expect(page.getByTestId(MOD_CARD_TEST_ID("abc"))).toContainText("Published");

  // Bad — snapshots once, may race
  const text = await page.getByTestId(MOD_CARD_TEST_ID("abc")).textContent();
  expect(text).toContain("Published");
  ```
- **Do** use `toContainText` over `toHaveText` for partial matching — this is more resilient to minor copy changes and surrounding whitespace.
- **Do** assert on user-visible outcomes (text content, visibility, navigation) rather than implementation details (DOM attributes, internal state, class names).
- **Do** lean on Playwright's built-in auto-wait — actions like `click`, `fill`, and `check` already wait for the element to be actionable. Do not add redundant waits before actions.
- **Do** use `page.waitForURL()` after navigation rather than arbitrary waits or timeouts.
  ```ts
  // Good
  await page.getByTestId(DISCOVER_BUTTON_TEST_ID).click();
  await page.waitForURL("**/discover");

  // Bad
  await page.getByTestId(DISCOVER_BUTTON_TEST_ID).click();
  await page.waitForTimeout(2000);
  ```
- **Do** prefer `getByRole` or `getByText` for generic, non-entity-specific interactions (e.g., a single "Submit" button) where accessibility semantics provide a stable selector — `data-testid` is not required when a role or label is naturally unique.

### Don't

- **Don't** use magic strings — never pass a raw string literal to `getByTestId()`. Always reference a constant from `@packages/testids`.
  ```ts
  // Bad — magic string
  await page.getByTestId("__LOGIN_BUTTON_TEST_ID").click();

  // Good — imported constant
  await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
  ```
- **Don't** store locators in variables — call `page.getByTestId()` inline for every interaction. Variables obscure which element is being acted on and break the one-action-per-line readability.
- **Don't** locate elements by CSS class, tag name, or DOM position in Playwright tests — these couple tests to styling and structure.
- **Don't** use generic `data-testid` values (e.g., `"card"`, `"button"`) that are ambiguous when the component is rendered in a list.
- **Don't** use `.first()`, `.nth()`, or index-based selection to disambiguate — embed the entity ID instead.
- **Don't** add `data-testid` to elements that no test references — keep the DOM clean.
- **Don't** use `page.waitForTimeout()` — it is always either too slow or a race condition. Use auto-wait, `waitForURL()`, or web-first assertions instead.
- **Don't** use `page.$eval()`, `page.evaluate()`, or `locator.evaluate()` for assertions — these bypass Playwright's auto-retry and snapshot a single moment in time.
- **Don't** chain deep DOM structure locators like `page.locator('.a').locator('.b').locator('.c')` — one refactor breaks the chain. Use a single `getByTestId()` on the target element.
- **Don't** assert on exact list counts when the underlying data is dynamic — assert on the presence of specific expected items by their test ID instead.

## Consequences

### Positive

- **Stable Tests:** Tests are decoupled from CSS classes, DOM hierarchy, and component library internals. UI refactors no longer break the test suite.
- **Unique Selectors:** Embedding entity IDs guarantees that each locator resolves to exactly one element, eliminating flakiness from ambiguous matches.
- **Readable Tests:** `getByTestId(LOGIN_BUTTON_TEST_ID)` clearly communicates intent compared to `locator(".card:nth-child(3) .btn-primary")`.
- **Grepability:** A developer can search the codebase for a test ID constant to instantly find both the component that renders it and the tests that reference it.
- **Parallel-Safe:** Fresh data per test and no shared mutable state means tests can run in parallel without cross-contamination.
- **Auto-Wait:** Playwright's built-in auto-wait and web-first assertions eliminate manual timing hacks and reduce flakiness.

### Negative

- **Component Awareness of Tests:** Components must accept and forward `data-testid` attributes, which is a minor test concern leaking into production code.
- **Constant Overhead:** Every testable element requires a constant in `@packages/testids` and an import in both the component and the test.

### Risks

- **Inconsistent Adoption:** If only some components follow this pattern, tests will mix locator strategies, reducing the value of the convention. Enforce via code review until coverage is complete.
- **Stale Constants:** Test ID constants that no longer match rendered elements will cause silent test failures. Remove constants when the component that uses them is deleted.

## Compliance and Enforcement

- All E2E tests use Playwright with the `.spec-pw.ts` suffix and live under `tests/`.
- New Playwright tests must use `getByTestId()` with imported constants as the primary locator — enforced during code review.
- `data-testid` values for list elements must use factory constants that embed the React `key` — enforced during code review.
- Test ID constants live in `@packages/testids` — no inline magic strings.
- Each test must generate its own data and not depend on shared state.
- Existing tests should be migrated opportunistically when modified.

## References

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright `getByTestId` API](https://playwright.dev/docs/api/class-page#page-get-by-test-id)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles) — priority of selectors
