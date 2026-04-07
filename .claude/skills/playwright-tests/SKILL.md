---
name: playwright-tests
description: Write and debug Playwright E2E tests following project ADR TEST-006 conventions.
allowed-tools: Bash(playwright-cli:*) Bash(bunx:*) Bash(bun:*) mcp__playwright__*
---

# Writing Playwright E2E Tests

This skill covers writing, exploring, and debugging Playwright end-to-end tests for this project. It enforces the conventions defined in ADR TEST-006 (`/.archgate/adrs/TEST-006-adoption-of-playwright-for-e2e-testing.md`).

## Setup (one-time per machine)

### 1. Install Playwright browsers — Chrome only

This project standardises on **Chrome** for both `playwright-cli` exploration and the Playwright MCP browser tools (`mcp__playwright__browser_*`). Both expect Chrome at `/opt/google/chrome/chrome` on Linux. Do not substitute Chromium or Firefox — they each have subtle rendering and font differences that diverge from CI.

Install Chrome via Playwright (requires sudo for the OS-level dependencies):

```bash
sudo bunx playwright install chrome --with-deps
```

If `sudo bunx` errors with `command not found` (because sudo resets `PATH` and drops `~/.bun/bin`), use the absolute path to `bunx`:

```bash
sudo "$(which bunx)" playwright install chrome --with-deps
```

Verify the binary landed where Playwright expects it:

```bash
ls -la /opt/google/chrome/chrome
```

### 2. Install the project's Playwright dependency

Playwright is a workspace dev dependency — `bun install` at the repo root pulls it in. You should not need to install it separately.

### 3. Verify

```bash
playwright-cli open https://www.google.com
```

A Chrome window (or headless session) should open and report a successful navigation. If you see `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`, repeat step 1.

## Exploration tools

You have **two** tools for interactively driving the browser, and both back onto the same Chrome install from setup. Pick whichever fits the moment:

| Tool | When to use |
|------|-------------|
| **`playwright-cli`** (terminal binary) | Quick one-off navigation, snapshot, click, eval. Best when you're already in a shell and want to script several steps. |
| **Playwright MCP** (`mcp__playwright__browser_*` tools) | Interactive exploration where you want to see structured results in the conversation, take screenshots, or chain many steps without leaving tool-call mode. |

Both follow the same exploration discipline (see "Explore First, Code Second" below).

## Explore First, Code Second

Before writing any test, **use the browser to explore the UI as a user would**.

Quick `playwright-cli` example:

```bash
playwright-cli open http://localhost:4000
playwright-cli snapshot
playwright-cli click e3
playwright-cli snapshot
```

The Playwright MCP equivalents (`browser_navigate`, `browser_snapshot`, `browser_click`, etc.) work the same way and return structured results inline.

### The workflow

1. **Open the app** and navigate to the page or flow you need to test.
2. **Take snapshots** to understand what elements are on the page, what text they show, and how the UI is structured.
3. **Interact as a user** — click buttons, fill forms, navigate between pages. Understand the happy path and edge cases.
4. **Inspect `data-testid` attributes** — check whether the elements you need to target already have test IDs:
   ```bash
   playwright-cli eval "el => el.getAttribute('data-testid')" e5
   ```
5. **If test IDs are missing**, go to the component source and add them using constants from `@packages/testids` before writing the test. Do not write a test that relies on CSS or DOM selectors when a test ID can be introduced instead.
6. **Then write the test** — you now know exactly what the UI looks like, what elements to target, and what assertions to make.

## Project structure

- Config: `playwright.config.js`
- Constants: `@packages/testids`
- Tests: `tests/webapp/*.spec-pw.ts` and `tests/daemon/*.spec-pw.ts`
- Test suffix: `.spec-pw.ts`

## Absolute rules

### Never use CSS or DOM selectors

**Do not use CSS selectors, tag names, class names, or DOM position to locate elements.** If an element does not have a `data-testid`, add one to the component source code first. The only exceptions are `getByRole` and `getByText` for naturally unique, non-entity-specific elements (e.g., a single "Submit" button).

```ts
// FORBIDDEN — never do this
await page.locator('.card-header button.download').click();
await page.locator('#mod-list > div:nth-child(2)').click();
await page.locator('[class*="submit"]').click();

// REQUIRED — use getByTestId with imported constants
await page.getByTestId(DOWNLOAD_BTN_TEST_ID).click();

// ACCEPTABLE — getByRole for naturally unique elements
await page.getByRole('button', { name: 'Submit' }).click();
```

If you find yourself reaching for a CSS selector, **stop and add a `data-testid` to the component first**.

### Use constants, never magic strings

All test IDs are defined in `@packages/testids`. Import them in both the component and the test. Never pass a raw string to `getByTestId()`.

```ts
// BAD
await page.getByTestId('__LOGIN_BUTTON_TEST_ID').click();

// GOOD
import { LOGIN_BUTTON_TEST_ID } from '@packages/testids';
await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
```

### Use factory functions for list items

For elements rendered in a list, define test ID constants as factory functions that embed the React `key`:

```ts
// @packages/testids
export const MOD_CARD_TEST_ID = (key: string) => `__MOD_CARD_TEST_ID-${key}`;

// Test
await page.getByTestId(MOD_CARD_TEST_ID('fa-18c-liveries')).click();
```

### Inline getByTestId — do not store locators in variables

```ts
// BAD
const btn = page.getByTestId(LOGIN_BUTTON_TEST_ID);
await btn.click();

// GOOD
await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
```

### Validate structure before interacting

Assert visibility of key elements before performing actions:

```ts
await expect(page.getByTestId(HEADER_LOGO_TEST_ID)).toBeVisible();
await expect(page.getByTestId(LOGIN_BUTTON_TEST_ID)).toBeVisible();
await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
```

### Extract entity IDs from DOM attributes, not URLs

When a test needs a dynamic value (entity ID, slug, etc.) produced by a prior action, read it from a DOM attribute on an element with a `data-testid` — not from the URL, cookies, or other indirect sources. Components should encode IDs as custom attributes (e.g., `mod-id={props.mod.id}`) so tests stay coupled to the component contract, not routing.

```ts
// GOOD — reads from DOM
const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");

// BAD — parses from URL (breaks if route structure changes)
const modId = page.url().split("/user-mods/")[1];
```

### Guard DOM-extracted values with a type-narrowing assertion

When you call `getAttribute()` to extract a value for use later in the test, immediately assert it is non-null. This narrows the TypeScript type from `string | null` to `string` and fails early with a clear message.

```ts
// GOOD — narrowed, type-safe downstream
const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");
if (!modId) throw new Error("mod-id attribute not found on form");

// BAD — non-null assertion, no runtime safety
const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");
await page.getByTestId(MOD_CARD_TEST_ID(modId!)).toBeVisible();
```

### Test isolation

Each test generates its own data. Never rely on shared or pre-existing state.

```ts
test('user can publish a mod', async ({ page }) => {
  const modName = `test-mod-${crypto.randomUUID()}`;
  // ...
});
```

### Use web-first assertions

```ts
// GOOD — auto-retries
await expect(page.getByTestId(MOD_CARD_TEST_ID('abc'))).toContainText('Published');

// BAD — snapshots once, races
const text = await page.getByTestId(MOD_CARD_TEST_ID('abc')).textContent();
expect(text).toContain('Published');
```

### No waitForTimeout

Use `waitForURL()`, auto-wait, or web-first assertions. Never `page.waitForTimeout()`.

### Prefer toContainText over toHaveText

More resilient to minor copy changes and whitespace.

## Adding test IDs to components

When a component needs a new `data-testid`:

1. Add the constant to `@packages/testids` using `__SCREAMING_SNAKE_CASE_TEST_ID` format.
2. Import and apply it in the component: `<button data-testid={MY_BUTTON_TEST_ID}>`.
3. For custom components, accept `data-testid` as a prop name (not `testId` or `tid`) and drill it to the root element.
4. Only add `data-testid` to elements that a test actually needs — keep the DOM clean.

## Running tests

```bash
# Run all tests
PLAYWRIGHT_HTML_OPEN=never bunx playwright test

# Run a specific test file
PLAYWRIGHT_HTML_OPEN=never bunx playwright test tests/webapp/UI_WebappLanding.spec-pw.ts

# Run a specific project
PLAYWRIGHT_HTML_OPEN=never bunx playwright test --project=webapp

# Debug a failing test
PLAYWRIGHT_HTML_OPEN=never bunx playwright test --debug=cli
```

## Debugging with playwright-cli

```bash
# Run the failing test in debug mode (background)
PLAYWRIGHT_HTML_OPEN=never bunx playwright test tests/webapp/UI_WebappLanding.spec-pw.ts --debug=cli

# Attach to the paused session
playwright-cli attach tw-abcdef

# Explore the page state
playwright-cli snapshot
playwright-cli eval "el => el.getAttribute('data-testid')" e5
```

## Checklist before finishing a test

- [ ] Explored the UI interactively first (playwright-cli or MCP)
- [ ] All targeted elements have `data-testid` attributes with constants from `@packages/testids`
- [ ] No CSS selectors, class names, tag names, or DOM position selectors used
- [ ] No magic strings passed to `getByTestId()`
- [ ] No locators stored in variables — all `getByTestId()` calls are inline
- [ ] No `waitForTimeout()` calls
- [ ] All assertions use web-first `expect(locator)` pattern
- [ ] Test generates its own data and does not depend on shared state
- [ ] Test file uses `.spec-pw.ts` suffix and lives under `tests/webapp/` or `tests/daemon/`
