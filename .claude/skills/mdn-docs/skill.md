---
name: dcs-dropzone-docs
description: "Write documentation for DCS Dropzone — a DCS World mod manager consisting of three apps: the Daemon (download, unpack, symlink management), the Webapp (hosted mod discovery), and the Launcher (auto-update). Use this skill whenever the user asks to create, write, review, or structure documentation for this project, including API reference pages, developer guides, landing pages, and — critically — Spec pages for Spec Driven Development (SDD). Spec pages are the primary artefact of SDD: they describe a single system behavior in terms of inputs and resulting system actions, completely void of technical implementation details, and serve as both documentation and the basis for test cases. Trigger on any request to 'write a spec', 'document this behavior', 'write docs', 'create a reference page', 'write a guide', or 'add a landing page' for any part of the project."
---

# DCS Dropzone Documentation

This skill produces documentation for DCS Dropzone using an information architecture and style modelled on MDN Web Docs. It covers four page types suited to the project's needs, including Spec pages that drive Spec Driven Development.

## Project context

DCS Dropzone is a DCS World mod manager with three applications:

- **Daemon** — a local background process that manages mod lifecycle: downloading releases, unpacking archives, and enabling/disabling mods via symlinks into the DCS saved games directory.
- **Webapp** — a hosted web application where users browse, search, and discover mods from the registry.
- **Launcher** — a desktop process that checks for application updates and auto-updates the Daemon and Launcher binaries before launching the main application.

## Page types

| Type | Job | When to use |
|---|---|---|
| **Landing Page** | Orient the reader and link to subpages | Section entry points (e.g. "Daemon", "Mod Lifecycle") |
| **Guide** | Teach a concept, workflow, or technique | Explaining how something works conceptually |
| **Reference Page** | Document one specific technical item | An endpoint, config option, event, or command |
| **Spec Page** | Define a single system behavior for SDD | Any behavior to be specified and tested |

## Spec Driven Development

Spec pages are the primary documentation artefact for this project. They define what the system does — not how it does it. A spec page:

- Describes **one behavior** (e.g. "Enable Mod", "Download Release")
- States which **app** owns the behavior
- Lists **inputs** (what the user or system provides)
- Lists **system actions** (what the system does in response, observable from the outside)
- Contains **scenarios** written in plain Given / When / Then form
- Contains **zero implementation detail** — no file paths, no database tables, no class names, no network protocols unless they are the user-visible interface

Spec pages are the source of truth from which test files are derived. Test files reference spec page scenarios by name.

## Reference materials

All style rules, templates, and examples live in the `resources/` directory. **Read these files before writing any documentation.**

### Style guide

→ `resources/documentation-styleguide.md`

Authoritative reference covering information architecture, voice and tone, formatting conventions, spec page rules, notice types, cross-linking, and the review checklist.

### Example pages

- `resources/example-landing-page.md` — Landing page for the Daemon section
- `resources/example-guide-page.md` — Guide explaining how mod installation works
- `resources/example-reference-page.md` — Reference page for a daemon action
- `resources/example-spec-page.md` — Spec page for the "Enable Mod" behavior

## Writing process

1. **Determine page type.**
   - "Orient the reader and link to subpages" → Landing Page
   - "Teach a concept or workflow" → Guide
   - "Document one technical item" → Reference Page
   - "Define a behavior for SDD" → Spec Page

2. **Read the style guide** and the matching example from `resources/`.

3. **Write the opening paragraph first.** One sentence: what this thing is and what it does.

4. **Fill sections in order** following the template sequence from the style guide and examples.

5. **For Spec pages:** write scenarios last. Each scenario must be expressible as Given / When / Then with no technical detail in any clause.

6. **For Reference pages:** include a minimal, self-contained code example where relevant.

7. **Cross-link** all named system concepts (mod, release, registry, symlink, saved games directory) on first mention.

8. **End with See Also** — 3–8 related links ordered by relevance.

9. **Run the review checklist** from the style guide.
