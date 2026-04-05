# Documentation Style Guide

This style guide defines the standards for writing, structuring, and formatting platform documentation. It is modeled on the documentation patterns used by MDN Web Docs and adapted for platform and API documentation.

These are standards, not suggestions. Every page published under your documentation should conform to this guide. If a contributor edits your work to match these rules, that is expected and welcome.

> **Note:** This guide covers English-language documentation. Localized versions may create supplementary guides, but this document governs structure and formatting for all languages.

-----

## Table of Contents

- [1. Information Architecture](#1-information-architecture)
- [2. Page Types and Templates](#2-page-types-and-templates)
- [3. Voice, Tone, and Language](#3-voice-tone-and-language)
- [4. Page Structure Rules](#4-page-structure-rules)
- [5. Formatting Conventions](#5-formatting-conventions)
- [6. Code Examples](#6-code-examples)
- [7. Linking and Cross-Referencing](#7-linking-and-cross-referencing)
- [8. Notices, Banners, and Status Badges](#8-notices-banners-and-status-badges)
- [9. Naming, Capitalization, and Terminology](#9-naming-capitalization-and-terminology)
- [10. Inclusive and Accessible Language](#10-inclusive-and-accessible-language)
- [11. SEO and Discoverability](#11-seo-and-discoverability)
- [12. Review Checklist](#12-review-checklist)

-----

## 1. Information Architecture

All documentation is organized into a three-tier hierarchy. Every page belongs to exactly one tier.

### Tier 1: Landing Pages

A landing page introduces a broad topic area and acts as a navigational hub. It does not teach or document specific features. Its job is orientation.

A landing page contains:

- A one-to-two paragraph overview of the topic area.
- A categorized list of links to Guides and Reference pages within that section, each with a one-sentence description.
- No code examples, no deep explanations.

**Example path:** `/docs/authentication/` — links out to guides on OAuth, API keys, session tokens, and reference pages for each auth endpoint.

### Tier 2: Guides

A guide teaches a concept, workflow, or technique. It is narrative, sequential, and assumes the reader wants to understand *why* and *how*. Guides may include code examples, but the prose is the primary content.

**Example titles:** “Using OAuth 2.0 with Your Application,” “How Caching Works,” “Connection Management in HTTP/1.x.”

### Tier 3: Reference Pages

A reference page documents a single, discrete technical item: an endpoint, a header, a method, a status code, a configuration option, an object, or a parameter. It is structured, predictable, and scannable. The reader already knows roughly what they need and is looking up specifics.

**Example titles:** “`Cache-Control` header,” “`GET /users`,” “`429 Too Many Requests`.”

### Sidebar and Breadcrumbs

Every page displays:

- **Breadcrumb trail** showing its position in the hierarchy (e.g., `Docs > Authentication > Reference > Headers > Authorization`).
- **Section sidebar** listing all pages within the current topic area, grouped by Guides and Reference.

The sidebar is the reader’s primary navigation tool. It must be comprehensive, consistently ordered, and kept up to date whenever pages are added or removed.

### URL Structure

URLs mirror the hierarchy and use lowercase kebab-case:

```txt
/docs/{topic}/                          → Landing page
/docs/{topic}/guides/{guide-slug}       → Guide
/docs/{topic}/reference/{type}/{item}   → Reference page
```

Never include version numbers, dates, or author names in URLs. Versioned content uses a separate version selector, not a different path.

-----

## 2. Page Types and Templates

Every page conforms to one of the templates below. Do not invent new structures. If a page does not fit any template, discuss it with the documentation team before publishing.

### 2.1 Landing Page Template

````txt
# {Topic}: {Subtitle}

{One to two paragraphs summarizing the topic area. Define the scope.
State what the reader will find in this section.}

## Guides

{Topic Guide Title}
:   One-sentence description of what the guide covers.

{Another Guide Title}
:   One-sentence description.

## Reference

{Reference Category} (e.g., "Headers," "Endpoints," "Status Codes")
:   - `Item Name` — one-line summary
:   - `Item Name` — one-line summary
````

### 2.2 Guide Page Template

````txt
# {Guide Title}

{Opening paragraph(s): summarize what this guide covers, who it is for,
and what prerequisite knowledge is assumed. Link to prerequisite guides
if relevant.}

## {First Conceptual Section}

{Explanatory prose. Define terms before using them. Use examples to
clarify non-obvious points.}

## {Second Conceptual Section}

{Continue building the explanation. If the guide is task-oriented,
present steps in logical order.}

### {Subsection with Code Example}

{Introduce the example: explain what it demonstrates and why.}

```language
{code}
```

{Explain the result or output. Call out non-obvious behavior.}

## See Also

- {Link to related guide}
- {Link to relevant reference page}

````
### 2.3 Reference Page Template

This is the most rigid template. Every reference page for the same category (all headers, all endpoints, all status codes) must use identical section ordering.
````txt

# {Item Name}

{Status badge: Stable | Experimental | Deprecated}

{Single opening paragraph: one to three sentences defining what this
item is and what it does. Bold the item name on first mention.
Link to the parent concept guide.}

|Metadata Key    |Value  |
|----------------|-------|
|{Relevant field}|{Value}|
|{Relevant field}|{Value}|

## Syntax

```language
{Formal syntax or method signature}
```

{Brief prose explaining syntax components, if not self-evident.}

## Parameters / Directives / Values

`parameter_name`
:   {Type.} {Description. State the default if applicable.
Note whether it is required or optional.}

`another_parameter`
:   {Type.} {Description.}

## Description

{Longer explanation of behavior, edge cases, and how this item
interacts with other parts of the system. This section is optional
if the opening paragraph and parameter descriptions are sufficient.}

## Examples

### {Scenario Title}

{One sentence introducing the example.}

```language
{code example}
```

{Explain the output or result.}

### {Another Scenario Title}

{Repeat pattern.}

## Specifications

|Specification     |Status          |
|------------------|----------------|
|{Spec name + link}|{Standard/Draft}|

## Compatibility

{Compatibility table or prose noting platform/version support.}

## See Also

- {Link to related reference page}
- {Link to relevant guide}
- {Link to external specification}

````
### Section Ordering Is Fixed

For reference pages, sections must always appear in this order: opening definition → metadata table → Syntax → Parameters → Description → Examples → Specifications → Compatibility → See Also. If a section has no content, omit it entirely rather than including an empty heading.

---

## 3. Voice, Tone, and Language

### Voice

Write in a **neutral, declarative, third-person voice**. The documentation is a reference manual, not a conversation. The subject of most sentences should be the thing being documented, not the reader and not the author.

**Correct:** "The `Cache-Control` header holds directives that control caching in browsers and shared caches."

**Incorrect:** "You can use the `Cache-Control` header to control how your browser caches things."

**Incorrect:** "We designed the `Cache-Control` header to give you control over caching."

### When Second Person Is Acceptable

Guides (Tier 2) may use "you" sparingly when giving direct instructions in a task sequence. Even in guides, prefer impersonal constructions when describing how something works.

**Acceptable in a guide:** "To enable caching, set the `max-age` directive."

**Preferred even in a guide:** "Setting the `max-age` directive enables caching."

Reference pages (Tier 3) should avoid "you" entirely.

### Tone

The tone is **professional, calm, and precise**. It is not formal to the point of stiffness, and it is not casual. Contractions are acceptable ("don't," "isn't," "can't") because they reduce stiffness without sacrificing precision.

Do not use humor, rhetorical questions, exclamation marks, or colloquialisms. Do not editorialize ("This is a really useful feature!"). Do not hedge unnecessarily ("It might perhaps be worth noting that...").

### The Three Cs

Every sentence should be:

- **Clear.** Use active voice. Use unambiguous pronouns. Write short sentences. One idea per sentence.
- **Concise.** Say what needs to be said and stop. If a section becomes tedious to read, it will not be read.
- **Consistent.** Use the same term for the same concept throughout all documentation. If you call it a "token" on one page, do not call it a "credential" on another without explanation.

### Introductions

Every page opens with a paragraph that summarizes what the page covers. This paragraph must be useful on its own, since it often appears as a search snippet or tooltip.

For reference pages, the opening sentence follows a strict pattern:

> **The {category} `{item name}`** {verb phrase defining what it does or represents}.

**Example:** "The HTTP **`Authorization`** header contains the credentials to authenticate a user agent with a server."

The introduction should be neither too short (one vague sentence) nor too long (multiple paragraphs of background). Aim for two to four sentences that define the item, state its purpose, and link to the relevant concept guide.

---

## 4. Page Structure Rules

### Headings

- Use Markdown heading levels (`#` through `####`). Do not skip levels (e.g., do not jump from `##` to `####`).
- Use sentence case for all headings: "Using the authorization header," not "Using the Authorization Header." Exception: proper nouns and technical names retain their casing.
- Headings should be descriptive and specific. Avoid vague headings like "Overview" or "Details" when a more precise heading is possible.
- Do not put inline code in `#` (H1) headings. Inline code in `##` and below is acceptable and encouraged for technical names.

### Table of Contents

Every page longer than three screen-lengths should include an "In this article" section listing all `##`-level headings as anchor links. This appears immediately after the opening paragraph, before the first `##` heading.

### Paragraphs

- Keep paragraphs short: two to five sentences.
- Each paragraph should address a single point.
- Do not use single-sentence paragraphs except in introductions or transitions.

### Definition Lists

Use definition lists (term-description pairs) for glossaries, parameter documentation, and any content where a term is being explained. This is the preferred format for parameter and directive sections.

```markdown
`max-age`
:   Specifies the maximum time in seconds that a response is considered fresh.
    The clock starts from the time the response was generated on the server.

`no-cache`
:   Forces caches to submit the request to the origin server for validation
    before releasing a cached copy.
```

### Tables

Use tables for structured data with two or more parallel attributes: metadata summaries, feature comparisons, specification lists, compatibility matrices. Do not use tables for layout or for content that is better expressed as a definition list.

Every table must have a header row. Align columns consistently (left-align text, right-align numbers).

-----

## 5. Formatting Conventions

### Inline Code

Wrap all of the following in backtick inline code:

- Method names, function names, endpoint paths: `GET /users`, `fetchData()`
- Parameter names, header names, directive names: `max-age`, `Content-Type`
- Status codes: `200 OK`, `404 Not Found`
- File names and paths: `config.yaml`, `/etc/nginx/`
- Environment variables: `API_KEY`, `NODE_ENV`
- Literal values including strings, numbers, and booleans used as values: `true`, `null`, `"Bearer"`
- Command-line input: `curl -X POST`

Do not use inline code for:

- General technical concepts described in plain English (“the server,” “a cached response”).
- Product names, company names, or protocol names written in prose (“HTTP,” “OAuth,” “WebSocket”).

### Bold

Use bold (`**text**`) only for:

- The item name on its first mention in the opening paragraph of a reference page.
- Labels in callout notices (”**Note:**”, “**Warning:**”, “**Deprecated:**”).
- Column headers in tables (handled by Markdown table syntax).

Do not use bold for emphasis in running prose. If a sentence needs emphasis to be understood, rewrite it.

### Italics

Use italics (`*text*`) for:

- Introducing a new term for the first time: “It is also called a *local cache* or *browser cache*.”
- Titles of external documents or specifications when cited in prose.

Do not use italics for emphasis.

### Quotation Marks

Use straight double quotes (`"like this"`), never curly quotes. Use quotation marks only for:

- Quoting literal string values when not using inline code.
- Quoting titles or exact phrases from external sources.

### Numbers and Dates

- Spell out numbers one through nine in prose. Use digits for 10 and above.
- Use digits for all measurements, versions, and technical values: “2 seconds,” “version 3,” “8 bytes.”
- Dates: “January 1, 1990” or “YYYY-MM-DD” in technical contexts. Never “1/1/90.”
- Decades: “1990s” with no apostrophe.
- Use the serial (Oxford) comma: “tokens, sessions, and cookies.”

-----

## 6. Code Examples

### Principles

Every code example must be:

1. **Complete enough to run or to understand in isolation.** Do not show a fragment without enough context to make sense of it.
1. **Minimal.** Include only the code needed to demonstrate the point. Strip out unrelated logic.
1. **Commented only where non-obvious.** Do not narrate every line. Use comments for surprising behavior, edge cases, or critical configuration values.

### Structure

Each code example on a page follows this pattern:

1. **Heading** (`###`): A short, descriptive title stating what the example demonstrates. Example: “Setting a cache expiration,” “Authenticating with a bearer token.”
1. **Introduction** (one to two sentences): Explain what the example does and why it is relevant.
1. **Code block** with a language identifier.
1. **Explanation** (one to three sentences): Describe the output, result, or any non-obvious behavior.

### Syntax Highlighting

Always specify the language on fenced code blocks:

```markdown
```http
GET /users HTTP/1.1
Host: api.example.com
Authorization: Bearer abc123
```
```

Use these language identifiers consistently: `http`, `json`, `javascript`, `typescript`, `python`, `bash`, `yaml`, `xml`, `html`, `css`, `sql`, `plaintext`, `diff`.

### Diff Annotations for Proposed and Deprecated Fields

When a code example shows how an existing data structure evolves — for example, how an event envelope changes with the ConvP extension — use the `diff` language identifier with `+` and `-` line prefixes. This convention communicates the transition from the current model to the proposed model in a single example:

`+` (added line)
:   A proposed field or value that does not exist today. Rendered with a green background.

`-` (removed line)
:   A deprecated field or value that the proposed model replaces. Rendered with a red background.

` ` (space-prefixed line)
:   An unchanged field that exists in both the current and proposed models. Rendered with no background.

Example — showing how a message event transitions from decomposed identifier fields to a `convp://` URI:

````markdown
```diff
 {
   "message": {
     "externalIdentifier": {
       "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
       "type": "message"
     },
-    "senderExternalIdentifier": {
-      "id": "{{USER_ID}}",
-      "type": "guest"
-    },
+    "uri": "convp://{{USER_ID}}@guest/post_booking/4470837771",
     "source": "guest-app",
+    "content": "What time is check-in?",
+    "contentType": "text/plain"
   }
 }
```
````

When a field is not changing but needs to be highlighted as a proposed addition within a non-diff code block (for example, a JSON request body showing the current structure with one new field), prefix the line with `+` inside a `json` block:

```json
{
  "content": "What time is check-in?",
+ "contentType": "text/plain"
}
```

The `+` prefix is not valid JSON, but the convention is understood in the documentation context. Always explain the annotation in prose before or after the example — for instance: "Lines marked with `+` are proposed ConvP extensions."

Rules for diff examples:

- Always introduce the diff with a sentence explaining what transition it shows.
- Include enough unchanged context lines (space-prefixed) for the reader to understand the structure.
- Do not mix diff annotations with inline comments. The `+`/`-` prefixes are sufficient.
- If the example is long, follow it with a definition list explaining each changed field.

### Placeholder Values

Use descriptive, obviously-fake placeholder values. Never use real API keys, tokens, or personal data.

- URLs: `https://api.example.com`
- Tokens: `abc123`, `your-api-key`
- User data: `"Jane Doe"`, `"jane@example.com"`
- IDs: `usr_12345`, `org_67890`

### Syntax Boxes

Reference pages include a formal syntax block immediately after the opening section. This shows the canonical form of the item, using angle brackets for variable parts and square brackets for optional parts:

```http
Authorization: <type> <credentials>
```

```txt
GET /resources/{id}?fields=[field1,field2]
```

-----

## 7. Linking and Cross-Referencing

### Internal Links

- Link every technical term to its reference page on first mention within a section. Do not re-link the same term within the same section.
- Use the item name as the link text. Do not use “click here,” “this page,” or “read more.”
- Link to the most specific page available. Link to the `Authorization` header page, not to the general “Headers” landing page.

**Correct:** “The [`Authorization`](/docs/http/reference/headers/authorization) header contains credentials for authentication.”

**Incorrect:** “The Authorization header contains credentials for authentication ([read more](/docs/http/reference/headers/authorization)).”

### External Links

- Link to authoritative original sources: official specifications (RFCs, WHATWG), official project documentation, peer-reviewed references.
- Do not link to forums, aggregator blogs, or social media posts as sources.
- External links open in a new tab. Mark them visually or with a note if your platform supports it.

### “See Also” Sections

Every page ends with a “See Also” section containing three to eight links. These should include:

- Related reference pages within the same category.
- The concept guide that covers the topic in depth.
- The relevant external specification or RFC.
- Glossary entries for key terms.

Order “See Also” links from most to least directly related.

-----

## 8. Notices, Banners, and Status Badges

### Status Badges

Every reference page displays a status badge immediately below the `#` heading, before the opening paragraph. Use exactly one of:

- **Stable** — Feature is well-established and safe to use in production.
- **Experimental** — Feature is subject to change. Not recommended for production use.
- **Deprecated** — Feature is no longer recommended. Document the replacement.
- **Non-standard** — Feature is not part of any specification and may not be portable.

A page may combine badges where applicable (e.g., “Non-standard, Deprecated”).

### Inline Notices

Use blockquote-style callouts for important asides. There are exactly three types:

**Note** — Additional information that is helpful but not critical:

```markdown
> **Note:** The `max-age` directive takes precedence over the `Expires` header
> when both are present.
```

**Warning** — Information about potential pitfalls, data loss, or security risks:

```markdown
> **Warning:** Storing tokens in local storage exposes them to
> cross-site scripting attacks.
```

**Deprecated** — Information about features that should no longer be used:

```markdown
> **Deprecated:** The `X-Custom-Auth` header was removed in v3.0.
> Use the `Authorization` header instead.
```

Do not invent other notice types (“Tip,” “Important,” “Caution,” “Info”). Three types are sufficient. If content does not fit one of these, it belongs in the main prose.

### Placement

- Place notices immediately after the paragraph that introduces the topic they relate to.
- Never stack two notices in a row. If two warnings apply to the same section, combine them into one.
- Do not use notices as a substitute for writing clear prose.

-----

## 9. Naming, Capitalization, and Terminology

### Capitalization

- **Headings:** Sentence case. Capitalize the first word and proper nouns only.
- **Product and feature names:** Follow the official casing of the product. Do not alter it for stylistic preference.
- **Protocol names in prose:** Uppercase when they are acronyms or proper names: HTTP, TLS, OAuth, REST, WebSocket.
- **General technical terms:** Lowercase when used generically: “the server,” “a response header,” “the cache.”

### Terminology Consistency

Maintain a terminology glossary for your project. Choose one term for each concept and use it everywhere. Below are common decisions to make and document:

|Concept                      |Choose One    |Not This                        |
|-----------------------------|--------------|--------------------------------|
|Confirming identity          |authentication|auth, login (unless UI-specific)|
|Permission to access         |authorization |permission check, access control|
|Unique key for a resource    |identifier    |ID, id, key (be consistent)     |
|Sending a request            |request       |call, hit, ping                 |
|The reply from a server      |response      |answer, result, return          |
|A named grouping of endpoints|resource      |entity, object, model           |

When a term has both a generic meaning and a platform-specific meaning, define the platform-specific meaning on first use and link to a glossary entry.

### Preferred Wording

- Use “parameters” not “arguments” when describing inputs to API endpoints or functions.
- Use “invoke” or “call” for API requests, not “hit” or “ping.”
- Use “returns” for response descriptions, not “gives back” or “sends.”
- Use “indicates” or “specifies” when describing what a header or parameter does, not “tells” or “lets you know.”

-----

## 10. Inclusive and Accessible Language

### Inclusive Terminology

Do not use terms that may alienate readers or carry unintended connotations:

|Avoid                |Use Instead                        |
|---------------------|-----------------------------------|
|master / slave       |primary / replica, main / secondary|
|whitelist / blacklist|allowlist / denylist               |
|sanity check         |coherence check, validation        |
|dummy value          |placeholder value                  |
|kill (a process)     |terminate, stop, end               |
|native (feature)     |built-in                           |

Avoid idioms rooted in violence or cultural assumptions: “kill two birds with one stone” becomes “solve two problems at once”; “beating a dead horse” becomes “belaboring the point.”

### Gender-Neutral Language

Use gender-neutral pronouns. The singular “they” is preferred when the subject’s gender is unknown or irrelevant.

**Correct:** “When a developer registers, they receive an API key.”

**Incorrect:** “When a developer registers, he receives an API key.”

Better still, restructure to eliminate pronouns: “Registration generates an API key.”

### Accessible Writing

- Do not use directional language that assumes a visual layout: “the section below,” “the diagram to the right.” Instead, refer to sections by name: “the Syntax section later on this page.”
- Do not use color alone to convey meaning (“the green status,” “the red error”). Name the status explicitly.
- Use descriptive link text. Never write “click here” or “this link.”
- Provide alt text for every image and diagram that describes its content, not its format (“Sequence diagram showing the OAuth authorization flow,” not “diagram.png”).

-----

## 11. SEO and Discoverability

### Page Titles

- The `<title>` or front-matter title should contain the item name and its category, separated by a dash or pipe: “`Authorization` header — HTTP Reference.”
- Place the most specific term first. Search engines weight the beginning of a title more heavily.

### Meta Descriptions

Every page should have a meta description of 120 to 160 characters that summarizes the page content. This is the text that appears in search results. Write it as a complete sentence.

### Opening Paragraph as Snippet

Search engines frequently use the first paragraph of a page as the result snippet. Write the opening paragraph to be self-contained and informative. If someone reads only that paragraph, they should understand what the page is about.

### Anchor IDs

Use readable, lowercase, hyphenated anchor IDs for every heading. These become deep-linkable URLs and appear in search results.

**Correct:** `## Syntax` → `#syntax`

**Correct:** `### Response directives` → `#response-directives`

-----

## 12. Review Checklist

Before publishing any page, confirm:

**Structure:**

- [ ] Page conforms to one of the three templates (Landing, Guide, Reference).
- [ ] Sections appear in the prescribed order for its page type.
- [ ] Breadcrumbs and sidebar entry are correct.
- [ ] “See Also” section is present with three to eight relevant links.

**Content:**

- [ ] Opening paragraph defines the topic in one to four sentences.
- [ ] All technical terms are linked on first mention within each section.
- [ ] No broken links (internal or external).
- [ ] Code examples are complete, minimal, and have language identifiers.
- [ ] Diff annotations (`+`/`-`) are used correctly to show proposed and deprecated fields.
- [ ] Placeholder values are obviously fake.

**Voice and Language:**

- [ ] Declarative third-person voice (reference pages) or limited second-person (guides).
- [ ] No humor, exclamation marks, or editorializing.
- [ ] No gendered pronouns where gender is irrelevant.
- [ ] No directional language (“above,” “below,” “click here”).
- [ ] Inclusive terminology (no denylist terms from Section 10).

**Formatting:**

- [ ] Inline code on all technical names, parameters, paths, and literal values.
- [ ] Bold used only for first-mention item names and notice labels.
- [ ] Definition lists for parameters, directives, and glossary terms.
- [ ] Status badge present on all reference pages.
- [ ] No more than one notice type in a row; no stacked callouts.

**SEO:**

- [ ] Page title follows the `{Item} — {Category}` pattern.
- [ ] Meta description is 120 to 160 characters.
- [ ] Heading anchors are lowercase and hyphenated.

-----

*This style guide is a living document. Propose changes through the documentation team’s review process. When in doubt, prioritize clarity and consistency over personal preference.*
