---
id: TEST-006
title: Data Test ID Strategy for Playwright E2E Tests
domain: testing
rules: false
---

# ADR: Data Test ID Strategy for Playwright E2E Tests

**Status:** Accepted
**Date:** April 5, 2026

## Context and Problem Statement

Playwright end-to-end tests that locate elements using CSS selectors, class names, or DOM structure are inherently fragile. A minor UI refactor — renaming a class, wrapping an element in a new container, or upgrading a component library — can break dozens of tests without any change in user-facing behaviour. This leads to:

- **High Maintenance Burden:** Tests break on cosmetic changes, consuming developer time on fixes that add no value.
- **False Negatives:** Broken selectors cause test failures unrelated to real regressions, eroding team trust in the suite.
- **Ambiguous Selectors:** Generic selectors like `.card` or `button:nth-child(2)` can match multiple elements on the page, producing flaky or incorrect assertions.

We need a stable, unambiguous element selection strategy that decouples tests from implementation details.

## Decision

We will use `data-testid` attributes as the primary element locator strategy in all Playwright E2E tests.

### Rules of Implementation

1. **Use `data-testid` for All Test Selectors:** Playwright tests must locate interactive or assertable elements via `data-testid`. Avoid CSS class selectors, XPath, or positional selectors (`nth-child`, `:first-of-type`, etc.).

2. **Embed Entity IDs to Guarantee Uniqueness:** When an element represents a specific domain entity (a mod, a release, a server), the `data-testid` must include the entity's concrete identifier. This ensures every element is uniquely addressable even when the page renders a list of similar items.

   ```tsx
   // Good — unique per entity
   <div data-testid={`mod-card-${mod.id}`}>
   <button data-testid={`download-btn-${release.id}`}>

   // Bad — ambiguous in a list
   <div data-testid="mod-card">
   <button data-testid="download-btn">
   ```

3. **Use Kebab-Case with a Component-Action-Entity Pattern:** Structure test IDs as `{component}-{element|action}-{entityId}` to make them self-describing and greppable.

   ```
   mod-card-abc123
   mod-card-download-btn-abc123
   release-row-v1.2.3
   server-status-badge-bravo-01
   ```

4. **Use `getByTestId` in Playwright:** Always use Playwright's built-in `page.getByTestId()` or `locator.getByTestId()` which targets `data-testid` by default. This keeps tests readable and consistent.

   ```ts
   // Good
   await page.getByTestId(`mod-card-${modId}`).click();

   // Bad
   await page.locator('[data-testid="mod-card"]').first().click();
   await page.locator('.mod-card').click();
   ```

5. **Strip `data-testid` in Production (Optional):** If bundle size or DOM cleanliness is a concern, use a Vite/Babel plugin to strip `data-testid` attributes from production builds. Test IDs exist for the test suite, not for end users.

## Do's and Don'ts

### Do

- **Do** add a `data-testid` to any element that a Playwright test needs to locate or assert against.
- **Do** embed the entity's real identifier (database ID, slug, version string) in the test ID so that each element on the page is uniquely addressable.
- **Do** use `page.getByTestId()` as the default locator in Playwright tests.
- **Do** use kebab-case and the `{component}-{element}-{entityId}` naming convention for consistency.
- **Do** prefer `getByRole` or `getByText` for generic, non-entity-specific interactions (e.g., a single "Submit" button) where accessibility semantics provide a stable selector — `data-testid` is not required when a role or label is naturally unique.

### Don't

- **Don't** locate elements by CSS class, tag name, or DOM position in Playwright tests — these couple tests to styling and structure.
- **Don't** use generic `data-testid` values (e.g., `"card"`, `"button"`) that are ambiguous when the component is rendered in a list.
- **Don't** use `.first()`, `.nth()`, or index-based selection to disambiguate — embed the entity ID instead.
- **Don't** add `data-testid` to elements that no test references — keep the DOM clean.

## Code Examples

### Component (React)

```tsx
function ModCard({ mod }: { mod: Mod }) {
  return (
    <div data-testid={`mod-card-${mod.id}`}>
      <h3>{mod.name}</h3>
      <button data-testid={`mod-card-download-btn-${mod.id}`}>
        Download
      </button>
    </div>
  );
}
```

### Playwright Test

```ts
test("downloads a specific mod", async ({ page }) => {
  const modId = "fa-18c-liveries";

  await page.goto("/mods");
  await page.getByTestId(`mod-card-${modId}`).waitFor();
  await page.getByTestId(`mod-card-download-btn-${modId}`).click();

  // Assert on the specific mod's state
  await expect(page.getByTestId(`mod-card-${modId}`)).toContainText("Downloading");
});
```

## Consequences

### Positive

- **Stable Tests:** Tests are decoupled from CSS classes, DOM hierarchy, and component library internals. UI refactors no longer break the test suite.
- **Unique Selectors:** Embedding entity IDs guarantees that each locator resolves to exactly one element, eliminating flakiness from ambiguous matches.
- **Readable Tests:** `getByTestId("mod-card-download-btn-fa-18c-liveries")` clearly communicates intent compared to `locator(".card:nth-child(3) .btn-primary")`.
- **Grepability:** A developer can search the codebase for a test ID string to instantly find both the component that renders it and the tests that reference it.

### Negative

- **Component Awareness of Tests:** Components must know about `data-testid` attributes, which is a minor test concern leaking into production code.
- **Prop Plumbing:** Entity IDs must be available at the component level to embed them in test IDs, which occasionally requires passing an extra prop.

### Risks

- **Inconsistent Adoption:** If only some components follow this pattern, tests will mix locator strategies, reducing the value of the convention. Enforce via code review until coverage is complete.

## Compliance and Enforcement

- New Playwright tests must use `getByTestId()` as the primary locator — enforced during code review.
- `data-testid` values for entity-bound elements must include the entity identifier — enforced during code review.
- Existing tests should be migrated opportunistically when modified.

## References

- [Playwright `getByTestId` API](https://playwright.dev/docs/api/class-page#page-get-by-test-id)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles) — priority of selectors
- [Playwright Best Practices — Use Locators](https://playwright.dev/docs/best-practices#use-locators)
