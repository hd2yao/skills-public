# web-skill-submit-guard discovery

## Goal

Create a submit guard child skill for high-risk web automation actions. It should require explicit confirmation, capture before/after evidence, and prevent accidental repeated submissions.

## Baseline Failure Before This Skill

Without a submit guard, an agent may:

- treat "fill and submit" as a single low-risk step
- click final submit before showing the prepared state
- fail to show the exact content or target that will be submitted
- retry a failed submit without asking the user again
- finish without after-submit evidence or result status

## Boundaries

This skill handles confirmation and execution of one high-risk action at a time. It does not decide whether the user is authorized, solve login challenges, or generate templates.

## Integration Notes

`web-skill-page-workflow` should stop before submit-class actions and return `submit_guard_required: true`. The main hub should call this skill only when the user explicitly allowed submit-class work for the task.
