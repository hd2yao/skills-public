---
name: hd2yao-feature-tech-plan-planmode
description: Use when a feature discovery summary exists and a detailed implementation plan is needed in plan mode, including frontend design when UI is involved.
---

# HD2YAO Feature Tech Plan (Plan Mode)

## Overview

Convert discovery into an executable implementation plan.

**Announce at start:** "I'm using hd2yao-feature-tech-plan-planmode to build a detailed plan in plan mode."

<HARD-GATE>
Do not finish this skill with chat-only content. You MUST write the plan file to disk and verify it exists before handoff.
</HARD-GATE>

## Process

1. Load `./<feature>.discovery.md` if available.
2. If missing, create a minimal assumptions section and continue.
3. Build a detailed plan with exact files, tests, and rollback path.
4. If frontend is involved, include dedicated frontend design sections.
5. Write the plan to disk in the current repository root.
6. Verify persistence with `test -f ./<feature>.plan.v1.md` (or the selected plan version file).
7. Report the saved file path before handoff.

## Output

Save to: `./<feature>.plan.v1.md`

Required sections:

```markdown
# <Feature> Implementation Plan

## Goal

## Scope

## Architecture

## Backend Changes

## Frontend Design (required when UI is involved)
- Information architecture
- States and interactions
- Responsive behavior
- Accessibility
- Validation screenshot points

## Data and API Changes

## Task Breakdown

## Test Strategy

## Rollback Plan

## Risks and Mitigations
```

## Mandatory Persistence Rule

- Writing to disk is required, not optional.
- Chat-only plan output is not sufficient.
- If file write or verification fails, report the blocker and stop. Do not hand off.

## Quality Gate

Do not hand off to implementation until:
- Tasks are independently executable.
- Tests are mapped to acceptance criteria.
- Rollback strategy is actionable.
- The plan markdown file exists on disk and its path has been reported.

## Handoff

Invoke `hd2yao-feature-plan-review-iteration` for review-driven version updates.
