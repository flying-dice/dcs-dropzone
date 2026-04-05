---
id: ARC-001
title: Adoption of Archgate CLI for Architectural Governance
domain: general
rules: false
---

# Adoption of Archgate CLI for Architectural Governance

## Context

As the `dcs-dropzone` project scales, maintaining architectural consistency (such as strict layer boundaries, dependency rules, and naming conventions) relies heavily on manual code reviews. This approach is error-prone, scales poorly, and often leads to architectural drift over time.

We need a standardized way to document our architecture decisions (ADRs) alongside a mechanism to automatically enforce them, shifting architecture governance left into the developer's local workflow and our CI/CD pipeline.

## Decision

We will adopt the **Archgate CLI** as our primary tool for managing Architecture Decision Records (ADRs) and enforcing architectural boundaries as code.

Archgate will serve two main purposes:
1. Acting as the single source of truth for our standardized ADRs (stored in the repository).
2. Executing automated architectural rules via `.rules.ts` files to statically analyze our codebase and prevent structural regressions.

## Do's and Don'ts

### Do

- **Do** write a new ADR using Archgate for any significant structural, technical, or dependency-related decision.
- **Do** pair ADRs with automated `.rules.ts` files whenever a decision can be enforced via static analysis (e.g., "Domain layer cannot import from Infrastructure layer").
- **Do** run Archgate locally before submitting a Pull Request to catch architectural violations early.

### Don't

- **Don't** bypass Archgate pipeline checks during emergency hotfixes without explicit lead approval.
- **Don't** write vague, purely theoretical ADRs; ensure every ADR has actionable guidelines or automated rules.
- **Don't** leave outdated ADRs active; mark them as "Deprecated" or "Superseded" via the CLI if the architecture changes.

## Consequences

### Positive

- **Automated Enforcement:** Architectural rules are checked by the machine, reducing the cognitive load on human reviewers during PRs.
- **Living Documentation:** New developers can read the ADRs to instantly understand *why* the codebase is structured the way it is.
- **Prevent Drift:** Accidental imports across restricted architectural boundaries are blocked immediately.

### Negative

- **Initial Setup Overhead:** Writing custom AST (Abstract Syntax Tree) rules in `.rules.ts` requires a slight learning curve for the team.
- **Slight CI Overhead:** Running the Archgate CLI adds a minor step to our continuous integration pipeline.

### Risks

- **Over-engineering Rules:** We risk writing rules that are too strict, which could frustrate developers and slow down feature delivery. Rules must remain pragmatic.

## Compliance and Enforcement

This ADR is enforced by the inclusion of the `archgate check` command in our primary CI/CD pipeline. Pull Requests that fail architectural linting will be blocked from merging.

## References

- [Archgate CLI Documentation](https://cli.archgate.dev/)
- [Archgate Rules API](https://cli.archgate.dev/docs/rules)
