# web-skill-template-draft discovery

## Goal

Create a child skill that turns a successful Web Skill Automation Hub run record into a reusable flow skill draft.

## Baseline Failure Before This Skill

Without a template draft skill, an agent may:

- summarize the run in prose instead of producing reusable steps
- copy secrets, cookies, tokens, or private records into the draft
- overfit selectors to a single accidental DOM state
- omit inputs, outputs, success conditions, or risk level
- mark a draft as production-ready before the user validates it on another run

## Boundaries

This skill creates drafts only. It does not execute the new flow, create credentials, bypass site controls, or automatically publish a finished skill.

## Integration Notes

The main hub should call this skill only after a successful or partially successful run with enough screenshots, step logs, and result evidence to explain the reusable process.
