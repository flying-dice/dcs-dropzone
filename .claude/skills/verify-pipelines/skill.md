---
name: verify-pipelines
description: "Monitor GitHub Actions and Jenkins pipelines for the current branch/commit and confirm both are green before closing a work item. Trigger on any request to 'check pipelines', 'verify CI', 'watch the build', 'is CI green', 'check before closing', or 'monitor pipelines'."
---

# Verify Pipelines Before Closing

Run this skill after pushing changes. It watches **both** GitHub Actions and Jenkins until they settle, then gives a clear pass/fail verdict. Do not consider a work item done until both are green.

## Inputs

Determine these from context before starting:

- **COMMIT** — the SHA of the head commit on the current branch (`git rev-parse HEAD`)
- **BRANCH** — the current branch name (`git branch --show-current`)
- **REPO** — `flying-dice/dcs-dropzone`
- **JENKINS_JOB** — `dcs-dropzone`

## Step-by-step

### 1. Resolve commit and branch

```bash
git rev-parse HEAD
git branch --show-current
```

### 2. Find the GitHub Actions run for this commit

```bash
gh run list --repo flying-dice/dcs-dropzone --branch <BRANCH> --limit 5 --json databaseId,status,conclusion,headSha,displayTitle,createdAt
```

Find the run whose `headSha` matches COMMIT. If it isn't listed yet, wait 10 seconds and retry (the push may still be propagating).

### 3. Watch GitHub Actions until complete

```bash
gh run watch <RUN_ID> --repo flying-dice/dcs-dropzone
```

This blocks until the run finishes. If it exits before finishing (e.g. already done), follow up with:

```bash
gh run view <RUN_ID> --repo flying-dice/dcs-dropzone
```

Record the conclusion (`success` / `failure` / `cancelled`).

### 4. Find the Jenkins build for this commit

Use the `mcp__jenkins__getJob` tool to get the latest build:

```
mcp__jenkins__getJob(jobFullName: "dcs-dropzone", tree: "lastBuild[number,result,building,timestamp]")
```

Check if the latest build was triggered after the push timestamp. If `building: true`, poll every 15 seconds until `building: false`:

```
mcp__jenkins__getJob(jobFullName: "dcs-dropzone", tree: "lastBuild[number,result,building]")
```

If the build number hasn't changed from what existed before the push (i.e. Jenkins hasn't picked up the SCM change yet), wait 20 seconds and retry — Jenkins polls on a schedule.

Record the result (`SUCCESS` / `FAILURE` / `UNSTABLE`).

### 5. On any failure — pull the tail log and diagnose

**GitHub Actions failure:**

```bash
gh run view --job=<JOB_ID> --repo flying-dice/dcs-dropzone --log 2>&1 | tail -100
```

**Jenkins failure:**

```
mcp__jenkins__getBuildLog(jobFullName: "dcs-dropzone", buildNumber: <N>, limit: -80)
```

Read the output. Identify the root cause. Fix it, push, and re-run this skill from step 1.

### 6. Verdict

Both must be green to close:

| GitHub Actions | Jenkins   | Verdict |
|----------------|-----------|---------|
| success        | SUCCESS   | ✅ Both green — work item can be closed |
| success        | UNSTABLE  | ⚠️ Jenkins unstable — check JUnit failures |
| failure / *    | *         | ❌ GitHub Actions failed — do not close |
| *              | FAILURE   | ❌ Jenkins failed — do not close |

## Polling guidance

- Check every **15 seconds** when polling Jenkins manually.
- Use `gh run watch` for GitHub Actions (it handles polling internally).
- Timeout after **15 minutes** — if either pipeline is still running, report the current state and ask the user how to proceed.

## Rules

- Never declare a work item done on a green local test run alone — CI must confirm it.
- If GitHub Actions and Jenkins disagree (one green, one red), investigate both before deciding.
- A Jenkins result of `UNSTABLE` is a failure for the purposes of closing work — treat it the same as `FAILURE`.
- Always report the build URLs so the user can inspect the full results themselves:
  - GitHub Actions: `https://github.com/flying-dice/dcs-dropzone/actions/runs/<RUN_ID>`
  - Jenkins: `https://falcon.beluga-sirius.ts.net/job/dcs-dropzone/<BUILD_NUMBER>/`
