---
name: pick-issue
description: "Pick an open GitHub issue from flying-dice/dcs-dropzone, implement it on a feature branch, raise a PR, and post progress updates to #dcs-dropzone on Slack using @here. Trigger on any request to 'pick an issue', 'work on an issue', 'grab an issue', 'pick up a ticket', or 'start an issue'."
---

# Pick & Implement a GitHub Issue

This skill drives the full cycle from issue selection to merged PR, with live Slack updates throughout.

## Slack channel

All progress posts go to **#dcs-dropzone** (channel ID `C0AQZRDT3CL`).  
Always use `@here` at the start of the opening progress post so the team sees it.

## Step-by-step process

### 1. List open issues

Run:

```bash
gh issue list --repo flying-dice/dcs-dropzone --state open --limit 50 --json number,title,labels,assignees,body
```

Present a concise numbered list to the user (number, title, key labels). Ask them to confirm which issue to pick up, or auto-select the highest-priority unassigned one if they said to proceed autonomously.

### 2. Read the issue in full

```bash
gh issue view <NUMBER> --repo flying-dice/dcs-dropzone --json number,title,body,labels,comments
```

Read the full body and all comments. Identify any ambiguity that would block implementation.

### 3. Post "picking up" announcement to Slack

Post to #dcs-dropzone **before writing any code**:

```
@here Picking up issue #<NUMBER>: <title>

<one-sentence summary of what needs to be done>

Will post updates here as work progresses.
```

### 4. Ask clarification questions if needed

If anything in the issue is ambiguous, **post the questions to Slack** (not just in the terminal):

```
@here Quick questions on #<NUMBER> before I start:

1. <question>
2. <question>

Tagging <@UGVK2HWBH> for input.
```

Wait for the user to answer in the conversation before proceeding.

### 5. Create a feature branch

Branch naming: `feat/<issue-number>-<short-slug>` (e.g. `feat/42-fix-symlink-race`).

```bash
git checkout main && git pull
git checkout -b feat/<NUMBER>-<slug>
```

### 6. Implement the solution

- Read all relevant files before editing anything.
- Make focused, minimal changes — only what the issue requires.
- Do not refactor surrounding code, add comments, or add unrelated features.
- Run existing tests after changes: `cargo test` / `npm test` / whatever is appropriate.
- Fix any test failures before proceeding.

### 7. Post "in progress" update to Slack

After completing the core implementation but before opening the PR:

```
@here Update on #<NUMBER>: <title>

Implementation complete. Opening PR now.

Changes made:
- <bullet>
- <bullet>
```

### 8. Commit and push

```bash
git add <specific files>
git commit -m "feat: <short description>

Closes #<NUMBER>"
git push -u origin feat/<NUMBER>-<slug>
```

### 9. Open the PR

```bash
gh pr create \
  --repo flying-dice/dcs-dropzone \
  --title "<short title>" \
  --body "$(cat <<'EOF'
## Summary
- <bullet>

## Related issue
Closes #<NUMBER>

## Test plan
- [ ] <test step>
- [ ] <test step>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 10. Post "PR raised" announcement to Slack

```
@here PR raised for #<NUMBER>: <title>

<PR URL>

Please review at your convenience. I'm available for questions or changes.
```

## Clarification question guidelines

Ask clarification questions when:
- The expected behaviour is described ambiguously or contradicts existing code.
- The issue mentions a design decision that has not been made yet.
- Multiple valid implementation approaches exist with meaningfully different trade-offs.

Do **not** ask about:
- Things answerable by reading the codebase.
- Minor stylistic choices you can resolve by following existing conventions.
- Things the issue body already answers.

## Rules

- Never force-push or rebase published branches.
- Never skip pre-commit hooks (`--no-verify`).
- Never commit `.env` files or credentials.
- Always confirm the branch does not already exist before creating it.
- Post every Slack update as a new top-level message in #dcs-dropzone (not a thread reply), unless responding to a clarification thread.
