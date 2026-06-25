# web-skill-flow-builder discovery

## Goal

Create the child skill that the main hub uses to generate process-specific child skills from a concrete website workflow. This is the missing layer between generic execution skills and site-specific reusable skills.

## Baseline Failure Before This Skill

Without a flow builder, an agent may:

- create a new generic login/click/submit skill for every new URL
- treat every site as a permanent skill before a flow has been validated
- produce only a run report instead of a reusable child skill draft
- copy credentials, cookies, tokens, or private run data into the generated skill
- fail to separate reusable generic capabilities from site-specific process steps

## Intended Architecture

Generic skills are created once:

- `web-skill-automation-hub`
- `web-skill-generic-login`
- `web-skill-challenge-router`
- `web-skill-page-workflow`
- `web-skill-submit-guard`
- `web-skill-template-draft`

For each new URL or workflow, the hub first runs the generic skills. Only after the workflow is understood or validated should this skill draft one site/process-specific child skill, such as `job51-end-production-flow` or `example-read-orders-flow`.

## Boundaries

This skill creates process child skill drafts. It does not solve captchas, execute browser actions, or publish drafts as verified skills without user approval.
