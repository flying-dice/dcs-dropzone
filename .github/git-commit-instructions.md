## Git Commit Instructions (semantic-release)

* Use **Conventional Commits**:
  `type(scope): subject`
* **scope = exact `package.json` `"name"`** of the package changed (e.g. `@acme/api`).
* Subject: **imperative**, **≤72 chars**, **no period**.
* For anything non-trivial, include a short body with **Changes:** bullets (3–7).
* Breaking changes: add `!` and include `BREAKING CHANGE:` footer.

**Template**

```text
<type>(<pkg-name>): <subject>

Changes:
- <bullet>
- <bullet>
```

**Types**: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`
