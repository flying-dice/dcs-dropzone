---
name: review-pr
description: "Review a pull request for flying-dice/dcs-dropzone. Trigger on any request to 'review PR', 'review pull request', 'check PR', or 'look at PR'."
---

# Review a Pull Request

## Before starting

Always run `git pull` first to ensure local state is up to date.

## Step-by-step

### 1. Fetch PR details

```bash
gh pr view <NUMBER> --repo flying-dice/dcs-dropzone --json title,body,author,baseRefName,headRefName,additions,deletions,changedFiles,state,labels,reviews,comments
gh pr diff <NUMBER> --repo flying-dice/dcs-dropzone
```

### 2. Check CI — both pipelines must pass

```bash
gh pr checks <NUMBER> --repo flying-dice/dcs-dropzone
```

This repo has **two required CI checks**. Both must show `pass` before the PR can be considered green:

| Check | System | URL pattern |
|-------|--------|-------------|
| `build-app` | GitHub Actions | `github.com/flying-dice/dcs-dropzone/actions/runs/...` |
| `dcs-dropzone` | Jenkins | `falcon.beluga-sirius.ts.net/job/dcs-dropzone/...` |

If either shows `pending`, note it explicitly — do not declare CI green until both pass.

To dig into Jenkins results use `mcp__jenkins__getTestResults` and `mcp__jenkins__getBuildLog`.  
To dig into GitHub Actions use `gh run view <RUN_ID> --repo flying-dice/dcs-dropzone`.

### 3. Review the diff

- Understand the intent of the change before judging individual lines.
- Check for correctness, security issues, test coverage, and adherence to existing conventions.
- Note anything that could cause flakiness or regressions.

### 4. Deliver the review

Structure feedback as:

- **Overall verdict** (approve / request changes / comment)
- **Change-by-change notes** with file:line references where relevant
- **CI status** summary

## Rules

- Never approve if either CI check is pending or failing.
- Always run `git pull` before reviewing.
- If the PR was auto-generated (e.g. Copilot), verify the title/body accurately describes the actual changes.
