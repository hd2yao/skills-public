---
name: hd2yao-feature-implementation-delivery
description: Use when an approved feature plan is ready for implementation with parallel task execution, code review checkpoints, browser validation evidence, and final testing.
---

# HD2YAO Feature Implementation Delivery

## Overview

Execute an approved plan with a micro-commit gate loop:
- each minimum verifiable change triggers a parallel review/test gate
- commit is allowed only when both gates pass
- on gate failure, rollback tracked changes to last passing commit
- push happens once per stage after full test gate passes

**Announce at start:** "I'm using hd2yao-feature-implementation-delivery to execute and deliver this feature."

## Execution Preconditions (Plan-Only Entry)

Single required input:
- final approved plan file: `./<feature>.plan.vN.md`

From this plan, the skill MUST resolve these runtime parameters before implementation:
- `FAST_CHECK_CMD`
- `FAST_TEST_CMD`
- `FULL_TEST_CMD`
- `TARGET_BRANCH`
- `FEATURE_BRANCH`

Branch rules:
- `FEATURE_BRANCH` must not be `main` or `master`.
- Prefer `codex/<feature-name>` branch naming.
- If current branch is unsafe, switch/create before implementation.

## Runtime Parameter Resolution

Do not ask the user to manually provide the five runtime parameters unless all resolution rules fail.

Resolution priority (highest to lowest):

1. Plan explicit values:
- Read `./<feature>.plan.vN.md`.
- Prefer explicit command/branch entries in sections such as `Test Strategy`, `Rollback Plan`, `Task Breakdown`, or dedicated runtime sections.

2. Plan-derived intent:
- If commands are not explicitly listed, infer from test intent text in `Test Strategy`:
  - fastest static/sanity command -> `FAST_CHECK_CMD`
  - fastest affected-scope test command -> `FAST_TEST_CMD`
  - complete regression/full suite command -> `FULL_TEST_CMD`
- Infer branch intent from plan delivery/merge wording:
  - merge target -> `TARGET_BRANCH`
  - feature name/slug -> `FEATURE_BRANCH` as `codex/<feature-slug>`

3. Repository fallback (non-interactive):
- If still missing, infer from repository tooling and existing scripts/manifests.
- Use the fastest relevant check/test commands that are already standard in repo.
- Default `TARGET_BRANCH` to `main` when not discoverable.
- Default `FEATURE_BRANCH` to `codex/<feature-slug>` from plan filename.

4. Hard stop condition:
- If any command parameter remains unresolved or non-executable after steps 1-3, stop and ask only for that missing item.

After resolution:
- Print the five resolved values before running implementation.
- Keep them in the run summary shown in the final response (no file artifact).

## Process

Two-layer execution is mandatory.

### Outer Layer: Delivery Stages

1. Load final approved plan: `./<feature>.plan.vN.md`.
2. Resolve `FAST_CHECK_CMD`, `FAST_TEST_CMD`, `FULL_TEST_CMD`, `TARGET_BRANCH`, and `FEATURE_BRANCH` using the runtime resolution rules.
3. Ensure safe branch/worktree context (`FEATURE_BRANCH`), never implement on `main/master`.
4. Break implementation into task units from plan `Task Breakdown`.
5. For each task unit, run the inner layer micro-commit loop repeatedly until task scope is done.
6. At stage end, run `FULL_TEST_CMD`.
7. If `FULL_TEST_CMD` fails: enter fix loop (small fixes through the same micro-commit loop), then rerun `FULL_TEST_CMD`. Do not push while failing.
8. If `FULL_TEST_CMD` passes: push all stage commits once to `FEATURE_BRANCH`.
9. Open/update PR to `TARGET_BRANCH`, wait for required CI, fix with additional micro-commits if needed, and merge only when checks/approvals pass.
10. Produce a final run summary in response with gate, rollback, push, PR, CI, and merge evidence (no artifact file required).

### Inner Layer: Micro-Commit Gate Loop

Run this loop for each minimum verifiable change:

1. Create a minimal change unit (single behavior-focused increment).
2. Detect tracked changes: `git diff --name-only`.
3. If no tracked changes, continue implementation (no commit attempt).
4. Dispatch parallel gate subagents:
   - review gate agent
   - test gate agent (`FAST_CHECK_CMD` + `FAST_TEST_CMD`)
5. Collect both structured results.
6. If both PASS:
   - `git add <changed-files>`
   - `git commit -m "<task-scope>: <micro-change>"`
7. If either FAIL:
   - record failure reason in current run summary
   - rollback tracked changes with:
     `git restore --source=HEAD --staged --worktree -- .`
   - keep untracked files untouched
   - re-implement and rerun loop

## Micro Commit Gate Loop (Algorithm)

Use this decision logic for every micro-change:

```text
while task_not_done:
  implement_minimum_change()
  changed = tracked_diff()
  if changed is empty:
    continue

  review_result, test_result = run_parallel_gates()

  if review_result == PASS and test_result == PASS:
    commit_micro_change()
  else:
    record_failure_evidence()
    rollback_tracked_changes_only()
    continue
```

`tracked_diff()` must be based on `git diff --name-only`.

`rollback_tracked_changes_only()` must use:
`git restore --source=HEAD --staged --worktree -- .`

Never run destructive cleanup of untracked files as part of rollback.

## Parallel Subagent Contracts

Use two independent subagents in parallel for each gate run.

### Review Gate Agent

Required inputs:
- current micro-change diff
- task requirement slice from plan
- repository constraints and explicit prohibitions

Required output (structured):
- `status`: `PASS` or `FAIL`
- `blocking_findings`: list
- `important_findings`: list
- `summary`: short evidence-based conclusion

Pass condition:
- no blocking findings
- no unresolved important findings

### Test Gate Agent

Required inputs:
- `FAST_CHECK_CMD`
- `FAST_TEST_CMD`
- current diff scope

Required output (structured):
- `status`: `PASS` or `FAIL`
- `check_cmd`: executed command and exit code
- `test_cmd`: executed command and exit code
- `failed_cases`: list (if any)

Pass condition:
- both commands exit successfully
- no failed test cases

### Gate Aggregation Rule

Commit is allowed only when both agents report `PASS`.
Any other combination is `FAIL` and triggers rollback.

## Failure Handling Matrix

| Failure Point | Action | Commit Allowed | Push Allowed |
|---|---|---|---|
| Review gate FAIL | Record findings, rollback tracked changes, re-implement | No | No |
| Fast check/test gate FAIL | Record failing output, rollback tracked changes, re-implement | No | No |
| `FULL_TEST_CMD` FAIL | Enter fix loop with new micro-commits, rerun full test | Yes (for fixes) | No |
| Push FAIL | Keep local commits, fix and retry push | Yes | Retry only after fixes |
| Required CI FAIL | Keep branch, add fix micro-commits, rerun CI | Yes | Already pushed branch only |

Rollback rule:
- Always rollback to last passing commit state for tracked files.
- Do not delete untracked files.

## Required Practices

- Use minimum verifiable change units for commits.
- Run review and test gates in parallel on each micro-change.
- Block commit if any gate is not PASS.
- Record every failure/rollback event in the current run summary.
- Do not bundle unrelated changes.
- Run full test gate before any stage push.
- Capture browser evidence when UI behavior is part of acceptance.
- Do not declare completion without verification output.
- Do not merge before required CI checks are green.
- If repository has PR protection rules, follow them strictly.
- If PR/CI workflow is unavailable, report blocker and get explicit user approval before direct merge.

## Run Summary (No Artifact File)

Do not create a mandatory output artifact file.

Provide final response summary with:
- Changes delivered
- Commit units and gate evidence references
- Review findings and fixes
- Browser validation evidence (if applicable)
- Test commands and results (`FAST_CHECK_CMD`, `FAST_TEST_CMD`, `FULL_TEST_CMD`)
- Resolved runtime parameters and resolution source
- Micro-commit ledger (SHA, diff scope, gate statuses)
- Rollback ledger (trigger, scope, recovery action)
- Final gate evidence (full test, push)
- PR/CI status and merge result

## Quality Gate

Feature is complete only when:
- Runtime parameters are resolved from plan/repo and are executable.
- Every micro-commit has dual-gate PASS evidence.
- Required tests pass, including stage-end `FULL_TEST_CMD`.
- Acceptance criteria are verified.
- Evidence (logs/screenshots) is available when needed.
- Rollback path remains clear.
- Changes are committed via micro-commit loop.
- Stage push occurs only after full test gate passes.
- PR is created/updated and review requirements are satisfied.
- Required CI checks are green.
- PR is merged to target branch (or explicit approved exception is documented).
- No ambiguous state exists where failing gates still led to commit or push.

## Validation Scenarios

Use these scenarios to verify skill behavior:

1. Happy path: micro-change -> parallel gates PASS -> commit -> stage-end full test PASS -> one push -> PR/CI/merge.
2. Review fail path: review gate FAIL -> tracked rollback -> no commit -> failure logged.
3. Fast test fail path: test gate FAIL -> tracked rollback -> no commit -> failure logged.
4. Final gate fail path: all micro-commits exist, full test FAIL -> no push -> fix loop -> full test PASS -> push.
5. Remote fail path: push or CI FAIL -> keep history -> add fix micro-commits -> retry until green.
