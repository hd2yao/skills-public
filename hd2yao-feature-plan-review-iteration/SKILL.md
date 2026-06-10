---
name: hd2yao-feature-plan-review-iteration
description: Use when a feature plan needs review feedback incorporated through versioned document updates until blocking comments are resolved.
---

# HD2YAO Feature Plan Review Iteration

## Overview

Iterate plan documents based on review feedback with strict traceability.

**Announce at start:** "I'm using hd2yao-feature-plan-review-iteration to process review feedback and iterate the plan."

<HARD-GATE>
Do not finish this skill with chat-only feedback. You MUST persist review results to disk before handoff.
</HARD-GATE>

## Process

1. Locate the latest plan file: `./<feature>.plan.vN.md` (or user-provided plan path).
2. Create review directory beside the plan file: `./<plan-dir>/reviews/`.
3. Run complexity triage first and choose one path:
   - Simple path: small/easy change, limited blast radius.
   - Complex path: larger change, multi-module risk, or unclear feasibility.
4. For Simple path:
   - Review directly in Codex (no Claude round-trip file required).
   - Classify findings as Blocking, Important, or Minor.
   - Update plan only if needed; if updated, write `./<plan-dir>/<feature>.plan.vN+1.md`.
   - Write summary to `./<plan-dir>/reviews/simple-review.codex.md`.
   - Verify persistence and, if gate passes, directly prompt user to execute `hd2yao-feature-implementation-delivery`.
5. For Complex path:
   - Set current review round index `N`.
   - Generate `./<plan-dir>/reviews/round-0N.claude-review-request.md` using the template in this skill.
   - Ask user to send only that request file to Claude (no extra explanation required).
   - Wait for Claude output file: `./<plan-dir>/reviews/round-0N.claude.md`.
   - If Claude output file is missing but raw Claude review text is available, persist that text verbatim to the expected file path before continuing.
   - If neither file nor raw Claude review text is available, stop and ask user to provide one of them.
   - Classify Claude findings as Blocking, Important, or Minor.
   - Update the plan and write next version: `./<plan-dir>/<feature>.plan.vN+1.md`.
   - Write resolution mapping file: `./<plan-dir>/reviews/round-0N.codex-resolution.md`.
   - Verify persistence for all round artifacts and next plan version.
   - Report saved paths and repeat until no blocking comments remain.

## Complexity Triage Standard

Default to **Simple path** only when all conditions are true:
- Estimated change scope is small and localized (typically <=2 modules/files of substantive logic).
- No schema migration, auth/security model change, or cross-system contract change.
- No high-risk rollback concern.
- Plan tasks are straightforward and implementation uncertainty is low.

Use **Complex path** when any condition above is not met.

## Output

Primary output:
- If plan changed: `./<plan-dir>/<feature>.plan.vN+1.md`
- If plan unchanged: reuse latest plan path and record decision in review output.

Simple path artifact (required):
- `./<plan-dir>/reviews/simple-review.codex.md`

Complex path artifacts (required only for complex path):
- `./<plan-dir>/reviews/round-0N.claude-review-request.md`
- `./<plan-dir>/reviews/round-0N.claude.md`
- `./<plan-dir>/reviews/round-0N.codex-resolution.md`

Include this section:

```markdown
## Review Log

| ID | Severity | Comment | Decision | Notes | Status |
|----|----------|---------|----------|-------|--------|
```

## Claude Review Request Template

The generated `round-0N.claude-review-request.md` MUST be complete and directly usable by Claude:

```markdown
# Claude Plan Review Request (Round 0N)

You are reviewing this plan file:
- `<PLAN_FILE_PATH>`

Required output file path:
- `<CLAUDE_OUTPUT_FILE_PATH>`

Your task:
1. Read the entire plan.
2. Review for correctness, completeness, feasibility, rollback safety, and testability.
3. Output only concrete findings with severity.
4. Do not rewrite the whole plan.

Severity rules:
- Blocking: prevents safe implementation or likely causes incorrect behavior.
- Important: should be fixed before implementation but not immediately catastrophic.
- Minor: clarity/style improvements.

Output format (use exactly):

## Findings
| ID | Severity | Section | Issue | Suggested Change |
|----|----------|---------|-------|------------------|

## Summary
- Blocking count:
- Important count:
- Minor count:
- Verdict: BLOCKED or READY_FOR_NEXT_ROUND

Rules:
- Each finding must include a specific suggested change.
- Keep IDs stable in this round (e.g., `C-R0N-001`).
- No vague comments.
- You MUST write the final review content to `<CLAUDE_OUTPUT_FILE_PATH>` (not chat-only output).
- Verify the file exists before your final response.

Final response must be short:
- `Saved file: <CLAUDE_OUTPUT_FILE_PATH>`
- `Blocking: <count>, Important: <count>, Minor: <count>`
```

## Mandatory Persistence Rule

- Every iteration must persist review results to disk.
- Simple path must create `simple-review.codex.md`.
- Complex path must create the request file, Claude output file, Codex resolution file, and next plan version.
- For Complex path, Claude review text is not valid until it is present in `round-0N.claude.md`.
- Chat-only review summaries do not satisfy this skill's output requirement.
- If file write or verification fails, report the blocker and stop. Do not hand off.

## Quality Gate

Implementation can start only when:
- Blocking comments count is 0.
- Important comments are resolved or explicitly deferred.
- Decisions are documented in a review log (inside updated plan or `simple-review.codex.md`).
- For Simple path: `simple-review.codex.md` exists and plan path is reported.
- For Complex path: latest Claude review exists and round artifacts are complete under `./<plan-dir>/reviews/`.

## Single-Use Mode

If user asks for one pass only, run one iteration and stop after writing required artifacts for the selected path.

## Handoff

When approved, invoke `hd2yao-feature-implementation-delivery`.
